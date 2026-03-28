import { z } from "zod";

import { aiProviderSchema } from "@/lib/ai/schemas/ai-provider-schema";
import { reasoningEffortSchema } from "@/lib/ai/schemas/reasoning-effort-schema";

export const aiProviderConfigSchema = z.object({
  defaultModel: z.string().trim().min(1).default("raptor-mini"),
  availableModels: z.array(z.string().trim().min(1)).min(1).default([
    "raptor-mini",
    "gpt-5-mini",
    "claude-haiku-4.5"
  ]),
  defaultEffort: reasoningEffortSchema.default("low")
});

export const aiConfigSchema = z.object({
  defaultProvider: aiProviderSchema.default("copilot"),
  confirmBeforeRun: z.boolean().default(true),
  providers: z.object({
    copilot: aiProviderConfigSchema.default({
      defaultModel: "raptor-mini",
      availableModels: ["raptor-mini", "gpt-5-mini", "claude-haiku-4.5"],
      defaultEffort: "low"
    })
  }).default({
    copilot: {
      defaultModel: "raptor-mini",
      availableModels: ["raptor-mini", "gpt-5-mini", "claude-haiku-4.5"],
      defaultEffort: "low"
    }
  })
});

export type AIConfig = z.infer<typeof aiConfigSchema>;
export type AIProviderConfig = z.infer<typeof aiProviderConfigSchema>;
