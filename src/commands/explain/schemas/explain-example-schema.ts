import { z } from "zod";

export const explainExampleSchema = z.object({
  command: z.string().trim().min(1),
  description: z.string().trim().min(1)
});
