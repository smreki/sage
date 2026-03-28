import type { AIModelInfo } from "@/lib/ai/providers";
import type { UsageStats } from "@/lib/ai/utils/usage/usage-stats";

export function estimateContextUsage(stats: UsageStats, availableModels: AIModelInfo[]) {
  const maxContextWindowTokens = stats.maxContextWindowTokens ?? availableModels.find((model) => model.id === stats.model)?.maxContextWindowTokens;
  const totalTokens = stats.inputTokens + stats.outputTokens + stats.cacheReadTokens + stats.cacheWriteTokens;

  if (!maxContextWindowTokens || maxContextWindowTokens <= 0) {
    return {
      percent: undefined,
      label: "unknown"
    };
  }

  const percent = Math.min(100, Math.round((totalTokens / maxContextWindowTokens) * 100));
  const label = percent >= 80 ? "near compaction threshold" : percent >= 45 ? "moderate" : "light";

  return { percent, label };
}
