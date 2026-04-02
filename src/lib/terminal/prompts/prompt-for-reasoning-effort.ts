import * as clack from "@clack/prompts";

import { requirePromptValue } from "@/lib/terminal/prompts/require-prompt-value";

import type { Model } from "@mariozechner/pi-ai";
import type { ReasoningEffortValue } from "@/lib/ai/schemas";

const effortLevels: ReasoningEffortValue[] = ["low", "medium", "high", "xhigh"];

/**
 * Prompts the user to select a reasoning effort level for reasoning-capable models.
 * Returns `undefined` if the model does not support reasoning.
 */
export async function promptForReasoningEffort(
  initialEffort: ReasoningEffortValue | undefined,
  defaultEffort: ReasoningEffortValue,
  model: Model<any>
): Promise<ReasoningEffortValue | undefined> {
  if (!model.reasoning) {
    return undefined;
  }

  if (initialEffort) {
    return initialEffort;
  }

  const effort = await clack.select({
    message: "Pick a reasoning effort",
    initialValue: defaultEffort,
    options: effortLevels.map((value) => ({
      value,
      label: value,
      hint: value === "low" ? "faster" : value === "xhigh" ? "deepest" : "balanced"
    }))
  });

  const effortValue = requirePromptValue(effort, "Explain flow cancelled.");
  if (typeof effortValue !== "string") {
    throw new Error("Reasoning effort selection returned an unexpected value.");
  }

  return effortValue as ReasoningEffortValue;
}
