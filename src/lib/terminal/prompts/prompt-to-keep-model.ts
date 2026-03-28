import * as clack from "@clack/prompts";

import { requirePromptValue } from "@/lib/terminal/prompts/require-prompt-value";

import type { AIModelChoice } from "@/lib/ai/models";
import type { ReasoningEffortValue } from "@/lib/ai/schemas";

export async function promptToKeepModel(model: AIModelChoice, effort: ReasoningEffortValue | undefined) {
  const keep = await clack.confirm({
    message: `Keep ${model.label}${effort ? ` (${effort})` : ""} for the next explanation?`,
    initialValue: true
  });

  const keepValue = requirePromptValue(keep, "Explain flow cancelled.");
  if (typeof keepValue !== "boolean") {
    throw new Error("Confirmation prompt returned an unexpected value.");
  }

  return keepValue;
}
