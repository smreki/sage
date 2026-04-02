import { getStoredCredentials } from "@/lib/ai/oauth-store";

import type { OAuthCredentials } from "@mariozechner/pi-ai";

/**
 * Returns stored OAuth credentials for a provider.
 *
 * Used by the model layer to apply provider-specific model
 * modifications (e.g. github-copilot baseUrl rewriting).
 */
export function getProviderOAuthCredentials(provider: string): OAuthCredentials | undefined {
  return getStoredCredentials(provider);
}
