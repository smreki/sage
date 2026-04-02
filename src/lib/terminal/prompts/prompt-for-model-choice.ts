import * as clack from "@clack/prompts";

import { findModel, getModelChoices } from "@/lib/ai/models";
import { resolveModel } from "@/lib/ai/provider";
import { requirePromptValue } from "@/lib/terminal/prompts/require-prompt-value";

import type { Model } from "@mariozechner/pi-ai";

/**
 * Resolves an AI model for the given provider. If `initialModel` matches a known model it is
 * returned directly; otherwise the user is presented with an interactive picker.
 */
export async function promptForModelChoice(
  initialModel: string | undefined,
  defaultModel: string | undefined,
  provider: string
): Promise<Model<any>> {
  const choices = getModelChoices(provider);

  if (initialModel) {
    const found = findModel(provider, initialModel);
    if (!found) {
      clack.log.warn(`Model "${initialModel}" not found for ${provider}. Choose from the list below.`);
    } else {
      return found;
    }
  }

  // Try to select default model
  const defaultFound = defaultModel ? findModel(provider, defaultModel) : undefined;

  const selected = await clack.select({
    message: `Pick a model (${provider})`,
    initialValue: defaultFound?.id ?? choices[0]?.model.id,
    options: choices.map((choice) => ({
      value: choice.model.id,
      label: choice.label,
      hint: choice.model.reasoning ? "reasoning" : undefined
    }))
  });

  const selectedValue = requirePromptValue(selected, "Explain flow cancelled.");
  if (typeof selectedValue !== "string") {
    throw new Error("Model selection returned an unexpected value.");
  }

  return resolveModel(provider, selectedValue);
}
