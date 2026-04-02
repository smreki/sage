import * as clack from "@clack/prompts";
import { getEnvApiKey } from "@mariozechner/pi-ai";
import {
  getOAuthProvider,
  getOAuthApiKey
} from "@mariozechner/pi-ai/oauth";

import { createClackOAuthCallbacks } from "@/lib/ai/auth/oauth-callbacks";
import {
  getStoredCredentials,
  getAllStoredCredentials,
  storeCredentials
} from "@/lib/ai/oauth-store";

import type { OAuthCredentials } from "@mariozechner/pi-ai";

/**
 * Runs the interactive OAuth login flow for a provider.
 *
 * Delegates UI to clack-based callbacks, persists the resulting
 * credentials on success.
 */
async function runOAuthLogin(provider: string): Promise<OAuthCredentials> {
  const oauthProvider = getOAuthProvider(provider);
  if (!oauthProvider) {
    throw new Error(`No OAuth provider registered for "${provider}".`);
  }

  clack.log.info(`Signing in to ${oauthProvider.name}...`);
  const credentials = await oauthProvider.login(createClackOAuthCallbacks());

  storeCredentials(provider, credentials);
  clack.log.success(`Signed in to ${oauthProvider.name}.`);

  return credentials;
}

/**
 * Ensures the user is authenticated for the given provider.
 *
 * Resolution order:
 * 1. Environment variable API key (fast path)
 * 2. Stored OAuth credentials (auto-refreshes if expired)
 * 3. Interactive OAuth login flow
 */
export async function ensureAuthenticated(provider: string): Promise<void> {
  if (getEnvApiKey(provider)) return;

  if (getStoredCredentials(provider)) {
    try {
      const result = await getOAuthApiKey(provider, getAllStoredCredentials());
      if (result) {
        storeCredentials(provider, result.newCredentials);
        return;
      }
    } catch {
      clack.log.warn("Stored OAuth credentials are invalid. Re-authenticating...");
    }
  }

  await runOAuthLogin(provider);
}
