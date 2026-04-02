import { z } from "zod";

import { reasoningEffortSchema } from "@/lib/ai/schemas";
import { optionalTrimmedStringSchema } from "@/lib/utils/optional-trimmed-string-schema";

export const explainOptionsSchema = z.object({
  question: optionalTrimmedStringSchema,
  provider: z.string().optional(),
  model: optionalTrimmedStringSchema,
  effort: reasoningEffortSchema.optional(),
  detailed: z.boolean().default(false),
  showUsage: z.boolean().default(false),
  bypassPermissions: z.boolean().default(false)
});

export type ExplainOptions = z.infer<typeof explainOptionsSchema>;
