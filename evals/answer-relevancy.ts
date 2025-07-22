import { createScorer } from "evalite";
import type { Message } from "ai";
import { generateObject } from "ai";
import { z } from "zod";
import { factualityModel } from "~/models";
import {
  ANSWER_RELEVANCY_AGENT_INSTRUCTIONS,
  generateEvaluatePrompt,
  generateEvaluationStatementsPrompt,
} from "./answer-relevancy-prompts";

const statementSchema = z.object({
  statements: z.array(z.string()),
});

const relevancySchema = z.object({
  verdicts: z.array(
    z.object({
      verdict: z.enum(["yes", "no", "unsure"]),
      reason: z.string(),
    }),
  ),
});

export const AnswerRelevancy = createScorer<Message[], string, string>({
  name: "Answer Relevancy",
  scorer: async ({ input, output }) => {
    const question = input.findLast((msg) => msg.role === "user")?.content || "";

    const { object: statementsObject } = await generateObject({
      model: factualityModel,
      prompt: generateEvaluationStatementsPrompt({ output }),
      schema: statementSchema,
    });

    const { object: relevancyObject } = await generateObject({
      model: factualityModel,
      system: ANSWER_RELEVANCY_AGENT_INSTRUCTIONS,
      prompt: generateEvaluatePrompt({
        input: question,
        statements: statementsObject.statements,
      }),
      schema: relevancySchema,
    });

    const scores = {
      yes: 1,
      no: 0,
      unsure: 0.5,
    };

    const totalScore = relevancyObject.verdicts.reduce(
      (acc, verdict) => acc + scores[verdict.verdict],
      0,
    );

    return {
      score: totalScore / relevancyObject.verdicts.length || 0,
      metadata: {
        verdicts: relevancyObject.verdicts,
      },
    };
  },
}); 