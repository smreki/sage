#!/usr/bin/env bun

import process from "node:process";
import { Command } from "commander";
import * as clack from "@clack/prompts";
import pc from "picocolors";

import { runExplainCommand } from "@/commands/explain";
import { readConfig } from "@/lib/config";

const program = new Command();

program
  .name("sage")
  .description("An AI CLI for explaining and trying terminal commands.")
  .version("0.1.0")
  .showHelpAfterError();

program
  .command("explain")
  .description("Explain a terminal command with GitHub Copilot")
  .argument("[question...]", "Question to explain")
  .option("-p, --provider <provider>", "AI provider to use", "copilot")
  .option("-m, --model <model>", "Model to use")
  .option("-e, --effort <effort>", "Reasoning effort")
  .option("--no-short", "Show the full response")
  .option("--show-usage", "Show model/token usage in the rendered response")
  .option("--bypass-permissions", "Skip local confirmation before running the suggested command")
  .action(async (questionParts, options) => {
    const question = Array.isArray(questionParts) ? questionParts.join(" ").trim() : undefined;
    await runExplainCommand(question, options);
  });

program
  .command("config")
  .description("Show the current local CLI config")
  .action(() => {
    const config = readConfig();
    console.log(pc.cyan("Current config"));
    console.log(JSON.stringify(config, null, 2));
  });

if (process.argv.length <= 2) {
  console.log(pc.bold("Welcome to sage."));
  console.log(pc.dim("Run `sage explain` to start or `sage --help` to explore commands."));
}

try {
  await program.parseAsync(process.argv);
} catch (error) {
  clack.log.error(error instanceof Error ? error.message : "Unknown error");
  process.exit(1);
}
