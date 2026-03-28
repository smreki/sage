import * as clack from "@clack/prompts";

import { requirePromptValue } from "@/lib/terminal/prompts/require-prompt-value";

import type { AIModelChoice } from "@/lib/ai/models";
import type { ReasoningEffortValue } from "@/lib/ai/schemas";

export async function promptForReasoningEffort(initialEffort: ReasoningEffortValue | undefined, defaultEffort: ReasoningEffortValue, model: AIModelChoice) {
  if (!model.supportsReasoningEffort) {
    return undefined;
  }

  if (initialEffort) {
    return initialEffort;
  }

  const effort = await clack.select({
    message: "Pick a reasoning effort",
    initialValue: model.supportedReasoningEfforts.includes(defaultEffort) ? defaultEffort : model.supportedReasoningEfforts[0],
    options: model.supportedReasoningEfforts.map((value: ReasoningEffortValue) => ({
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
