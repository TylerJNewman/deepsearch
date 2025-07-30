import { generateText } from "ai";
import { summarizationModel } from "../models";
import { cacheWithRedis } from "~/server/redis/redis";

export interface SummarizeURLOptions {
	conversationHistory: string;
	scrapedContent: string;
	searchMetadata: {
		date?: string;
		title: string;
		url: string;
		snippet: string;
	};
	query: string;
	langfuseTraceId?: string;
}

const SUMMARIZATION_PROMPT = `You are a research extraction specialist. Given a research topic and raw web content, create a thoroughly detailed synthesis as a cohesive narrative that flows naturally between key concepts.

Extract the most valuable information related to the research topic, including relevant facts, statistics, methodologies, claims, and contextual information. Preserve technical terminology and domain-specific language from the source material.

Structure your synthesis as a coherent document with natural transitions between ideas. Begin with an introduction that captures the core thesis and purpose of the source material. Develop the narrative by weaving together key findings and their supporting details, ensuring each concept flows logically to the next.

Integrate specific metrics, dates, and quantitative information within their proper context. Explore how concepts interconnect within the source material, highlighting meaningful relationships between ideas. Acknowledge limitations by noting where information related to aspects of the research topic may be missing or incomplete.

Important guidelines:
- Maintain original data context (e.g., "2024 study of 150 patients" rather than generic "recent study")
- Preserve the integrity of information by keeping details anchored to their original context
- Create a cohesive narrative rather than disconnected bullet points or lists
- Use paragraph breaks only when transitioning between major themes

Critical Reminder: If content lacks a specific aspect of the research topic, clearly state that in the synthesis, and you should NEVER make up information and NEVER rely on external knowledge.`;

const summarizeURLWithAI = async (options: SummarizeURLOptions): Promise<string> => {
	const { conversationHistory, scrapedContent, searchMetadata, query, langfuseTraceId } = options;

	// Conversation history is already formatted
	const conversationContext = conversationHistory;

	const result = await generateText({
		model: summarizationModel,
		prompt: `${SUMMARIZATION_PROMPT}

Research Topic: ${query}

Conversation Context:
${conversationContext}

Source Information:
- Title: ${searchMetadata.title}
- URL: ${searchMetadata.url}
- Date: ${searchMetadata.date || "Unknown"}
- Snippet: ${searchMetadata.snippet}

Raw Content to Summarize:
${scrapedContent}

Please provide a comprehensive synthesis of the above content in relation to the research topic.`,
		experimental_telemetry: langfuseTraceId
			? {
					isEnabled: true,
					functionId: "summarize-url",
					metadata: {
						langfuseTraceId: langfuseTraceId,
						url: searchMetadata.url,
						query: query,
					},
			  }
			: undefined,
	});

	return result.text;
};

// Cached version of the summarize function
export const summarizeURL = cacheWithRedis(
	"summarizeURL",
	summarizeURLWithAI,
	{
		getDuration: (options: SummarizeURLOptions) => {
			// Summaries can be cached longer since they're derived from scraped content
			// which already has its own cache duration
			return 60 * 60 * 12; // 12 hours
		},
		shouldSkipCache: (options: SummarizeURLOptions) => {
			// We could add logic here to skip cache for certain conditions
			// For now, always cache
			return false;
		},
	}
); 