import { appConfigSchema } from "@/lib/ai/schemas";

import { readConfig } from "@/lib/config/read-config";
import { store } from "@/lib/config/store";

import type { AppConfig } from "@/lib/ai/schemas";

/** Merges a partial config update into the current configuration, validates it, and persists the result. */
export function saveConfig(config: Partial<AppConfig>) {
  const current = readConfig();
  const next = appConfigSchema.parse({
    ...current,
    ...config,
    ai: {
      ...current.ai,
      ...("ai" in config && config.ai ? config.ai : {})
    }
  });

  store.store = next;
}
