import { z } from "zod";

import { aiProviderSchema, reasoningEffortSchema } from "@/lib/ai/schemas";
import { optionalTrimmedStringSchema } from "@/lib/utils/optional-trimmed-string-schema";

export const explainOptionsSchema = z.object({
  question: optionalTrimmedStringSchema,
  provider: aiProviderSchema.optional(),
  model: optionalTrimmedStringSchema,
  effort: reasoningEffortSchema.optional(),
  short: z.boolean().default(true),
  showUsage: z.boolean().default(false),
  bypassPermissions: z.boolean().default(false)
});

export type ExplainOptions = z.infer<typeof explainOptionsSchema>;
