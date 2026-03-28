import { initializeCopilotProvider } from "@/lib/ai/providers/copilot";

import type { AIProviderName } from "@/lib/ai/schemas";

export async function initializeAIProvider(provider: AIProviderName) {
  switch (provider) {
    case "copilot":
      return initializeCopilotProvider();
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

export type { AIModelInfo, AIProviderClient, AIProviderSession, AIUsageEvent, CreateAIProviderSessionOptions } from "@/lib/ai/providers/types";
export type { AIModelChoice } from "@/lib/ai/models";
