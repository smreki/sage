import { CopilotClient } from "@github/copilot-sdk";

import { createCopilotProviderClient } from "@/lib/ai/providers/copilot/create-copilot-provider-client";

export async function initializeCopilotProvider() {
  process.env.NODE_NO_WARNINGS = "1";
  process.env.NODE_OPTIONS = appendNoWarnings(process.env.NODE_OPTIONS);

  const client = new CopilotClient();

  try {
    await client.start();
    const auth = await client.getAuthStatus();

    if (!auth.isAuthenticated) {
      throw new Error("GitHub Copilot CLI is not authenticated. Run `copilot auth login` first.");
    }

    const availableModels = (await client.listModels()).map((model) => ({
      id: model.id,
      name: model.name,
      supportsReasoningEffort: model.capabilities.supports.reasoningEffort,
      supportedReasoningEfforts: model.supportedReasoningEfforts ?? ["low", "medium", "high"],
      maxContextWindowTokens: model.capabilities.limits.max_context_window_tokens
    }));

    return createCopilotProviderClient({
      client,
      authLabel: auth.login ?? "Copilot user",
      availableModels
    });
  } catch (error) {
    await client.forceStop().catch(() => undefined);

    if (error instanceof Error && error.message.includes("copilot")) {
      throw new Error("GitHub Copilot CLI is required. Install `copilot` and make sure it is available in PATH.");
    }

    throw error;
  }
}

function appendNoWarnings(currentValue: string | undefined) {
  if (!currentValue) {
    return "--no-warnings";
  }

  return currentValue.includes("--no-warnings") ? currentValue : `${currentValue} --no-warnings`;
}
