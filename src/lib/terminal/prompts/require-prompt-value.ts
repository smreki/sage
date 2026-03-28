import * as clack from "@clack/prompts";

import { handlePromptCancel } from "@/lib/terminal/prompts/handle-prompt-cancel";

type PromptScalar = string | boolean;

export function requirePromptValue<T extends PromptScalar>(value: T | symbol, cancelMessage: string): T {
  if (clack.isCancel(value)) {
    handlePromptCancel(cancelMessage);
  }

  return value;
}
