import process from "node:process";

import * as clack from "@clack/prompts";

/** Displays a cancellation message via clack and exits the process with code 0. */
export function handlePromptCancel(message = "Operation cancelled."): never {
  clack.cancel(message);
  process.exit(0);
}
