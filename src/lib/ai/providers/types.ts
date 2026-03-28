import type { ReasoningEffortValue, AIProviderName } from "@/lib/ai/schemas";

export type AIModelInfo = {
  id: string;
  name: string;
  supportsReasoningEffort: boolean;
  supportedReasoningEfforts: ReasoningEffortValue[];
  maxContextWindowTokens?: number;
};

export type AIUsageEvent = {
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
};

export type AIProviderSession = {
  sendPrompt(prompt: string): Promise<string | undefined>;
  onUsage(handler: (event: AIUsageEvent) => void): () => void;
  disconnect(): Promise<void>;
};

export type CreateAIProviderSessionOptions = {
  model: string;
  reasoningEffort?: ReasoningEffortValue;
  systemPrompt: string;
  availableTools?: string[];
  workingDirectory?: string;
};

export type AIProviderClient = {
  provider: AIProviderName;
  authLabel: string;
  availableModels: AIModelInfo[];
  createSession(options: CreateAIProviderSessionOptions): Promise<AIProviderSession>;
  shutdown(session?: AIProviderSession): Promise<void>;
};
