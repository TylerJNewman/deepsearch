import { generateObject } from "ai";
import { z } from "zod";
import { model } from "../models";
import type { SystemContext } from "./system-context";

// Action types
export interface SearchAction {
	type: "search";
	query: string;
}

export interface ScrapeAction {
	type: "scrape";
	urls: string[];
}

export interface AnswerAction {
	type: "answer";
}

export type Action = SearchAction | ScrapeAction | AnswerAction;

// Zod schema for structured outputs
export const actionSchema = z.object({
	type: z
		.enum(["search", "scrape", "answer"])
		.describe(
			`The type of action to take.
      - 'search': Search the web for more information.
      - 'scrape': Scrape a URL.
      - 'answer': Answer the user's question and complete the loop.`,
		),
	query: z
		.string()
		.describe(
			"The query to search for. Required if type is 'search'.",
		)
		.optional(),
	urls: z
		.array(z.string())
		.describe(
			"The URLs to scrape. Required if type is 'scrape'.",
		)
		.optional(),
});

export const getNextAction = async (
	context: SystemContext,
) => {
	const result = await generateObject({
		model,
		schema: actionSchema,
		prompt: `
You are an AI research assistant that must decide the next action to take based on the current research context.

Your goal is to determine whether you need to:
1. Search the web for more information
2. Scrape specific URLs for detailed content
3. Answer the user's question and complete the research loop

Current step: ${context.getCurrentStep()}

Query history:
${context.getQueryHistory()}

Scrape history:
${context.getScrapeHistory()}

Decision criteria:
- Choose "search" if you need more information or haven't found sufficient sources
- Choose "scrape" if you have URLs from previous searches that need detailed content
- Choose "answer" only when you have enough information to fully address the user's question

Remember: You have a maximum of 10 steps. Be strategic about when to answer vs. continuing research.
		`,
	});

	return result.object as Action;
};
