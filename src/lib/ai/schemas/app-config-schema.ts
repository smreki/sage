import { z } from "zod";

import { aiConfigSchema } from "@/lib/ai/schemas/ai-config-schema";

export const appConfigSchema = z.object({
  ai: aiConfigSchema.default({
    defaultProvider: "copilot",
    confirmBeforeRun: true,
    providers: {
      copilot: {
        defaultModel: "raptor-mini",
        availableModels: ["raptor-mini", "gpt-5-mini", "claude-haiku-4.5"],
        defaultEffort: "low"
      }
    }
  })
});

export type AppConfig = z.infer<typeof appConfigSchema>;
