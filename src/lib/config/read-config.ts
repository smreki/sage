import { appConfigSchema } from "@/lib/ai/schemas";

import { store } from "@/lib/config/store";

export function readConfig() {
  return appConfigSchema.parse(store.store);
}
