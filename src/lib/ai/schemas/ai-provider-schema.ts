import { z } from "zod";

/** Zod schema that accepts any non-empty string as a provider name; actual validity is checked at runtime against pi-ai's provider registry. */
export const aiProviderSchema = z.string().min(1);

/** An AI provider name string (e.g. `"github-copilot"`, `"anthropic"`). */
export type AIProviderName = string;
