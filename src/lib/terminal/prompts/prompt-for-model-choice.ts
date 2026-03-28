import * as clack from "@clack/prompts";

import { findModelChoice } from "@/lib/ai/models";

import { requirePromptValue } from "@/lib/terminal/prompts/require-prompt-value";

import type { AIModelChoice } from "@/lib/ai/models";

export async function promptForModelChoice(initialModel: string | undefined, defaultModel: string, modelChoices: AIModelChoice[]) {
  if (initialModel) {
    const chosen = findModelChoice(initialModel, modelChoices);

    if (!chosen) {
      throw new Error(`Unknown model \`${initialModel}\`. Available choices: ${modelChoices.map((choice) => choice.configValue).join(", ")}`);
    }

    return chosen;
  }

  const selected = await clack.select({
    message: "Pick a model",
    initialValue: findModelChoice(defaultModel, modelChoices)?.configValue ?? modelChoices[0]?.configValue,
    options: modelChoices.map((choice) => ({
      value: choice.configValue,
      label: choice.label,
      hint: choice.supportsReasoningEffort ? "supports effort" : "fast default"
    }))
  });

  const selectedValue = requirePromptValue(selected, "Explain flow cancelled.");
  if (typeof selectedValue !== "string") {
    throw new Error("Model selection returned an unexpected value.");
  }

  return findModelChoice(selectedValue, modelChoices) ?? modelChoices[0];
}
