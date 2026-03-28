import type { AIModelInfo } from "@/lib/ai/providers";
import type { ReasoningEffortValue } from "@/lib/ai/schemas";

const fallbackEfforts: ReasoningEffortValue[] = ["low", "medium", "high"];

export type AIModelChoice = {
  configValue: string;
  sdkModelId: string;
  label: string;
  supportsReasoningEffort: boolean;
  supportedReasoningEfforts: ReasoningEffortValue[];
  maxContextWindowTokens?: number;
  modelInfo?: AIModelInfo;
};

export function buildModelChoices(configModels: string[], availableModels: AIModelInfo[]) {
  const matched = configModels
    .map((configValue) => {
      const modelInfo = findModelInfo(configValue, availableModels);
      if (modelInfo) {
        return createModelChoice(configValue, modelInfo);
      }

      return createFallbackModelChoice(configValue);
    })
    .filter((value): value is AIModelChoice => value !== null);

  if (matched.length > 0) {
    return matched;
  }

  return availableModels.map((modelInfo) => createModelChoice(modelInfo.id, modelInfo));
}

export function findModelChoice(value: string, choices: AIModelChoice[]) {
  const normalizedValue = normalizeModelToken(value);

  return choices.find((choice) => {
    return [choice.configValue, choice.sdkModelId, choice.label].some((candidate) => {
      return normalizeModelToken(candidate) === normalizedValue;
    });
  });
}

function createModelChoice(configValue: string, modelInfo: AIModelInfo): AIModelChoice {
  return {
    configValue,
    sdkModelId: modelInfo.id,
    label: modelInfo.name,
    supportsReasoningEffort: modelInfo.supportsReasoningEffort,
    supportedReasoningEfforts: modelInfo.supportedReasoningEfforts ?? fallbackEfforts,
    maxContextWindowTokens: modelInfo.maxContextWindowTokens,
    modelInfo
  };
}

function createFallbackModelChoice(configValue: string): AIModelChoice {
  return {
    configValue,
    sdkModelId: configValue,
    label: prettifyModelLabel(configValue),
    supportsReasoningEffort: false,
    supportedReasoningEfforts: fallbackEfforts,
    maxContextWindowTokens: undefined,
    modelInfo: undefined
  };
}

function findModelInfo(configValue: string, availableModels: AIModelInfo[]) {
  const normalizedValue = normalizeModelToken(configValue);

  return availableModels.find((modelInfo) => {
    return normalizeModelToken(modelInfo.id) === normalizedValue || normalizeModelToken(modelInfo.name) === normalizedValue;
  });
}

function normalizeModelToken(value: string) {
  return value.toLowerCase().replace(/[\s_.]+/g, "-");
}

function prettifyModelLabel(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => {
      if (part.toLowerCase() === "gpt") {
        return "GPT";
      }

      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}
