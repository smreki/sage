import Conf from "conf";

import { defaultConfig } from "@/lib/config/default-config";

import type { AppConfig } from "@/lib/ai/schemas";

/** Singleton persistent configuration store backed by Conf, using the `jam-sage` project namespace. */
export const store = new Conf<AppConfig>({
  projectName: "jam-sage",
  projectSuffix: "",
  defaults: defaultConfig
});
