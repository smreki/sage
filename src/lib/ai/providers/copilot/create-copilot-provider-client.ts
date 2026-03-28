import type { CopilotClient, CopilotSession } from "@github/copilot-sdk";

import { sleep } from "@/lib/utils/sleep";

import type { AIModelInfo, AIProviderClient, AIProviderSession, CreateAIProviderSessionOptions } from "@/lib/ai/providers/types";

export function createCopilotProviderClient(options: {
  client: CopilotClient;
  authLabel: string;
  availableModels: AIModelInfo[];
}): AIProviderClient {
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
          content: sessionOptions.systemPrompt
        },
        onPermissionRequest() {
          return { kind: "denied-interactively-by-user" as const };
        }
      };

      const session = await options.client.createSession(config);

      return createCopilotProviderSession(session);
    },
    async shutdown(session) {
      if (session) {
        await Promise.race([
          session.disconnect().catch(() => undefined),
          sleep(1_000)
        ]);
      }

      const stopResult = await Promise.race([
        options.client.stop().then(() => "stopped" as const).catch(() => "failed" as const),
        sleep(2_000).then(() => "timeout" as const)
      ]);

      if (stopResult !== "stopped") {
        await options.client.forceStop().catch(() => undefined);
      }
    }
  };
}

function createCopilotProviderSession(session: CopilotSession): AIProviderSession {
  return {
    async sendPrompt(prompt: string) {
      const response = await session.sendAndWait({ prompt });
      return response?.data.content;
    },
    onUsage(handler) {
      return session.on("assistant.usage", (event) => {
        handler({
          model: event.data.model,
          inputTokens: event.data.inputTokens,
          outputTokens: event.data.outputTokens,
          cacheReadTokens: event.data.cacheReadTokens,
          cacheWriteTokens: event.data.cacheWriteTokens
        });
      });
    },
    async disconnect() {
      await session.disconnect();
    }
  };
}
