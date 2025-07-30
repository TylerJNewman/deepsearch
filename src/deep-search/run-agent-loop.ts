import { SystemContext } from "./system-context";
import type { Action, OurMessageAnnotation } from "./get-next-action";
import { getNextAction } from "./get-next-action";
import { queryRewriter } from "./query-rewriter";
import { searchTavily } from "../tavily";
import { scrapePages } from "../scraper";
import { summarizeURL } from "./summarize-url";
import { answerQuestion } from "./answer-question";
import type { Message, StreamTextResult, LanguageModelUsage } from "ai";

export interface RunAgentLoopOptions {
	messages: Message[];
	maxSteps?: number;
	langfuseTraceId?: string;
	writeMessageAnnotation?: (annotation: OurMessageAnnotation) => void;
	onFinish?: (result: { text: string; finishReason: string; usage: LanguageModelUsage; response: unknown }) => Promise<void> | void;
	location?: {
		latitude?: string;
		longitude?: string;
		city?: string;
		country?: string;
	};
}

export const runAgentLoop = async (
	options: RunAgentLoopOptions,
): Promise<StreamTextResult<Record<string, never>, string>> => {
	const { messages, maxSteps = 10, langfuseTraceId, writeMessageAnnotation, onFinish, location } = options;
	
	// Create context with the full conversation history
	const ctx = new SystemContext(messages, location);

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
			case "continue": {
				// First, get the query plan from the query rewriter
				const queryPlan = await queryRewriter(ctx, { langfuseTraceId });

				// Send annotation about the query plan
				if (writeMessageAnnotation) {
					writeMessageAnnotation({
						type: "NEW_ACTION",
						action: {
							title: "Planning research",
							reasoning: queryPlan.plan,
							type: "continue",
						},
					} satisfies OurMessageAnnotation);
				}

				// Execute all queries in parallel
				const searchPromises = queryPlan.queries.map(async (query) => {
					const searchResult = await searchTavily(
						{
							query: query,
							maxResults: 6, // Reduced from 10 to 6 as suggested
							searchDepth: "advanced",
							includeAnswer: true,
						},
						undefined,
					);

					// Extract URLs from search results
					const urls = searchResult.results.map((result) => result.url);

					// Scrape all the URLs
					const scrapeResult = await scrapePages({
						urls: urls,
						maxRetries: 3,
					});

					// Debug: Log scraping results
					console.log(`Scraping ${urls.length} URLs for query "${query}":`, {
						success: scrapeResult.success,
						successfulScrapes: scrapeResult.results.filter(r => r.result.success).length,
						failedScrapes: scrapeResult.results.filter(r => !r.result.success).length,
						errors: scrapeResult.results
							.filter(r => !r.result.success)
							.map(r => `${r.url}: ${'error' in r.result ? r.result.error : 'Unknown error'}`)
					});

					// Summarize all the scraped content in parallel
					const summarizationPromises = searchResult.results.map(async (result, index) => {
						const scrapeResultItem = scrapeResult.results[index];
						const scrapedContent = scrapeResultItem?.result.success
							? scrapeResultItem.result.data
							: "Failed to scrape content";

						// Skip summarization if scraping failed
						if (scrapedContent === "Failed to scrape content") {
							return {
								date: result.publishedDate,
								title: result.title,
								url: result.url,
								snippet: result.content,
								summary: "Failed to scrape content - no summary available",
							};
						}

						try {
							const summary = await summarizeURL({
								conversationHistory: ctx.getMessageHistory(false),
								scrapedContent,
								searchMetadata: {
									date: result.publishedDate,
									title: result.title,
									url: result.url,
									snippet: result.content,
								},
								query: query,
								langfuseTraceId,
							});

							return {
								date: result.publishedDate,
								title: result.title,
								url: result.url,
								snippet: result.content,
								summary,
							};
						} catch (error) {
							console.error(`Failed to summarize ${result.url}:`, error);
							
							// Handle Redis key size errors specifically
							const errorMessage = error instanceof Error ? error.message : "Unknown error";
							if (errorMessage.includes("max key size exceeded")) {
								return {
									date: result.publishedDate,
									title: result.title,
									url: result.url,
									snippet: result.content,
									summary: "Content too large to summarize - please try a different source",
								};
							}
							
							return {
								date: result.publishedDate,
								title: result.title,
								url: result.url,
								snippet: result.content,
								summary: `Failed to summarize content: ${errorMessage}`,
							};
						}
					});

					const combinedResults = await Promise.all(summarizationPromises);

					return {
						query: query,
						results: combinedResults,
					};
				});

				// Wait for all searches to complete
				const searchEntries = await Promise.all(searchPromises);

				// Report all search results
				for (const searchEntry of searchEntries) {
					ctx.reportSearch(searchEntry);
				}

				break;
			}

			case "answer": {
				const answer = answerQuestion(ctx, { isFinal: false, langfuseTraceId, onFinish });
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
	const finalAnswer = answerQuestion(ctx, { isFinal: true, langfuseTraceId, onFinish });
	return finalAnswer;
};
