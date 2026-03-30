import type { CopilotClient, CopilotSession } from "@github/copilot-sdk";

import { sleep } from "@/lib/utils/sleep";

import type {
  AIModelInfo,
  AIProviderClient,
  AIProviderSession,
  CreateAIProviderSessionOptions,
} from "@/lib/ai/providers/types";

export function createCopilotProviderClient(options: {
  client: CopilotClient;
  authLabel: string;
  availableModels: AIModelInfo[];
}): AIProviderClient {
  const sessionIds = new WeakMap<AIProviderSession, string>();

  return {
    provider: "copilot",
    authLabel: options.authLabel,
    availableModels: options.availableModels,
    async createSession(sessionOptions: CreateAIProviderSessionOptions) {
      const config = {
        clientName: "@jam/sage",
        model: sessionOptions.model,
        reasoningEffort: sessionOptions.reasoningEffort,
        availableTools: sessionOptions.availableTools ?? [],
        streaming: false,
        workingDirectory: sessionOptions.workingDirectory,
        systemMessage: {
          mode: "append" as const,
          content: sessionOptions.systemPrompt,
        },
        onPermissionRequest() {
          return { kind: "denied-interactively-by-user" as const };
        },
      };

      const copilotSession = await options.client.createSession(config);
      const providerSession = createCopilotProviderSession(copilotSession);
      sessionIds.set(providerSession, copilotSession.sessionId);

      return providerSession;
    },
    async shutdown(session) {
      if (session) {
        const sessionId = sessionIds.get(session);
        await Promise.race([
          session.disconnect().catch(() => undefined),
          sleep(1_000),
        ]);
        if (sessionId) {
          await options.client.deleteSession(sessionId).catch(() => undefined);
          sessionIds.delete(session);
        }
      }

      const stopResult = await Promise.race([
        options.client
          .stop()
          .then(() => "stopped" as const)
          .catch(() => "failed" as const),
        sleep(2_000).then(() => "timeout" as const),
      ]);

      if (stopResult !== "stopped") {
        await options.client.forceStop().catch(() => undefined);
      }
    },
  };
}

function createCopilotProviderSession(
  session: CopilotSession,
): AIProviderSession {
  return {
    async sendPrompt(prompt: string) {
      const response = await session.sendAndWait({ prompt });
      return response?.data.content;
    },
    onUsage(handler) {
      return session.on("assistant.usage", (event) => {
        handler({
          inputTokens: event.data.inputTokens,
          outputTokens: event.data.outputTokens,
          cacheReadTokens: event.data.cacheReadTokens,
          cacheWriteTokens: event.data.cacheWriteTokens,
        });
      });
    },
    async disconnect() {
      await session.disconnect();
    },
  };
}
