import type { Message } from "ai";

type SearchResult = {
	date?: string;
	title: string;
	url: string;
	snippet: string;
	summary: string;
};

type SearchHistoryEntry = {
	query: string;
	results: SearchResult[];
};

type UserLocation = {
	latitude?: string;
	longitude?: string;
	city?: string;
	country?: string;
};

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
	 * The history of all searches with their summarized content
	 */
	private searchHistory: SearchHistoryEntry[] = [];

	/**
	 * The user's location
	 */
	private userLocation: UserLocation | null = null;

	constructor(messages?: Message[], location?: UserLocation) {
		this.messages = messages || [];
		if (location) {
			this.userLocation = location;
		}
	}

	shouldStop() {
		return this.step >= 10;
	}

	setMessages(messages: Message[]) {
		this.messages = messages;
	}

	getUserLocation(): UserLocation | null {
		return this.userLocation;
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
	 * @param includeLabels Whether to include labels like "Conversation History:" and "User Question:"
	 */
	getMessageHistory(includeLabels = true): string {
		if (this.messages.length === 0) {
			return includeLabels ? "No conversation history available" : "";
		}

		if (this.messages.length === 1) {
			// For single messages, just return the question for backwards compatibility
			const content = this.messages[0]?.content || "No question provided";
			return includeLabels ? `User Question: ${content}` : content;
		}

		// For multiple messages, format the full conversation
		const conversationHistory = this.messages
			.map((message, index) => {
				const role = message.role === 'user' ? 'User' : 'Assistant';
				return `${role}: ${message.content}`;
			})
			.join('\n\n');

		return includeLabels ? `Conversation History:\n${conversationHistory}` : conversationHistory;
	}

	reportSearch(search: SearchHistoryEntry) {
		this.searchHistory.push(search);
	}

	getSearchHistory(): string {
		return this.searchHistory
			.map((search) =>
				[
					`## Query: "${search.query}"`,
					...search.results.map((result) =>
						[
							`### ${result.date || "Unknown"} - ${result.title}`,
							result.url,
							result.snippet,
							"<summary>",
							result.summary,
							"</summary>",
						].join("\n\n"),
					),
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
	 * Get all search history as an array
	 */
	getSearchHistoryArray(): SearchHistoryEntry[] {
		return [...this.searchHistory];
	}
}
