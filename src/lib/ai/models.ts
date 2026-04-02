import { getModels, type Model } from "@mariozechner/pi-ai";
import { getOAuthProvider } from "@mariozechner/pi-ai/oauth";

import { getProviderOAuthCredentials } from "@/lib/ai/auth";

/** A model paired with its display label for use in selection prompts. */
export interface ModelChoice {
  model: Model<any>;
  label: string;
}

/**
 * Applies OAuth-provider-specific model modifications when credentials
 * are available (e.g. github-copilot rewrites model baseUrls).
 */
function applyOAuthModelModifications(provider: string, models: Model<any>[]): Model<any>[] {
  const oauthProvider = getOAuthProvider(provider);
  if (!oauthProvider?.modifyModels) return models;

  const credentials = getProviderOAuthCredentials(provider);
  if (!credentials) return models;

  return oauthProvider.modifyModels(models, credentials);
}

/** Returns all models for a provider as selectable choices. */
export function getModelChoices(provider: string): ModelChoice[] {
  const models = applyOAuthModelModifications(provider, getModels(provider as any));
  return models.map((m) => ({
    model: m,
    label: `${m.name}${m.reasoning ? " (reasoning)" : ""}`
  }));
}

/** Finds a model by exact ID, partial ID match, or case-insensitive name match. */
export function findModel(provider: string, modelId: string): Model<any> | undefined {
  const models = applyOAuthModelModifications(provider, getModels(provider as any));
  return models.find(
    (m) =>
      m.id === modelId ||
      m.id.includes(modelId) ||
      m.name.toLowerCase().includes(modelId.toLowerCase())
  );
}

/**
 * Applies OAuth model modifications to a single already-resolved model.
 *
 * Call after authentication to ensure the model carries the correct
 * baseUrl for providers that rewrite it (e.g. github-copilot).
 */
export function applyModelModifications(provider: string, model: Model<any>): Model<any> {
  const modified = applyOAuthModelModifications(provider, [model]);
  return modified[0] ?? model;
}
