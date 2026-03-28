import { z } from "zod";

export const reasoningEffortSchema = z.enum(["low", "medium", "high", "xhigh"]);

export type ReasoningEffortValue = z.infer<typeof reasoningEffortSchema>;
