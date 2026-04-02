import { z } from "zod";

import { aiConfigSchema } from "@/lib/ai/schemas/ai-config-schema";

/** Zod schema for the entire application configuration, wrapping the AI config under the `ai` key. */
export const appConfigSchema = z.object({
  ai: aiConfigSchema.default({
    defaultProvider: "openai-codex",
    confirmBeforeRun: true,
    providers: {
      "openai-codex": { defaultModel: "gpt-5.4-mini", defaultEffort: "low" }
    }
  })
});

/** Full persisted application configuration type. */
export type AppConfig = z.infer<typeof appConfigSchema>;
