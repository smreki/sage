import process from "node:process";

import * as clack from "@clack/prompts";

import type { OAuthLoginCallbacks } from "@mariozechner/pi-ai";

/**
 * Creates OAuth login callbacks wired to clack terminal prompts.
 *
 * Handles browser opening, user input, progress display, and
 * manual authorization code entry as a fallback.
 */
export function createClackOAuthCallbacks(): OAuthLoginCallbacks {
  return {
    onAuth(info) {
      if (info.instructions) {
        clack.log.info(info.instructions);
      }
      clack.log.info(`${info.url}`);

      const openCmd =
        process.platform === "darwin"
          ? "open"
          : process.platform === "win32"
            ? "start"
            : "xdg-open";

      import("node:child_process").then(({ exec }) => {
        exec(`${openCmd} "${info.url}"`, () => {});
      });
    },

    async onPrompt(prompt) {
      const result = await clack.text({
        message: prompt.message,
        placeholder: prompt.placeholder,
        defaultValue: prompt.allowEmpty ? "" : undefined,
        validate: prompt.allowEmpty
          ? undefined
          : (value) => {
              if (!value.trim()) return "Please enter a value.";
            }
      });

      if (clack.isCancel(result)) {
        clack.cancel("Authentication cancelled.");
        process.exit(0);
      }

      return result as string;
    },

    onProgress(message) {
      clack.log.step(message);
    },

    async onManualCodeInput() {
      const result = await clack.text({
        message: "Enter the authorization code from your browser:",
        placeholder: "paste code here"
      });

      if (clack.isCancel(result)) {
        clack.cancel("Authentication cancelled.");
        process.exit(0);
      }

      return result as string;
    }
  };
}
