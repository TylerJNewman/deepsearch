import type { Message } from "ai";

type QueryResultSearchResult = {
	date: string;
	title: string;
	url: string;
	snippet: string;
};

type QueryResult = {
	query: string;
	results: QueryResultSearchResult[];
};

type ScrapeResult = {
	url: string;
	result: string;
};

const toQueryResult = (query: QueryResultSearchResult) =>
	[`### ${query.date} - ${query.title}`, query.url, query.snippet].join("\n\n");

export class SystemContext {
	/**
	 * The current step in the loop
	 */
	private step = 0;

	/**
	 * The full conversation history
	 */
	private messages: Message[] = [];

	/**
	 * The history of all queries searched
	 */
	private queryHistory: QueryResult[] = [];

	/**
	 * The history of all URLs scraped
	 */
	private scrapeHistory: ScrapeResult[] = [];

	constructor(messages?: Message[]) {
		this.messages = messages || [];
	}

	shouldStop() {
		return this.step >= 10;
	}

	setMessages(messages: Message[]) {
		this.messages = messages;
	}

	getMessages(): Message[] {
		return this.messages;
	}

	/**
	 * Get the last user message as a simple question for backwards compatibility
	 */
	getUserQuestion(): string {
		const lastMessage = this.messages[this.messages.length - 1];
		return lastMessage?.content || "No question provided";
	}

	/**
	 * Get the full conversation history formatted for the AI
	 */
	getMessageHistory(): string {
		if (this.messages.length === 0) {
			return "No conversation history available";
		}

		if (this.messages.length === 1) {
			// For single messages, just return the question for backwards compatibility
			return `User Question: ${this.messages[0]?.content || "No question provided"}`;
		}

		// For multiple messages, format the full conversation
		const conversationHistory = this.messages
			.map((message, index) => {
				const role = message.role === 'user' ? 'User' : 'Assistant';
				return `${role}: ${message.content}`;
			})
			.join('\n\n');

		return `Conversation History:\n${conversationHistory}`;
	}

	reportQueries(queries: QueryResult[]) {
		this.queryHistory.push(...queries);
	}

	reportScrapes(scrapes: ScrapeResult[]) {
		this.scrapeHistory.push(...scrapes);
	}

	getQueryHistory(): string {
		return this.queryHistory
			.map((query) =>
				[
					`## Query: "${query.query}"`,
					...query.results.map(toQueryResult),
				].join("\n\n"),
			)
			.join("\n\n");
	}

	getScrapeHistory(): string {
		return this.scrapeHistory
			.map((scrape) =>
				[
					`## Scrape: "${scrape.url}"`,
					"<scrape_result>",
					scrape.result,
					"</scrape_result>",
				].join("\n\n"),
			)
			.join("\n\n");
	}

	/**
	 * Get the current step number
	 */
	getCurrentStep(): number {
		return this.step;
	}

	/**
	 * Increment the step counter
	 */
	incrementStep(): void {
		this.step++;
	}

	/**
	 * Get all query history as an array
	 */
	getQueryHistoryArray(): QueryResult[] {
		return [...this.queryHistory];
	}

	/**
	 * Get all scrape history as an array
	 */
	getScrapeHistoryArray(): ScrapeResult[] {
		return [...this.scrapeHistory];
	}
}
