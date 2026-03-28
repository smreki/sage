import type { ZodType } from "zod";

import { extractJson } from "@/lib/ai/utils/json/extract-json";

export function tryParseJsonResponse<T>(response: string | undefined, schema: ZodType<T>):
  | { success: true; data: T }
  | { success: false; error: string } {
  const content = response?.trim();

  if (!content) {
    return { success: false, error: "Empty response from Copilot." };
  }

  try {
    const parsed = JSON.parse(extractJson(content));
    return { success: true, data: schema.parse(parsed) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown JSON parsing error."
    };
  }
}
