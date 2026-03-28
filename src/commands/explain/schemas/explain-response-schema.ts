import { z } from "zod";

import { reasoningEffortSchema } from "@/lib/ai/schemas";

import { explainExampleSchema } from "@/commands/explain/schemas/explain-example-schema";
import { explainSuggestedCommandSchema } from "@/commands/explain/schemas/explain-suggested-command-schema";

export const explainResponseSchema = z.object({
  question: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  explanation: z.array(z.string().trim().min(1)).min(1),
  examples: z.array(explainExampleSchema).default([]),
  suggestedCommand: explainSuggestedCommandSchema.optional(),
  followUpQuestions: z.array(z.string().trim().min(1)).default([]),
  warnings: z.array(z.string().trim().min(1)).default([]),
  applicableEffort: reasoningEffortSchema.optional()
});

export const explainResponseJsonSchema = JSON.stringify(z.toJSONSchema(explainResponseSchema), null, 2);

export type ExplainResponse = z.infer<typeof explainResponseSchema>;
