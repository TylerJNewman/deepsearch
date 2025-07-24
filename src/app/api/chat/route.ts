import type { Message } from "ai";
import {
  createDataStreamResponse,
  appendResponseMessages,
} from "ai";
import { Langfuse } from "langfuse";
import { env } from "~/env";
import { model } from "../../../models";
import { auth } from "~/server/auth";
import { streamFromDeepSearch } from "~/deep-search";
import type { OurMessageAnnotation } from "~/deep-search/get-next-action";
import { upsertChat, getUserTodayRequestCount, recordUserRequest, isUserAdmin } from "~/server/db/queries";
import { checkRateLimit, recordRateLimit, type RateLimitConfig } from "~/rate-limit";
import { generateChatTitle } from "~/utils";

const langfuse = new Langfuse({
  environment: env.NODE_ENV,
});

export const maxDuration = 60;

// Global LLM rate limit configuration (for testing)
const GLOBAL_RATE_LIMIT_CONFIG: RateLimitConfig = {
  maxRequests: env.GLOBAL_RATE_LIMIT_MAX_REQUESTS,
  windowMs: env.GLOBAL_RATE_LIMIT_WINDOW_MS,
  keyPrefix: "global_llm_rate_limit",
  maxRetries: 3,
};

export async function POST(request: Request) {
  console.log("Chat API called at:", new Date().toISOString());
  
  // Global LLM rate limiting check (before authentication for security)
  const rateLimitCheck = await checkRateLimit(GLOBAL_RATE_LIMIT_CONFIG);
  
  if (!rateLimitCheck.allowed) {
    console.log("Global rate limit exceeded, waiting for reset...");
    const isAllowed = await rateLimitCheck.retry();
    
    if (!isAllowed) {
      console.log("Rate limit retry failed, returning 429");
      return new Response(
        JSON.stringify({
          error: "Global rate limit exceeded",
          message: "Too many requests are being made globally. Please try again later.",
          resetTime: new Date(rateLimitCheck.resetTime).toISOString(),
        }),
        { 
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Reset": new Date(rateLimitCheck.resetTime).toISOString(),
          },
        }
      );
    }
  }
  
  // Record the global rate limit usage
  await recordRateLimit(GLOBAL_RATE_LIMIT_CONFIG);

  const session = await auth();
  console.log("Auth session:", session?.user ? "Valid" : "Invalid");
  
  if (!session?.user) {
    console.log("Unauthorized request");
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json() as { 
    messages: Array<Message>; 
    chatId: string;
    isNewChat?: boolean;
  };
  const { messages, chatId, isNewChat } = body;
  console.log("Request body:", { 
    messageCount: messages.length, 
    chatId, 
    isNewChat,
    lastMessage: messages[messages.length - 1]?.content?.slice(0, 100)
  });

  // Create Langfuse trace - we'll update sessionId later
  const trace = langfuse.trace({
    name: "chat",
    userId: session.user.id,
  });

  // Add tracing for the rate limit check that already happened
  const globalRateLimitSpan = trace.span({
    name: "global-rate-limit-check",
    input: { config: GLOBAL_RATE_LIMIT_CONFIG },
  });
  globalRateLimitSpan.end({
    output: { 
      allowed: true, 
      remaining: rateLimitCheck.remaining,
      totalHits: rateLimitCheck.totalHits 
    },
  });

  // Check if user is admin
  const checkAdminSpan = trace.span({
    name: "check-user-admin",
    input: { userId: session.user.id },
  });
  const userIsAdmin = await isUserAdmin(session.user.id);
  checkAdminSpan.end({
    output: { isAdmin: userIsAdmin },
  });

  // Rate limiting check (skip for admins)
  if (!userIsAdmin) {
    const getRateSpan = trace.span({
      name: "get-user-request-count",
      input: { userId: session.user.id },
    });
    const todayRequestCount = await getUserTodayRequestCount(session.user.id);
    getRateSpan.end({
      output: {
        requestCount: todayRequestCount,
        dailyLimit: env.DAILY_REQUEST_LIMIT,
      },
    });

    if (todayRequestCount >= env.DAILY_REQUEST_LIMIT) {
      const errorResponse = {
        error: "Rate limit exceeded",
        message: `You have reached the daily limit of ${env.DAILY_REQUEST_LIMIT} requests. Please try again tomorrow.`,
        requestsToday: todayRequestCount,
        dailyLimit: env.DAILY_REQUEST_LIMIT,
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": env.DAILY_REQUEST_LIMIT.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": errorResponse.resetTime,
        },
      });
    }
  }

  // Record the request (for both admins and regular users for analytics)
  const recordRequestSpan = trace.span({
    name: "record-user-request",
    input: { userId: session.user.id },
  });
  await recordUserRequest(session.user.id);
  recordRequestSpan.end({
    output: { recorded: true },
  });

  return createDataStreamResponse({
    execute: async (dataStream) => {
      // Update trace with sessionId now that we have chatId
      trace.update({
        sessionId: chatId,
      });

      // Store annotations for the current conversation
      const annotations: OurMessageAnnotation[] = [];

      // Set up title generation for new chats
      let titlePromise: Promise<string> | undefined;

      if (isNewChat) {
        // Send the new chat ID to the frontend
        dataStream.writeData({
          type: "NEW_CHAT_CREATED",
          chatId: chatId,
        });

        // Start generating the title in parallel
        titlePromise = generateChatTitle(messages);

        // Create the chat immediately with a placeholder title
        const createChatSpan = trace.span({
          name: "create-initial-chat",
          input: {
            userId: session.user.id,
            chatId: chatId,
            messageCount: messages.length,
            title: "Generating...",
          },
        });
        await upsertChat({
          userId: session.user.id,
          chatId: chatId,
          messages: messages,
          title: "Generating...",
        });
        createChatSpan.end({
          output: { success: true, chatId: chatId },
        });
      } else {
        // For existing chats, resolve with empty string
        titlePromise = Promise.resolve("");
      }

      const writeMessageAnnotation = (annotation: OurMessageAnnotation) => {
        // Save the annotation in-memory
        annotations.push(annotation);
        // Send it to the client
        dataStream.writeMessageAnnotation(annotation);
      };

      const result = await streamFromDeepSearch({
        messages,
        telemetry: {
          isEnabled: true,
          functionId: "agent",
          metadata: {
            langfuseTraceId: trace.id,
          },
        },
        writeMessageAnnotation: writeMessageAnnotation,
        onFinish: async (finishResult) => {
          try {
            // Get the final text from the result
            const assistantMessage: Message = {
              id: crypto.randomUUID(),
              role: "assistant",
              content: finishResult.text,
              annotations: annotations.length > 0 ? annotations : undefined,
            };

            // Add the assistant message to our messages array
            const updatedMessages = [...messages, assistantMessage];

            // Resolve the title promise if it exists
            const title = titlePromise ? await titlePromise : "";

            // Persist the updated conversation to the database
            await upsertChat({
              userId: session.user.id,
              chatId: chatId,
              messages: updatedMessages,
              ...(title && { title }), // Only save the title if it's not empty
            });

            // Send the title update to the frontend if we have a new title
            if (title && isNewChat) {
              dataStream.writeData({
                type: "TITLE_UPDATED",
                chatId: chatId,
                title: title,
              });
            }
          } catch (error) {
            console.error("Failed to persist conversation:", error);
          }

          // Flush the trace to Langfuse
          await langfuse.flushAsync();
        },
      });

      result.mergeIntoDataStream(dataStream);
    },
    onError: (e) => {
      console.error("Stream error:", e);
      return "Oops, an error occurred!";
    },
  });
} 