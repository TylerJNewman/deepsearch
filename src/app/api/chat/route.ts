import type { Message } from "ai";
import {
  streamText,
  createDataStreamResponse,
  appendResponseMessages,
} from "ai";
import { z } from "zod";
import { Langfuse } from "langfuse";
import { env } from "~/env";
import { model } from "../../../models";
import { auth } from "~/server/auth";
import { searchTavily, type TavilyTool } from "~/tavily";
import { scrapePages } from "~/scraper";
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

      const result = streamText({
        model,
        system: `You are a thorough research assistant. Current date: ${new Date().toISOString().split('T')[0]} (${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})

## Core Behavior:
1. **Always search the web** for up-to-date information when relevant
2. **ALWAYS format URLs as markdown links** using [title](url) format
3. **Be thorough but concise** in your responses
4. **If unsure, search to verify** information
5. **Always include sources** using markdown links - NEVER raw URLs
6. **Use current date context** when providing recent information

## Research Process:
- **Multiple searches** with different queries for comprehensive coverage
- **Scrape 5-10+ URLs per search** from diverse sources (news, docs, academic, forums, blogs)
- **Use timeRange filters** for recent information (day/week for current events)
- **Never rely on snippets alone** - get full page content
- **Include publication dates** when discussing recency

## Available Tools:
- **searchWeb**: Find sources (use timeRange for recent info)
- **scrapePages**: Get full content from URLs

Remember: Always use markdown links [title](url), never raw URLs. Be comprehensive in research but concise in presentation.`,
        messages,
        tools: {
          searchWeb: {
            parameters: z.object({
              query: z.string().describe("The query to search the web for"),
              searchDepth: z.enum(["basic", "advanced"]).optional().describe("Search depth - 'advanced' for more comprehensive results"),
              topic: z.enum(["general", "news", "finance"]).optional().describe("Search topic category"),
              timeRange: z.enum(["day", "week", "month", "year"]).optional().describe("Time range for recent results - use 'day' or 'week' for very recent information"),
            }),
            execute: async ({ query, searchDepth, topic, timeRange }, { abortSignal }) => {
              const results = await searchTavily(
                { 
                  query,
                  maxResults: 10,
                  searchDepth: searchDepth ?? "advanced", // Default to advanced for better results
                  topic: topic ?? "general",
                  timeRange: timeRange, // Allow filtering by time range for recent results
                  includeAnswer: true, // Get LLM-generated answer
                  includeImages: false, // Keep response focused for now
                  includeRawContent: false, // Keep response size manageable
                },
                abortSignal,
              );

              // Return comprehensive search data including the AI answer
              return {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                query: results.query,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                answer: results.answer, // AI-generated answer (like knowledge graph)
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                searchParameters: results.searchParameters,
                results: results.results.map((result: TavilyTool.SearchResult) => ({
                  title: result.title,
                  url: result.url,
                  content: result.content,
                  score: result.score,
                  publishedDate: result.publishedDate,
                  favicon: result.favicon,
                })),
                responseTime: results.responseTime,
                autoParameters: results.autoParameters,
              };
            },
          },
          scrapePages: {
            parameters: z.object({
              urls: z.array(z.string()).describe("Array of URLs to scrape for full content"),
              maxRetries: z.number().optional().describe("Maximum number of retry attempts per URL (default: 3)"),
            }),
            execute: async ({ urls, maxRetries }) => {
              const result = await scrapePages({ urls, maxRetries });
              return result;
            },
          },
        },
        maxSteps: 10,
        experimental_telemetry: {
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