import { z } from "zod";

export const aiProviderSchema = z.enum(["copilot"]);

export type AIProviderName = z.infer<typeof aiProviderSchema>;
