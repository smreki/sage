import * as clack from "@clack/prompts";

import { requirePromptValue } from "@/lib/terminal/prompts/require-prompt-value";

export async function promptForRequiredText(options: {
  initialValue?: string;
  message: string;
  placeholder: string;
  emptyError: string;
}) {
  if (options.initialValue) {
    return options.initialValue;
  }

  const value = await clack.text({
    message: options.message,
    placeholder: options.placeholder,
    validate(input) {
      return input.trim().length === 0 ? options.emptyError : undefined;
    }
  });

  const resolvedValue = requirePromptValue(value, "Explain flow cancelled.");
  if (typeof resolvedValue !== "string") {
    throw new Error("Text prompt returned an unexpected value.");
  }

  return resolvedValue;
}
