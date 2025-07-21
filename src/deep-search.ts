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
              searchDepth: searchDepth ?? "advanced",
              topic: topic ?? "general",
              timeRange: timeRange,
              includeAnswer: true,
              includeImages: false,
              includeRawContent: false,
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