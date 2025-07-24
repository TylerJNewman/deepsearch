import { SystemContext } from "./system-context";
import type { Action, OurMessageAnnotation } from "./get-next-action";
import { getNextAction } from "./get-next-action";
import { searchTavily } from "../tavily";
import { scrapePages } from "../scraper";
import { answerQuestion } from "./answer-question";
import type { Message, StreamTextResult } from "ai";

export interface RunAgentLoopOptions {
	messages: Message[];
	maxSteps?: number;
	langfuseTraceId?: string;
	writeMessageAnnotation?: (annotation: OurMessageAnnotation) => void;
}

export const runAgentLoop = async (
	options: RunAgentLoopOptions,
): Promise<StreamTextResult<Record<string, never>, string>> => {
	const { messages, maxSteps = 10, langfuseTraceId, writeMessageAnnotation } = options;
	
	// Extract the user's question from the last message
	const lastMessage = messages[messages.length - 1];
	const userQuestion = lastMessage?.content || "No question provided";
	
	// Create context with the user's question
	const ctx = new SystemContext(userQuestion);

	while (!ctx.shouldStop() && ctx.getCurrentStep() < maxSteps) {
		const nextAction = await getNextAction(ctx, { langfuseTraceId });

		// Send annotation about the chosen action
		if (writeMessageAnnotation) {
			writeMessageAnnotation({
				type: "NEW_ACTION",
				action: nextAction,
			} satisfies OurMessageAnnotation);
		}

		switch (nextAction.type) {
			case "search": {
				if (!nextAction.query) {
					throw new Error("Search action requires a query");
				}

				const searchResult = await searchTavily(
					{
						query: nextAction.query,
						maxResults: 10,
						searchDepth: "advanced",
						includeAnswer: true,
					},
					undefined,
				);

				const queryResult = {
					query: nextAction.query,
					results: searchResult.results.map((result) => ({
						date: result.publishedDate || "Unknown",
						title: result.title,
						url: result.url,
						snippet: result.content,
					})),
				};

				ctx.reportQueries([queryResult]);
				break;
			}

			case "scrape": {
				if (!nextAction.urls || nextAction.urls.length === 0) {
					throw new Error("Scrape action requires URLs");
				}

				const scrapeResult = await scrapePages({
					urls: nextAction.urls,
					maxRetries: 3,
				});

				if (scrapeResult.success) {
					const scrapes = scrapeResult.results.map((result) => ({
						url: result.url,
						result: result.result.data,
					}));
					ctx.reportScrapes(scrapes);
				} else {
					// Handle failed scrapes gracefully
					const scrapes = nextAction.urls.map((url) => ({
						url,
						result: `Failed to scrape: ${scrapeResult.error}`,
					}));
					ctx.reportScrapes(scrapes);
				}
				break;
			}

			case "answer": {
				const answer = answerQuestion(ctx, { isFinal: false });
				return answer;
			}

			default: {
				// This should never happen due to exhaustive type checking
				throw new Error(`Unknown action type: ${(nextAction as Action).type}`);
			}
		}

		ctx.incrementStep();
	}

	// If we've reached max steps, make a final attempt
	const finalAnswer = answerQuestion(ctx, { isFinal: true });
	return finalAnswer;
};
