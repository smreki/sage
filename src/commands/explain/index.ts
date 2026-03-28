import process from "node:process";

import * as clack from "@clack/prompts";
import pc from "picocolors";

import { buildExplainPrompt, explainSystemPrompt } from "@/commands/explain/prompts";
import { renderExplainResponse } from "@/commands/explain/render-response";
import { requestExplainResponse } from "@/commands/explain/request-response";
import { explainOptionsSchema } from "@/commands/explain/schemas";

import { initializeAIProvider } from "@/lib/ai/providers";
import { buildModelChoices } from "@/lib/ai/models";
import { shutdownProvider } from "@/lib/ai/runtime";
import { createUsageTracker, estimateContextUsage } from "@/lib/ai/utils/usage";
import { readConfig } from "@/lib/config";
import { promptForExplainNextAction, promptForModelChoice, promptForReasoningEffort, promptForRequiredText, promptToKeepModel } from "@/lib/terminal/prompts";
import { maybeRunSuggestedCommand } from "@/lib/terminal/suggested-command";

import type { AIProviderClient, AIProviderSession } from "@/lib/ai/providers";

export async function runExplainCommand(question: string | undefined, options: unknown) {
  const parsed = explainOptionsSchema.parse({
    question,
    ...(typeof options === "object" && options !== null ? options : {})
  });
  const config = readConfig();
  const activeProvider = parsed.provider ?? config.ai.defaultProvider;
  const providerConfig = config.ai.providers[activeProvider];

  clack.intro(pc.inverse(" sage explain "));

  const connectionSpinner = clack.spinner();
  connectionSpinner.start(`Connecting to ${activeProvider}`);

  let client: AIProviderClient | undefined;
  let session: AIProviderSession | undefined;

  try {
    client = await initializeAIProvider(activeProvider);
    connectionSpinner.stop(`Connected via ${client.authLabel}`);

    const modelChoices = buildModelChoices(providerConfig.availableModels, client.availableModels);
    const model = await promptForModelChoice(parsed.model, providerConfig.defaultModel, modelChoices);
    const effort = await promptForReasoningEffort(parsed.effort, providerConfig.defaultEffort, model);

    let activeModel = model;
    let activeEffort = effort;
    let activeQuestion = await promptForRequiredText({
      initialValue: parsed.question,
      message: "What terminal command or shell concept should Sage explain?",
      placeholder: "what is whoami",
      emptyError: "Please enter a question."
    });

    session = await client.createSession({
      model: activeModel.sdkModelId,
      reasoningEffort: activeEffort,
      availableTools: [],
      workingDirectory: process.cwd(),
      systemPrompt: explainSystemPrompt
    });

    let usageTracker = createUsageTracker(activeModel);
    let detachUsageListener = usageTracker.attach(session);

    while (true) {
      const answerSpinner = clack.spinner();
      answerSpinner.start(`Explaining with ${activeModel.label}`);

      const response = await requestExplainResponse(session, buildExplainPrompt(activeQuestion));
      answerSpinner.stop("Structured response received");

      renderExplainResponse({
        response,
        modelLabel: activeModel.label,
        usage: usageTracker.stats,
        contextEstimate: estimateContextUsage(usageTracker.stats, client.availableModels),
        short: parsed.short,
        showUsage: parsed.showUsage
      });

      while (true) {
        console.log();
        const nextStep = await promptForExplainNextAction(response);

        if (nextStep === "cancel") {
          clack.outro("Done.");
          return;
        }

        if (nextStep === "run") {
          await maybeRunSuggestedCommand(response.suggestedCommand?.command, parsed.bypassPermissions || !config.ai.confirmBeforeRun);
          continue;
        }

        if (nextStep === "follow-up") {
          activeQuestion = await promptForRequiredText({
            message: "Ask the next question",
            placeholder: response.followUpQuestions[0] ?? "How does this compare to id?",
            emptyError: "Please enter a follow-up question."
          });
          break;
        }

        const keepModel = await promptToKeepModel(activeModel, activeEffort);

        if (!keepModel) {
          activeModel = await promptForModelChoice(undefined, providerConfig.defaultModel, modelChoices);
          activeEffort = await promptForReasoningEffort(undefined, providerConfig.defaultEffort, activeModel);
        }

        await session.disconnect();
        detachUsageListener();

        activeQuestion = await promptForRequiredText({
          message: "What terminal command or shell concept should Sage explain?",
          placeholder: "what is whoami",
          emptyError: "Please enter a question."
        });
        session = await client.createSession({
          model: activeModel.sdkModelId,
          reasoningEffort: activeEffort,
          availableTools: [],
          workingDirectory: process.cwd(),
          systemPrompt: explainSystemPrompt
        });
        usageTracker = createUsageTracker(activeModel);
        detachUsageListener = usageTracker.attach(session);
        break;
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown explain error";
    clack.log.error(message);
    process.exitCode = 1;
  } finally {
    await shutdownProvider(session, client);
  }
}
