import { getModels, getModel } from "@mariozechner/pi-ai";

import type { Model } from "@mariozechner/pi-ai";

/** Supported OAuth-capable providers. */
export const SUPPORTED_PROVIDERS = [
  "github-copilot",
  "anthropic",
  "google-gemini-cli",
  "google-antigravity",
  "openai-codex"
] as const;

export type SupportedProvider = (typeof SUPPORTED_PROVIDERS)[number];

/**
 * Validates that `providerName` is a supported OAuth provider.
 *
 * @throws When the provider is not in {@link SUPPORTED_PROVIDERS}.
 */
export function resolveProvider(providerName: string): string {
  if (!SUPPORTED_PROVIDERS.includes(providerName as SupportedProvider)) {
    throw new Error(
      `Unknown provider "${providerName}". Available: ${SUPPORTED_PROVIDERS.join(", ")}`
    );
  }
  return providerName;
}

/**
 * Resolves a specific model by provider and model ID.
 *
 * @throws When the model is not found.
 */
export function resolveModel(provider: string, modelId: string): Model<any> {
  return getModel(provider as any, modelId as any);
}
