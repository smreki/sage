import type { AIModelChoice, AIProviderSession } from "@/lib/ai/providers";

import type { UsageStats } from "@/lib/ai/utils/usage/usage-stats";

export function createUsageTracker(model: AIModelChoice) {
  const stats: UsageStats = {
    model: model.sdkModelId,
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    maxContextWindowTokens: model.maxContextWindowTokens
  };

  return {
    stats,
    attach(session: AIProviderSession) {
      return session.onUsage((event) => {
        stats.model = event.model;
        stats.inputTokens += event.inputTokens ?? 0;
        stats.outputTokens += event.outputTokens ?? 0;
        stats.cacheReadTokens += event.cacheReadTokens ?? 0;
        stats.cacheWriteTokens += event.cacheWriteTokens ?? 0;
      });
    }
  };
}
