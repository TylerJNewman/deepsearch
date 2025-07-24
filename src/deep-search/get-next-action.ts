import { generateObject } from "ai";
import { z } from "zod";
import { model } from "../models";
import type { SystemContext } from "./system-context";

export const actionSchema = z.object({
	title: z
		.string()
		.describe(
			"The title of the action, to be displayed in the UI. Be extremely concise. 'Searching Saka's injury history', 'Checking HMRC industrial action', 'Comparing toaster ovens'",
		),
	reasoning: z.string().describe("The reason you chose this step."),
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
		.describe("The query to search for. Only required if type is 'search'.")
		.optional(),
	urls: z
		.array(z.string())
		.describe("The URLs to scrape. Only required if type is 'scrape'.")
		.optional(),
});

export type Action = z.infer<typeof actionSchema>;

export const getNextAction = async (
	context: SystemContext,
	opts: { langfuseTraceId?: string } = {},
) => {
	const result = await generateObject({
		model,
		schema: actionSchema,
		system: `
<current_context>
Current date and time: ${new Date().toLocaleString()}
</current_context>

<core_identity>
You are an intelligent AI decision-maker that determines the next best action in a research workflow. Your role is to analyze the current context and choose whether to search for more information, scrape specific URLs, or provide a final answer.
</core_identity>

<decision_guidelines>
- **Analyze information gaps**: Determine what information is missing to answer the user's question
- **Prioritize efficiency**: Choose actions that will provide the most valuable information
- **Consider source quality**: When scraping, prioritize authoritative and diverse sources
- **Know when to stop**: Answer when you have sufficient information from multiple sources
- **Be specific**: Create targeted search queries that will yield relevant results
- **Avoid redundancy**: Don't search for information you already have
- **Cross-verify**: Ensure you have information from multiple sources before answering
</decision_guidelines>

<response_format>
Provide clear, actionable decisions with specific reasoning. Your response should include:
- A concise action title for UI display
- Detailed reasoning for why this action is the best choice
- Specific query or URLs when applicable
- Clear indication of whether you have enough information to answer
</response_format>

<quality_requirements>
- Make decisions based on thorough analysis of available information
- Ensure actions are specific and actionable
- Provide clear reasoning for each decision
- Prioritize user experience by choosing efficient research paths
- Consider the balance between thoroughness and efficiency
</quality_requirements>
`,
		prompt: `Message History:
${context.getMessageHistory()}

Based on this context, choose the next action:
1. If you need more information, use 'search' with a relevant query
2. If you have URLs that need to be scraped, use 'scrape' with those URLs
3. If you have enough information to answer the question, use 'answer'

Remember:
- Only use 'search' if you need more information
- Only use 'scrape' if you have URLs that need to be scraped
- Use 'answer' when you have enough information to provide a complete answer

Here is the search and scrape history:

${context.getQueryHistory()}

${context.getScrapeHistory()}
`,
		experimental_telemetry: opts.langfuseTraceId
			? {
					isEnabled: true,
					functionId: "get-next-action",
					metadata: {
						langfuseTraceId: opts.langfuseTraceId,
					},
			  }
			: undefined,
	});

	return result.object;
};
