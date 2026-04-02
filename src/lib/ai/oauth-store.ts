import Conf from "conf";

import type { OAuthCredentials } from "@mariozechner/pi-ai";

type OAuthStore = Record<string, OAuthCredentials>;

/**
 * Persistent store for OAuth credentials.
 *
 * Stored separately from the main config to avoid mixing
 * auth secrets with user preferences. Persists to
 * `~/.config/jam-sage/oauth-credentials.json`.
 */
export const oauthStore = new Conf<OAuthStore>({
  projectName: "jam-sage",
  projectSuffix: "",
  configName: "oauth-credentials",
  defaults: {}
});

/** Returns stored OAuth credentials for a single provider, or `undefined`. */
export function getStoredCredentials(providerId: string): OAuthCredentials | undefined {
  return oauthStore.get(providerId);
}

/** Returns all stored credentials keyed by provider ID. */
export function getAllStoredCredentials(): Record<string, OAuthCredentials> {
  return { ...oauthStore.store };
}

/** Persists OAuth credentials for a provider. */
export function storeCredentials(providerId: string, credentials: OAuthCredentials): void {
  oauthStore.set(providerId, credentials);
}
