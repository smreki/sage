import { z } from "zod";

import { reasoningEffortSchema } from "@/lib/ai/schemas/reasoning-effort-schema";

/** Zod schema for a single AI provider's configuration (default model and reasoning effort). */
export const aiProviderConfigSchema = z.object({
  defaultModel: z.string().optional(),
  defaultEffort: reasoningEffortSchema.default("low")
});

/** Zod schema for the top-level AI configuration: default provider, confirmation flag, and per-provider settings. */
export const aiConfigSchema = z.object({
  defaultProvider: z.string().default("github-copilot"),
  confirmBeforeRun: z.boolean().default(true),
  providers: z.record(z.string(), aiProviderConfigSchema).default({
    "github-copilot": { defaultEffort: "low" }
  })
});

/** Full AI configuration object. */
export type AIConfig = z.infer<typeof aiConfigSchema>;

/** Configuration for a single AI provider. */
export type AIProviderConfig = z.infer<typeof aiProviderConfigSchema>;
