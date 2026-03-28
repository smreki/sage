import process from "node:process";

import * as clack from "@clack/prompts";

export function handlePromptCancel(message = "Operation cancelled."): never {
  clack.cancel(message);
  process.exit(0);
}
