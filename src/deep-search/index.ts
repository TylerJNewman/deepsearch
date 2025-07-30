import type {
	Message,
	TelemetrySettings,
	StreamTextResult,
	LanguageModelUsage,
} from "ai";
import type { streamText } from "ai";
import { z } from "zod";
import { model } from "../models";
import { searchTavily, type TavilyTool } from "../tavily";
import { DEEP_SEARCH_SYSTEM_PROMPT } from "./system-prompt";
import { env } from "~/env";
import { runAgentLoop } from "./run-agent-loop";
import type { OurMessageAnnotation } from "./get-next-action";

export const streamFromDeepSearch = async (opts: {
	messages: Message[];
	onFinish?: (result: { text: string; finishReason: string; usage: LanguageModelUsage; response: unknown }) => Promise<void> | void;
	telemetry: TelemetrySettings;
	writeMessageAnnotation?: (annotation: OurMessageAnnotation) => void;
	location?: {
		latitude?: string;
		longitude?: string;
		city?: string;
		country?: string;
	};
}): Promise<StreamTextResult<Record<string, never>, string>> => {
	return runAgentLoop({
		messages: opts.messages,
		maxSteps: env.MAX_STEPS,
		langfuseTraceId: typeof opts.telemetry.metadata?.langfuseTraceId === 'string' 
			? opts.telemetry.metadata.langfuseTraceId 
			: undefined,
		writeMessageAnnotation: opts.writeMessageAnnotation,
		onFinish: opts.onFinish,
		location: opts.location,
	});
};

export async function askDeepSearch(messages: Message[]) {
	const result = await streamFromDeepSearch({
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
