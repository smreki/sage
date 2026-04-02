import { getEnvApiKey } from "@mariozechner/pi-ai";
import { getOAuthApiKey } from "@mariozechner/pi-ai/oauth";

import {
  getAllStoredCredentials,
  storeCredentials
} from "@/lib/ai/oauth-store";

/**
 * Resolves an API key for a provider dynamically.
 *
 * Designed for use as the Agent `getApiKey` callback so that
 * short-lived OAuth tokens are refreshed transparently before each LLM call.
 *
 * Resolution order:
 * 1. Environment variable (fast path)
 * 2. Stored OAuth credentials (auto-refreshes expired tokens)
 *
 * @returns The API key string, or `undefined` when no credentials are available.
 */
export async function getApiKeyForProvider(provider: string): Promise<string | undefined> {
  const envKey = getEnvApiKey(provider);
  if (envKey) return envKey;

  const storedCreds = getAllStoredCredentials();
  if (!storedCreds[provider]) return undefined;

  try {
    const result = await getOAuthApiKey(provider, storedCreds);
    if (result) {
      storeCredentials(provider, result.newCredentials);
      return result.apiKey;
    }
  } catch {
    // Token refresh failed — caller handles undefined
  }

  return undefined;
}
