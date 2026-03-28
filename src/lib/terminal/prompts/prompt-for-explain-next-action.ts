import * as clack from "@clack/prompts";

import { requirePromptValue } from "@/lib/terminal/prompts/require-prompt-value";

import type { ExplainResponse } from "@/commands/explain/schemas";

export type ExplainNextAction = "run" | "follow-up" | "new" | "cancel";

export async function promptForExplainNextAction(response: ExplainResponse) {
  const options = [
    ...(response.suggestedCommand?.command ? [{ value: "run", label: "Run suggested command", hint: response.suggestedCommand.command }] : []),
    { value: "follow-up", label: "Ask a follow-up", hint: "Continue this session" },
    { value: "new", label: "Start a new explanation", hint: "Create a fresh session" },
    { value: "cancel", label: "Cancel", hint: "Exit Sage" }
  ];

  const action = await clack.select({
    message: "What next?",
    options
  });

  const actionValue = requirePromptValue(action, "Explain flow cancelled.");
  if (typeof actionValue !== "string") {
    throw new Error("Action selection returned an unexpected value.");
  }

  return actionValue as ExplainNextAction;
}
