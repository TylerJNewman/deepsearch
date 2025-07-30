import { generateObject } from "ai";
import { z } from "zod";
import { model } from "../models";
import type { SystemContext } from "./system-context";
import { DEEP_SEARCH_SYSTEM_PROMPT } from "./system-prompt";

export type OurMessageAnnotation = {
  type: "NEW_ACTION";
  action: Action;
};

export const actionSchema = z.object({
	title: z
		.string()
		.describe(
			"The title of the action, to be displayed in the UI. Be extremely concise. 'Searching Saka's injury history', 'Checking HMRC industrial action', 'Comparing toaster ovens'",
		),
	reasoning: z.string().describe("The reason you chose this step."),
	type: z
		.enum(["search", "answer"])
		.describe(
			`The type of action to take.
      - 'search': Search the web for more information and automatically scrape the URLs.
      - 'answer': Answer the user's question and complete the loop.`,
		),
	query: z
		.string()
		.describe("The query to search for. Only required if type is 'search'.")
		.optional(),
});

export type Action = z.infer<typeof actionSchema>;

export const getNextAction = async (
	ctx: SystemContext,
	opts: { langfuseTraceId?: string } = {},
) => {
	const { langfuseTraceId } = opts;
	const userLocation = ctx.getUserLocation();

	const result = await generateObject({
		model,
		schema: actionSchema,
		system: `
<current_context>
Current date and time: ${new Date().toLocaleString()}
${userLocation ? `User's location: ${JSON.stringify(userLocation)}` : ""}
</current_context>

<system_prompt>
${DEEP_SEARCH_SYSTEM_PROMPT}
</system_prompt>

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
${ctx.getMessageHistory()}

Based on this context, choose the next action:
1. If you need more information, use 'search' with a relevant query (this will automatically scrape the URLs)
2. If you have enough information to answer the question, use 'answer'

Remember:
- Only use 'search' if you need more information
- Use 'answer' when you have enough information to provide a complete answer

Here is the search history:

${ctx.getSearchHistory()}
`,
		experimental_telemetry: langfuseTraceId
			? {
					isEnabled: true,
					functionId: "get-next-action",
					metadata: {
						langfuseTraceId: langfuseTraceId,
					},
			  }
			: undefined,
	});

	return result.object;
};
