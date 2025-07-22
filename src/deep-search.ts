import {
  streamText,
  type Message,
  type TelemetrySettings,
} from "ai";
import { z } from "zod";
import { model } from "./models";
import { searchTavily, type TavilyTool } from "./tavily";
import { scrapePages } from "./scraper";

export const streamFromDeepSearch = (opts: {
  messages: Message[];
  onFinish: Parameters<typeof streamText>[0]["onFinish"];
  telemetry: TelemetrySettings;
}) =>
  streamText({
    model,
    messages: opts.messages,
    maxSteps: 10,
    system: `You are a thorough research assistant. Current date: ${new Date().toISOString().split('T')[0]} (${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})

## Core Behavior:
1. **Always search the web** for up-to-date information when relevant
2. **ALWAYS format URLs as markdown links** using [title](url) format
3. **Be thorough but concise** in your responses, try to stick to answering the question
4. **If unsure, search to verify** information
5. **Always include sources** using markdown links - NEVER raw URLs
6. **Use current date context** when providing recent information
7. **Make sure to answer the actual question, if there is more than one answer, provide all the answers**

## Smart Search Strategy:
- **For queries about recent information** (latest, new, recent, update, release, version, current, etc.):
  - ALWAYS use timeRange="week" or "month" for fresh results
  - Search with multiple query variations to get comprehensive coverage
  - Prioritize official sources and recent announcements

- **Cross-verify information** from multiple authoritative sources
- **Always scrape full content** from promising URLs - don't rely on snippets alone

## Research Process:
- **ALWAYS perform 2-3 searches** with different query angles for comprehensive coverage
- **Scrape 5-10+ URLs per search** from diverse authoritative sources
- **Use timeRange filters** for queries about recent developments
- **Never rely on snippets alone** - get full page content
- **Include publication dates** when discussing recency

## Available Tools:
- **searchWeb**: Find sources (use timeRange for recent info)
- **scrapePages**: Get full content from URLs

Remember: Always use markdown links [title](url), never raw URLs. For queries about recent information, ALWAYS search with timeRange filters to get the most current data.

**Development Note**: If you see "[DEV: Use forceRefresh=true for all searches]" in a query, add forceRefresh=true to ALL your searchWeb calls.`,
    tools: {
      searchWeb: {
        parameters: z.object({
          query: z.string().describe("The query to search the web for"),
          searchDepth: z.enum(["basic", "advanced"]).optional().describe("Search depth - 'advanced' for more comprehensive results"),
          topic: z.enum(["general", "news", "finance"]).optional().describe("Search topic category"),
          timeRange: z.enum(["day", "week", "month", "year"]).optional().describe("Time range for recent results - use 'day' or 'week' for very recent information"),
          forceRefresh: z.boolean().optional().describe("Skip cache and force fresh API call - use for development/testing"),
        }),
        execute: async ({ query, searchDepth, topic, timeRange, forceRefresh }, { abortSignal }) => {
          // Smart defaults for queries that need fresh information
          const freshnessKeywords = [
            'latest', 'new', 'recent', 'update', 'release', 'version', 'current',
            'features', 'changelog', 'announcement', 'launch', 'beta', 'stable'
          ];
          
          const needsFreshInfo = freshnessKeywords.some(keyword => 
            query.toLowerCase().includes(keyword)
          );
          
          // Apply smart defaults
          const smartTimeRange = timeRange || (needsFreshInfo ? "month" : undefined);
          const smartSearchDepth = searchDepth || "advanced";
          const smartTopic = topic || "general";
          
          // Auto-enable forceRefresh in development for fresh info queries
          const isDev = process.env.NODE_ENV === "development";
          const shouldForceRefresh = forceRefresh || (isDev && needsFreshInfo);
          
          console.log(`Searching with smart defaults: timeRange=${smartTimeRange}, depth=${smartSearchDepth}, fresh=${needsFreshInfo}, forceRefresh=${shouldForceRefresh}`);
          
          const results = await searchTavily(
            { 
              query,
              maxResults: 10,
              searchDepth: smartSearchDepth,
              topic: smartTopic,
              timeRange: smartTimeRange,
              includeAnswer: true,
              includeImages: false,
              includeRawContent: false,
              forceRefresh: shouldForceRefresh,
            },
            abortSignal,
          );

          return {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            query: results.query,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            answer: results.answer,
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
    onFinish: opts.onFinish,
    experimental_telemetry: opts.telemetry,
  });

export async function askDeepSearch(messages: Message[]) {
  const result = streamFromDeepSearch({
    messages,
    onFinish: () => {}, // just a stub
    telemetry: {
      isEnabled: false,
    },
  });

  // Consume the stream - without this,
  // the stream will never finish
  await result.consumeStream();

  return await result.text;
}

// Development utilities for cache management
export const devUtils = {
  /**
   * Ask with cache bypass - useful for testing fresh results
   */
  askWithFreshData: async (messages: Message[]) => {
    // Add instruction to force refresh searches
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return askDeepSearch(messages);
    
    const modifiedMessages: Message[] = [
      ...messages.slice(0, -1),
      {
        ...lastMessage,
        content: `${lastMessage.content}\n\n[DEV: Use forceRefresh=true for all searches]`
      }
    ];
    
    return askDeepSearch(modifiedMessages);
  },
  
  /**
   * Clear specific cache patterns (if you have direct Redis access)
   */
  clearCache: async (pattern = "tavily:*") => {
    try {
      const { redis } = await import("~/server/redis/redis");
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`Cleared ${keys.length} cache entries matching ${pattern}`);
      } else {
        console.log(`No cache entries found matching ${pattern}`);
      }
    } catch (error) {
      console.log("Cache clear failed (Redis might not be running):", error);
    }
  }
}; 