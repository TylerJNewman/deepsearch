import type { SystemContext } from "./system-context";
import { generateText } from "ai";
import { model } from "../models";

export interface AnswerQuestionOptions {
	isFinal: boolean;
}

export const answerQuestion = async (
	context: SystemContext,
	options: AnswerQuestionOptions,
): Promise<string> => {
	const { isFinal } = options;

	const prompt = `
You are an AI research assistant tasked with answering the user's question based on the research you've conducted.

${isFinal ? "⚠️ FINAL ATTEMPT: You may not have all the information needed, but please provide the best possible answer based on what you've found." : ""}

Research Context:
${context.getQueryHistory()}

${context.getScrapeHistory()}

Instructions:
1. Provide a comprehensive answer to the user's question
2. Include all relevant sources with proper citations
3. Be accurate and concise
4. If information is missing or conflicting, acknowledge it
5. Use markdown formatting for clarity

Answer the user's question based on the research conducted above.
`;

	const result = await generateText({
		model,
		prompt,
	});

	return result.text;
};
