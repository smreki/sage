import { appConfigSchema } from "@/lib/ai/schemas";

import { store } from "@/lib/config/store";

/** Reads and validates the current application configuration from the persistent store. */
export function readConfig() {
  return appConfigSchema.parse(store.store);
}
