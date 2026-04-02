import process from "node:process";

import * as clack from "@clack/prompts";
import { execaCommand } from "execa";

import { assessSuggestedCommand } from "@/lib/security/commands";
import { renderCommandResult } from "@/lib/terminal/render";

/**
 * Evaluates a suggested command against safety rules, optionally prompts for
 * user confirmation, executes it via execa, and renders the result.
 */
export async function maybeRunSuggestedCommand(command: string | undefined, bypassPermissions: boolean) {
  const assessed = assessSuggestedCommand(command);

  if (!assessed.allowed || !assessed.command) {
    clack.log.warn(assessed.reason ?? "The suggested command cannot be run.");
    return;
  }

  if (!bypassPermissions) {
    const confirmed = await clack.confirm({
      message: `Run \`${assessed.command}\`?`,
      initialValue: false
    });

    if (clack.isCancel(confirmed)) {
      clack.cancel("Explain flow cancelled.");
      process.exit(0);
    }

    if (!confirmed) {
      clack.log.info("Skipped command execution.");
      return;
    }
  }

  const spinner = clack.spinner();
  spinner.start(`Running ${assessed.command}`);

  const result = await execaCommand(assessed.command, {
    cwd: process.cwd(),
    reject: false,
    timeout: 30_000
  });

  spinner.stop(`Finished with exit code ${result.exitCode ?? 0}`);
  renderCommandResult({
    command: assessed.command,
    exitCode: result.exitCode ?? 0,
    stdout: result.stdout,
    stderr: result.stderr
  });
}
