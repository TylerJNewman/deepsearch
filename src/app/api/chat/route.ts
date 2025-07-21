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
import { upsertChat, getUserTodayRequestCount, recordUserRequest, isUserAdmin } from "~/server/db/queries";

const langfuse = new Langfuse({
  environment: env.NODE_ENV,
});

export const maxDuration = 60;

// Rate limit configuration
const DAILY_REQUEST_LIMIT = 1; // Regular users can make 50 requests per day

export async function POST(request: Request) {
  const session = await auth();
  
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json() as { 
    messages: Array<Message>; 
    chatId: string;
    isNewChat?: boolean;
  };
  const { messages, chatId, isNewChat } = body;

  // Create Langfuse trace - we'll update sessionId later
  const trace = langfuse.trace({
    name: "chat",
    userId: session.user.id,
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
      output: { requestCount: todayRequestCount, dailyLimit: DAILY_REQUEST_LIMIT },
    });
    
    if (todayRequestCount >= DAILY_REQUEST_LIMIT) {
      const errorResponse = {
        error: "Rate limit exceeded",
        message: `You have reached the daily limit of ${DAILY_REQUEST_LIMIT} requests. Please try again tomorrow.`,
        requestsToday: todayRequestCount,
        dailyLimit: DAILY_REQUEST_LIMIT,
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
      
      return new Response(
        JSON.stringify(errorResponse),
        { 
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": DAILY_REQUEST_LIMIT.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": errorResponse.resetTime,
          },
        }
      );
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

      // Create the chat immediately if it's a new chat (before streaming)
      // This protects against broken streams, timeouts, or cancellations
      if (isNewChat) {
        // Send the new chat ID to the frontend
        dataStream.writeData({
          type: "NEW_CHAT_CREATED",
          chatId: chatId,
        });

        const lastMessage = messages[messages.length - 1];
        const createChatSpan = trace.span({
          name: "create-initial-chat",
          input: {
            userId: session.user.id,
            chatId: chatId,
            messageCount: messages.length,
            title: lastMessage?.content?.slice(0, 100) ?? "New Chat",
          },
        });
        await upsertChat({
          userId: session.user.id,
          chatId: chatId,
          messages: messages,
          title: lastMessage?.content?.slice(0, 100) ?? "New Chat",
        });
        createChatSpan.end({
          output: { success: true, chatId: chatId },
        });
      }

      const result = streamFromDeepSearch({
        messages,
        telemetry: {
          isEnabled: true,
          functionId: "agent",
          metadata: {
            langfuseTraceId: trace.id,
          },
        },
        onFinish: async ({ response }) => {
          // Merge the existing messages with the response messages
          // This handles tool call results and maintains proper message history
          const updatedMessages = appendResponseMessages({
            messages,
            responseMessages: response.messages,
          });

          const lastUserMessage = messages[messages.length - 1];
          if (!lastUserMessage) {
            return;
          }

          // Save the complete chat history with all messages
          // This replaces all existing messages with the updated ones
          const saveChatSpan = trace.span({
            name: "save-final-chat",
            input: {
              userId: session.user.id,
              chatId: chatId,
              messageCount: updatedMessages.length,
              title: lastUserMessage.content?.slice(0, 100) ?? "New Chat",
            },
          });
          await upsertChat({
            userId: session.user.id,
            chatId: chatId,
            messages: updatedMessages,
            title: lastUserMessage.content?.slice(0, 100) ?? "New Chat",
          });
          saveChatSpan.end({
            output: { success: true, finalMessageCount: updatedMessages.length },
          });

          // Flush the trace to Langfuse
          await langfuse.flushAsync();
        },
      });

      result.mergeIntoDataStream(dataStream);
    },
    onError: (e) => {
      console.error(e);
      return "Oops, an error occured!";
    },
  });
} 