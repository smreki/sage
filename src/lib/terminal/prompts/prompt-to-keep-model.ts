import * as clack from "@clack/prompts";

import { requirePromptValue } from "@/lib/terminal/prompts/require-prompt-value";

import type { Model } from "@mariozechner/pi-ai";
import type { ReasoningEffortValue } from "@/lib/ai/schemas";

/** Asks the user whether to keep the current model and effort level for the next explanation. */
export async function promptToKeepModel(model: Model<any>, effort: ReasoningEffortValue | undefined): Promise<boolean> {
  const keep = await clack.confirm({
    message: `Keep ${model.name}${effort ? ` (${effort})` : ""} for the next explanation?`,
    initialValue: true
  });

  const keepValue = requirePromptValue(keep, "Explain flow cancelled.");
  if (typeof keepValue !== "boolean") {
    throw new Error("Confirmation prompt returned an unexpected value.");
  }

  return keepValue;
}
