import process from "node:process";

import * as clack from "@clack/prompts";
import pc from "picocolors";
import { Agent } from "@mariozechner/pi-agent-core";
import { registerBuiltInApiProviders } from "@mariozechner/pi-ai";
import { render as renderMarkdown, createMarkdownStreamer } from "markdansi";

import { buildSystemPrompt } from "@/commands/explain/prompts/explain-system-prompt";
import { explainOptionsSchema } from "@/commands/explain/schemas";
import { suggestCommandTool } from "@/commands/explain/tools";
import { resolveProvider } from "@/lib/ai/provider";
import { ensureAuthenticated, getApiKeyForProvider } from "@/lib/ai/auth";
import { applyModelModifications } from "@/lib/ai/models";
import { note, renderMarkdownSection, streamWithBar, createThinkingSpinner } from "@/lib/terminal/render";
import { noteContentWidth } from "@/lib/terminal/render/wrap-text";
import { readConfig } from "@/lib/config";
import {
  promptForExplainNextAction,
  promptForModelChoice,
  promptForReasoningEffort,
  promptForRequiredText,
  promptToKeepModel
} from "@/lib/terminal/prompts";
import { maybeRunSuggestedCommand } from "@/lib/terminal/suggested-command";

import type { Model, AssistantMessage } from "@mariozechner/pi-ai";
import type { ThinkingLevel } from "@mariozechner/pi-agent-core";
import type { SuggestedCommand } from "@/commands/explain/tools";

// Register all built-in API providers (OpenAI, Anthropic, Google, etc.)
registerBuiltInApiProviders();

function mapEffortToThinkingLevel(effort: string | undefined): ThinkingLevel {
  if (!effort) return "off";
  const map: Record<string, ThinkingLevel> = {
    low: "low",
    medium: "medium",
    high: "high",
    xhigh: "xhigh"
  };
  return map[effort] ?? "off";
}

function renderSuggestedCommand(cmd: SuggestedCommand) {
  const md = `\`\`\`sh\n${cmd.command}\n\`\`\`\n\n${cmd.reason} *(risk: ${cmd.risk})*`;
  renderMarkdownSection(md, "Suggested Command");
}

function renderUsage(usage: AssistantMessage["usage"], model: Model<any>) {
  note(
    [
      `Model: ${model.name}`,
      `Tokens: ${usage.input} in / ${usage.output} out`,
      `Cost: $${usage.cost.total.toFixed(4)}`
    ].join("\n"),
    "Usage"
  );
}

export async function runExplainCommand(question: string | undefined, options: unknown) {
  const parsed = explainOptionsSchema.parse({
    question,
    ...(typeof options === "object" && options !== null ? options : {})
  });
  const config = readConfig();
  const activeProvider = parsed.provider ?? config.ai.defaultProvider;
  const providerConfig = config.ai.providers[activeProvider] ?? {};

  clack.intro(pc.inverse(" sage explain "));

  try {
    // 1. Validate provider
    resolveProvider(activeProvider);

    // 2. Auth check
    await ensureAuthenticated(activeProvider);

    // 3. Resolve model (apply OAuth model modifications like baseUrl for github-copilot)
    let activeModel = applyModelModifications(
      activeProvider,
      await promptForModelChoice(parsed.model, providerConfig.defaultModel, activeProvider)
    );

    // 4. Reasoning effort
    let activeEffort = await promptForReasoningEffort(
      parsed.effort,
      providerConfig.defaultEffort ?? "low",
      activeModel
    );

    // 5. Get question
    let activeQuestion = await promptForRequiredText({
      initialValue: parsed.question,
      message: "What terminal command or shell concept should Sage explain?",
      placeholder: "what is whoami",
      emptyError: "Please enter a question."
    });

    // 6. Create Agent with tools
    const agent = new Agent({
      getApiKey: (provider) => getApiKeyForProvider(provider),
      initialState: {
        systemPrompt: buildSystemPrompt(parsed.detailed),
        model: activeModel,
        thinkingLevel: mapEffortToThinkingLevel(activeEffort),
        tools: [suggestCommandTool],
        messages: []
      }
    });

    // 7. Subscribe to events for streaming + tool tracking
    const state: { suggestedCommand: SuggestedCommand | undefined } = { suggestedCommand: undefined };
    const getSuggestedCommand = (): SuggestedCommand | undefined => state.suggestedCommand;
    const textBuffer: string[] = [];
    let streamDone = false;

    agent.subscribe((event) => {
      if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
        textBuffer.push(event.assistantMessageEvent.delta);
      }

      if (event.type === "tool_execution_end" && event.toolName === "suggest_command" && !event.isError) {
        state.suggestedCommand = event.result?.details as SuggestedCommand;
      }

      if (event.type === "agent_end") {
        streamDone = true;
      }
    });

    // Main loop for follow-ups
    while (true) {
      state.suggestedCommand = undefined;
      textBuffer.length = 0;
      streamDone = false;

      // Show thinking spinner until first text arrives
      const spinner = createThinkingSpinner();
      spinner.start("Thinking...");
      let firstTextReceived = false;

      // Stream the agent response with markdown rendering
      const agentPromise = agent.prompt(activeQuestion);
      const streamer = createMarkdownStreamer({
        render: (md) => renderMarkdown(md, { width: noteContentWidth() }),
        spacing: "single"
      });

      // Create an async iterable that yields markdown-rendered text deltas
      async function* textDeltas(): AsyncGenerator<string> {
        while (!streamDone) {
          if (textBuffer.length > 0) {
            if (!firstTextReceived) {
              firstTextReceived = true;
              spinner.stop();
            }
            const raw = textBuffer.splice(0, textBuffer.length).join("");
            const rendered = streamer.push(raw);
            if (rendered) yield rendered;
          }
          await new Promise((r) => setTimeout(r, 16));
        }
        if (!firstTextReceived) {
          spinner.stop();
        }
        // Flush remaining raw text through the streamer
        if (textBuffer.length > 0) {
          const raw = textBuffer.splice(0, textBuffer.length).join("");
          const rendered = streamer.push(raw);
          if (rendered) yield rendered;
        }
        // Finalize the streamer (flushes buffered blocks like code fences)
        const tail = streamer.finish();
        if (tail) yield tail;
      }

      await streamWithBar(textDeltas());
      await agentPromise;

      // Show usage if requested
      if (parsed.showUsage) {
        const lastMsg = agent.state.messages.at(-1);
        if (lastMsg && "usage" in lastMsg && lastMsg.role === "assistant") {
          renderUsage((lastMsg as AssistantMessage).usage, activeModel);
        }
      }

      // Handle suggested command
      const currentSuggestion = getSuggestedCommand();
      if (currentSuggestion) {
        renderSuggestedCommand(currentSuggestion);
      }

      // Next action loop — stays here until user picks something that leaves
      let actionDone = false;
      while (!actionDone) {
        const nextStep = await promptForExplainNextAction(currentSuggestion);

        if (nextStep === "cancel") {
          clack.outro("Done.");
          return;
        }

        if (nextStep === "run" && currentSuggestion) {
          await maybeRunSuggestedCommand(currentSuggestion.command, parsed.bypassPermissions || !config.ai.confirmBeforeRun);
          // Stay in action loop — don't re-prompt the LLM
          continue;
        }

        if (nextStep === "follow-up") {
          activeQuestion = await promptForRequiredText({
            message: "Ask a follow-up question:",
            placeholder: "e.g. what does the -r flag do?",
            emptyError: "Please enter a question."
          });
          actionDone = true;
          continue;
        }

        if (nextStep === "new") {
          const keepModel = await promptToKeepModel(activeModel, activeEffort);

          if (!keepModel) {
            activeModel = applyModelModifications(
              activeProvider,
              await promptForModelChoice(undefined, providerConfig.defaultModel, activeProvider)
            );
            activeEffort = await promptForReasoningEffort(undefined, providerConfig.defaultEffort ?? "low", activeModel);
            agent.setModel(activeModel);
            agent.setThinkingLevel(mapEffortToThinkingLevel(activeEffort));
          }

          activeQuestion = await promptForRequiredText({
            message: "What terminal command or shell concept should Sage explain?",
            placeholder: "what is whoami",
            emptyError: "Please enter a question."
          });
          agent.clearMessages();
          actionDone = true;
          continue;
        }
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown explain error";
    clack.log.error(message);
    process.exitCode = 1;
  }
}
