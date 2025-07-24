import { SystemContext } from "./system-context";
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
	const userQuestion = context.getUserQuestion();

	const result = await generateText({
		model,
		system: `
You are an AI research assistant tasked with answering user questions based on comprehensive web research.

Your role is to:
1. Provide accurate, well-researched answers
2. Include proper citations and sources
3. Acknowledge limitations or missing information
4. Use clear, structured formatting
5. Be concise yet comprehensive

${isFinal ? "⚠️ FINAL ATTEMPT: You may not have all the information needed, but please provide the best possible answer based on what you've found." : ""}
`,
		prompt: `
User's Question: ${userQuestion}

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
`,
	});

	return result.text;
};
