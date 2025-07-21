import { evalite } from "evalite";
import { askDeepSearch } from "~/deep-search";
import type { Message } from "ai";
import { createScorer } from "evalite";
import { generateObject } from "ai";
import { z } from "zod";
import { factualityModel } from "~/models";

const checkFactuality = async (opts: {
  question: string;
  groundTruth: string;
  submission: string;
}) => {
  const { object } = await generateObject({
    model: factualityModel,
    /**
     * Prompt taken from autoevals:
     *
     * {@link https://github.com/braintrustdata/autoevals/blob/5aa20a0a9eb8fc9e07e9e5722ebf71c68d082f32/templates/factuality.yaml}
     */
    prompt: `
      You are comparing a submitted answer to an expert answer on a given question. Here is the data:
      [BEGIN DATA]
      ************
      [Question]: ${opts.question}
      ************
      [Expert]: ${opts.groundTruth}
      ************
      [Submission]: ${opts.submission}
      ************
      [END DATA]

      Compare the factual content of the submitted answer with the expert answer. Ignore any differences in style, grammar, or punctuation.
      The submitted answer may either be a subset or superset of the expert answer, or it may conflict with it. Determine which case applies. Answer the question by selecting one of the following options:
      (A) The submitted answer is a subset of the expert answer and is fully consistent with it.
      (B) The submitted answer is a superset of the expert answer and is fully consistent with it.
      (C) The submitted answer contains all the same details as the expert answer.
      (D) There is a disagreement between the submitted answer and the expert answer.
      (E) The answers differ, but these differences don't matter from the perspective of factuality.
    `,
    schema: z.object({
      answer: z
        .enum(["A", "B", "C", "D", "E"])
        .describe("Your selection."),
      rationale: z
        .string()
        .describe(
          "Why you chose this answer. Be very detailed.",
        ),
    }),
  });

  /**
   * LLM's are well documented at being poor at generating
   */
  const scores = {
    A: 0.4,
    B: 0.6,
    C: 1,
    D: 0,
    E: 1,
  };

  return {
    score: scores[object.answer],
    metadata: {
      rationale: object.rationale,
      judgeAnswer: object.answer,
    },
  };
};

// This is the scorer that can be passed into the scorers in Evalite
const Factuality = createScorer<
  Message[],
  string,
  string
>({
  name: "Factuality",
  scorer: async ({ input, expected, output }) => {
    // Extract the question from the last user message
    const question = input.findLast((msg) => msg.role === "user")?.content || "";
    
    if (!expected) {
      throw new Error("Expected answer is required for factuality scoring");
    }
    
    return checkFactuality({
      question,
      groundTruth: expected,
      submission: output,
    });
  },
});

evalite("Deep Search Eval", {
  data: async (): Promise<
    { input: Message[]; expected: string }[]
  > => {
    return [
      {
        input: [
          {
            id: "1",
            role: "user",
            content: "What is the latest version of TypeScript?",
          },
        ],
        expected: "The latest stable version of TypeScript is 5.8.3, and TypeScript 5.9 Beta is also available.",
      },
      {
        input: [
          {
            id: "2",
            role: "user",
            content: "What are the main features of Next.js 15?",
          },
        ],
        expected: `Next.js 15 is a stable release with React 19 integration, including experimental React Compiler support and improved hydration error handling. Key features include: 
• Overhauled caching system (breaking change) - caching is now opt-in for fetch requests, GET Route Handlers, and client navigations
• Stable Turbopack development server with significantly faster startup times and code updates  
• Enhanced Form component with prefetching, client-side navigation, and progressive enhancement
• Server Actions Security improvements with unguessable endpoints
• Async Request APIs (breaking change) for future optimizations
• ESLint 9 support and stable instrumentation.js API
• Experimental unstable_after API for post-response code execution
• TypeScript support for next.config.js and @next/codemod CLI for automated upgrades`,
      },
    ];
  },
  task: async (input) => {
    return askDeepSearch(input);
  },
  scorers: [
    {
      name: "Contains Links",
      description: "Checks if the output contains any markdown links.",
      scorer: ({ output }) => {
        // Check for markdown link syntax: [text](url)
        const markdownLinkRegex = /\[.*?\]\(.*?\)/;
        const containsLinks = markdownLinkRegex.test(output);

        return containsLinks ? 1 : 0;
      },
    },
    Factuality,
  ],
}); 