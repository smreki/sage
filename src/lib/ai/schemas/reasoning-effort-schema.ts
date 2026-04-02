import { z } from "zod";

/** Zod enum schema for reasoning effort levels: `"low"`, `"medium"`, `"high"`, or `"xhigh"`. */
export const reasoningEffortSchema = z.enum(["low", "medium", "high", "xhigh"]);

/** A reasoning effort level string. */
export type ReasoningEffortValue = z.infer<typeof reasoningEffortSchema>;
