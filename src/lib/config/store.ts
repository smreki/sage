import Conf from "conf";

import { defaultConfig } from "@/lib/config/default-config";

import type { AppConfig } from "@/lib/ai/schemas";

export const store = new Conf<AppConfig>({
  projectName: "jam-sage",
  projectSuffix: "",
  defaults: defaultConfig
});
