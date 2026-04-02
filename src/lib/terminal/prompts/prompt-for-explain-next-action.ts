import * as clack from "@clack/prompts";

import { requirePromptValue } from "@/lib/terminal/prompts/require-prompt-value";

import type { SuggestedCommand } from "@/commands/explain/tools";

/** The possible actions a user can take after receiving an explanation. */
export type ExplainNextAction = "run" | "follow-up" | "new" | "cancel";

/** Prompts the user to choose what to do next: run the suggested command, ask a follow-up, start fresh, or exit. */
export async function promptForExplainNextAction(suggestedCommand: SuggestedCommand | undefined): Promise<ExplainNextAction> {
  const options = [
    ...(suggestedCommand?.command ? [{ value: "run", label: "Run suggested command", hint: suggestedCommand.command }] : []),
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
