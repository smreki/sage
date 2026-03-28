import { buildRepairPrompt } from "@/commands/explain/prompts";
import { explainResponseSchema } from "@/commands/explain/schemas";

import { tryParseJsonResponse } from "@/lib/ai/utils/json";

import type { AIProviderSession } from "@/lib/ai/providers";

export async function requestExplainResponse(session: AIProviderSession, prompt: string) {
  const initial = await session.sendPrompt(prompt);
  const initialResult = tryParseJsonResponse(initial, explainResponseSchema);

  if (initialResult.success) {
    return initialResult.data;
  }

  const repair = await session.sendPrompt(buildRepairPrompt(initialResult.error));
  const repairedResult = tryParseJsonResponse(repair, explainResponseSchema);

  if (repairedResult.success) {
    return repairedResult.data;
  }

  throw new Error(`Copilot returned invalid JSON twice. ${repairedResult.error}`);
}
