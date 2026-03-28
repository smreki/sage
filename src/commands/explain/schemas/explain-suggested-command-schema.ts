import { z } from "zod";

export const explainSuggestedCommandSchema = z.object({
  command: z.string().trim().min(1).optional(),
  reason: z.string().trim().min(1),
  risk: z.enum(["low", "medium", "high"]).default("low")
});
