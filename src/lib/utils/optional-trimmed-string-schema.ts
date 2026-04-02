import { z } from "zod";

/** Zod schema that trims string input and converts empty/whitespace-only strings to `undefined`. */
export const optionalTrimmedStringSchema = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}, z.string().min(1).optional());
