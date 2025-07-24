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
	 * The user's question
	 */
	private userQuestion: string = "";

	/**
	 * The history of all queries searched
	 */
	private queryHistory: QueryResult[] = [];

	/**
	 * The history of all URLs scraped
	 */
	private scrapeHistory: ScrapeResult[] = [];

	constructor(userQuestion?: string) {
		this.userQuestion = userQuestion || "";
	}

	shouldStop() {
		return this.step >= 10;
	}

	setUserQuestion(question: string) {
		this.userQuestion = question;
	}

	getUserQuestion(): string {
		return this.userQuestion;
	}

	getMessageHistory(): string {
		return this.userQuestion ? `User Question: ${this.userQuestion}` : "No question provided";
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
