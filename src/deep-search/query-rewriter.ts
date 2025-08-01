import { generateObject } from "ai";
import { z } from "zod";
import { model } from "../models";
import type { SystemContext } from "./system-context";
import { cacheWithRedis, createStableHash } from "~/server/redis/redis";

export const queryPlanSchema = z.object({
	plan: z
		.string()
		.describe(
			"A detailed research plan that outlines the logical progression of information needed to answer the question. Include analysis of core components, key concepts, and strategic approach.",
		),
	queries: z
		.array(z.string())
		.min(1)
		.max(5)
		.describe(
			"A numbered list of 3-5 sequential search queries that progress logically from foundational to specific information. Each query should be specific and focused, written in natural language without Boolean operators.",
		),
});

export type QueryPlan = z.infer<typeof queryPlanSchema>;

const queryRewriterImpl = async (
	ctx: SystemContext,
	opts: { langfuseTraceId?: string } = {},
): Promise<QueryPlan> => {
	const { langfuseTraceId } = opts;
	const userLocation = ctx.getUserLocation();

	console.log(`🧠 Generating query plan for: "${ctx.getUserQuestion()}"`);

	const result = await generateObject({
		model,
		schema: queryPlanSchema,
		system: `You are a strategic research planner with expertise in breaking down complex questions into logical search steps. Your primary role is to create a detailed research plan before generating any search queries.

First, analyze the question thoroughly:
- Break down the core components and key concepts
- Identify any implicit assumptions or context needed
- Consider what foundational knowledge might be required
- Think about potential information gaps that need filling

Then, develop a strategic research plan that:
- Outlines the logical progression of information needed
- Identifies dependencies between different pieces of information
- Considers multiple angles or perspectives that might be relevant
- Anticipates potential dead-ends or areas needing clarification

Finally, translate this plan into a numbered list of 3-5 sequential search queries that:
- Are specific and focused (avoid broad queries that return general information)
- Are written in natural language without Boolean operators (no AND/OR)
- Progress logically from foundational to specific information
- Build upon each other in a meaningful way

Remember that initial queries can be exploratory - they help establish baseline information or verify assumptions before proceeding to more targeted searches. Each query should serve a specific purpose in your overall research plan.

<current_context>
Current date and time: ${new Date().toLocaleString()}
${userLocation ? `User's location: ${JSON.stringify(userLocation)}` : ""}
</current_context>`,
		prompt: `Message History:
${ctx.getMessageHistory()}

Search History:
${ctx.getSearchHistory()}

Based on the current conversation and search history, create a research plan and generate the next set of search queries needed to answer the user's question.`,
		experimental_telemetry: langfuseTraceId
			? {
					isEnabled: true,
					functionId: "query-rewriter",
					metadata: {
						langfuseTraceId: langfuseTraceId,
						cacheKeyType: "question-hash",
					},
			  }
			: undefined,
	});

	return result.object;
};

// Cached version of the query rewriter with optimized cache keys
export const queryRewriter = cacheWithRedis(
	"queryPlan",
	queryRewriterImpl,
	{
		getDuration: () => {
			// Query plans can be cached for 4 hours since they're based on question semantics
			// not time-sensitive information
			return 60 * 60 * 4; // 4 hours
		},
		shouldSkipCache: () => {
			// Always cache query plans unless we add a forceRefresh mechanism later
			return false;
		},
		// Custom cache key generator that focuses on the core question
		generateCacheKey: (ctx: SystemContext, opts: { langfuseTraceId?: string } = {}) => {
			// Get the user's question (last message content)
			const question = ctx.getUserQuestion();
			
			// Create a normalized version of the question for better cache hits
			const normalizedQuestion = question
				.toLowerCase()
				.trim()
				// Remove common question variations that don't change search intent
				.replace(/\?+$/, '') // Remove trailing question marks
				.replace(/\s+/g, ' ') // Normalize whitespace
				.replace(/^(what|how|why|when|where|who)\s+(is|are|does|do|did|will|would|could|should)\s+/i, '$1 ') // Normalize question starters
				.replace(/\b(the|a|an)\b/g, '') // Remove articles
				.replace(/\s+/g, ' ') // Clean up whitespace again
				.trim();

			// Include user location if present (affects search context)
			const location = ctx.getUserLocation();
			const locationHash = location ? createStableHash(JSON.stringify(location)) : 'no-location';
			
			// Create cache key based on normalized question + location
			const cacheKey = createStableHash(`${normalizedQuestion}:${locationHash}`);
			
			console.log(`🔑 Query plan cache key generated: ${cacheKey} (question: "${question.substring(0, 60)}...")`);
			return cacheKey;
		},
	}
); 