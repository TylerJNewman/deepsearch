import { tavily } from "@tavily/core";
import { cacheWithRedis } from "~/server/redis/redis";
import { env } from "~/env.js";

export declare namespace TavilyTool {
  export type SearchInput = {
    query: string;
    maxResults?: number;
    searchDepth?: "basic" | "advanced";
    topic?: "general" | "news" | "finance";
    includeAnswer?: boolean;
    includeImages?: boolean;
    includeImageDescriptions?: boolean;
    includeRawContent?: false | "markdown" | "text";
    includeDomains?: string[];
    excludeDomains?: string[];
    timeRange?: "day" | "week" | "month" | "year" | "d" | "w" | "m" | "y";
    days?: number;
    country?: string;
  };

  export interface SearchResult {
    title: string;
    url: string;
    content: string;
    score: number;
    publishedDate?: string;
    rawContent?: string;
    favicon?: string;
  }

  export interface ImageResult {
    url: string;
    description?: string;
  }

  export interface SearchParameters {
    query: string;
    searchDepth: string;
    topic: string;
    maxResults: number;
  }

  export interface TavilySearchResponse {
    query: string;
    searchParameters: SearchParameters;
    results: SearchResult[];
    responseTime: number;
    answer?: string; // LLM-generated answer (like knowledge graph summary)
    images?: ImageResult[];
    autoParameters?: {
      topic: string;
      searchDepth: string;
    };
  }
}

const fetchFromTavily = cacheWithRedis(
  "tavily",
  async (
    searchInput: TavilyTool.SearchInput,
    signal: AbortSignal | undefined,
  ): Promise<TavilyTool.TavilySearchResponse> => {
    if (!env.TAVILY_API_KEY) {
      throw new Error("TAVILY_API_KEY is not set in .env");
    }

    // Initialize Tavily client
    const tvly = tavily({ apiKey: env.TAVILY_API_KEY });

    try {
      // Perform search with Tavily - using more comprehensive options
      const response = await tvly.search(searchInput.query, {
        maxResults: searchInput.maxResults || 10,
        searchDepth: searchInput.searchDepth || "basic",
        topic: searchInput.topic || "general",
        includeAnswer: searchInput.includeAnswer || false,
        includeImages: searchInput.includeImages || false,
        includeImageDescriptions: searchInput.includeImageDescriptions || false,
        includeRawContent: searchInput.includeRawContent || false,
        includeDomains: searchInput.includeDomains || [],
        excludeDomains: searchInput.excludeDomains || [],
        timeRange: searchInput.timeRange,
        days: searchInput.days,
        country: searchInput.country,
        includeFavicon: true, // Always include favicons for better UX
      });

      // Transform response to match our expected format with enhanced data
      return {
        query: response.query,
        searchParameters: {
          query: searchInput.query,
          searchDepth: searchInput.searchDepth || "basic",
          topic: searchInput.topic || "general",
          maxResults: searchInput.maxResults || 10,
        },
        results: response.results.map((result: {
          title: string;
          url: string;
          content: string;
          score: number;
          publishedDate?: string;
          rawContent?: string;
          favicon?: string;
        }) => ({
          title: result.title,
          url: result.url,
          content: result.content,
          score: result.score,
          publishedDate: result.publishedDate,
          rawContent: result.rawContent,
          favicon: result.favicon,
        })),
        responseTime: response.responseTime,
        answer: response.answer, // LLM-generated answer (replaces knowledge graph)
        images: response.images,
        autoParameters: {
          topic: response.autoParameters?.topic || searchInput.topic || "general",
          searchDepth: response.autoParameters?.searchDepth || searchInput.searchDepth || "basic",
        },
      };
    } catch (error) {
      throw new Error(`Tavily API error: ${error}`);
    }
  },
);

export const searchTavily = async (
  searchInput: TavilyTool.SearchInput,
  signal: AbortSignal | undefined,
): Promise<TavilyTool.TavilySearchResponse> => {
  const results = await fetchFromTavily(searchInput, signal);
  return results;
}; 