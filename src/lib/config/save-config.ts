import { appConfigSchema } from "@/lib/ai/schemas";

import { readConfig } from "@/lib/config/read-config";
import { store } from "@/lib/config/store";

import type { AppConfig } from "@/lib/ai/schemas";

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
