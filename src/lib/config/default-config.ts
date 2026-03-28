import { appConfigSchema } from "@/lib/ai/schemas";

import type { AppConfig } from "@/lib/ai/schemas";

export const defaultConfig: AppConfig = appConfigSchema.parse({});
