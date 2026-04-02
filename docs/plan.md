# Sage: Replace GitHub Copilot SDK with Pi AI

## Product Requirements Document

### Overview

Replace `@github/copilot-sdk` with `@mariozechner/pi-ai` and `@mariozechner/pi-agent-core` as the LLM backend for Sage. This unlocks multi-provider support, streaming responses, agent tools (`sh`, `git`, etc.), and eliminates the fragile JSON extraction/repair cycle in favor of streamed markdown + tool calling.

### Goals

1. **Multi-provider support** — users can choose from 20+ providers (Copilot, Codex, OpenAI, Anthropic, Google, etc.)
2. **Streaming responses** — replace spinner-then-dump with live-streamed markdown output
3. **Markdown output** — LLM returns natural markdown instead of JSON; structured data (suggested command) via tool calling
4. **Better CLI args** — `--provider`, `--model`, `--detailed` (replaces `--no-short`)
5. **Auth flow** — clack step to sign in when provider requires it and user is not authenticated
6. **Agent tools** — give the agent `sh` and `git` tools via `pi-agent-core` so it can execute commands and inspect repos when answering questions

### Non-Goals

- Full TUI (no pi-tui adoption; keep clack for prompts)
- Config file migration (keep `conf` store, update schema)

---

## Architecture Changes

### Dependencies

| Remove | Add |
|---|---|
| `@github/copilot-sdk` | `@mariozechner/pi-ai` |
| `zod` (for JSON schema generation) | `@mariozechner/pi-agent-core` |

Keep: `@clack/prompts`, `commander`, `conf`, `execa`, `picocolors`, `zod` (still used for CLI option validation and config schemas).

Note: `zod-to-json-schema` is no longer needed since we stop requiring JSON responses. Zod stays for config/options validation only.

### High-Level Flow (Before vs After)

```
BEFORE:
  CLI args -> init Copilot SDK -> spawn CLI server -> create session
  -> sendAndWait(JSON prompt) -> spinner... -> extract JSON -> Zod validate
  -> repair prompt if invalid -> render structured boxes

AFTER:
  CLI args -> getModel(provider, model) -> create Agent with tools (sh, git, suggest_command)
  -> agent.prompt(question) -> subscribe to events -> stream markdown deltas via clack
  -> agent executes sh/git tools autonomously -> tool call for suggested command
  -> render suggested command box -> done
```

---

## Detailed Plan

### Phase 1: New Provider Layer (replace `src/lib/ai/`)

#### 1.1 Update provider schema and config

**File: `src/lib/ai/schemas/ai-provider-schema.ts`**

Replace `z.enum(["copilot"])` with pi-ai's supported providers. Rather than hardcoding every provider, accept any string and validate at runtime against `getProviders()`:

```ts
// Known providers with nice defaults, but accept any string for custom/new providers
export const aiProviderSchema = z.string().min(1);
export type AIProviderName = string;
```

**File: `src/lib/ai/schemas/ai-config-schema.ts`**

Update config structure:

```ts
export const aiProviderConfigSchema = z.object({
  defaultModel: z.string().optional(),
  defaultEffort: reasoningEffortSchema.default("low"),
});

export const aiConfigSchema = z.object({
  defaultProvider: z.string().default("copilot"),
  confirmBeforeRun: z.boolean().default(true),
  providers: z.record(z.string(), aiProviderConfigSchema).default({
    copilot: { defaultEffort: "low" },
  }),
});
```

This allows any provider to have per-provider config without hardcoding.

#### 1.2 Delete Copilot SDK adapter

**Delete entirely:**
- `src/lib/ai/providers/copilot/initialize-copilot-provider.ts`
- `src/lib/ai/providers/copilot/create-copilot-provider-client.ts`
- `src/lib/ai/providers/copilot/` directory

#### 1.3 Delete custom provider types

**Delete entirely:**
- `src/lib/ai/providers/types.ts` — replace with pi-ai's `Model` type directly
- `src/lib/ai/providers/index.ts` — replace with thin wrapper around pi-ai

#### 1.4 New provider module

**New file: `src/lib/ai/provider.ts`**

Thin wrapper around pi-ai:

```ts
import { getProviders, getModels, getModel, type Model } from "@mariozechner/pi-ai";

export function resolveProvider(providerName: string): string {
  const available = getProviders();
  if (!available.includes(providerName)) {
    throw new Error(
      `Unknown provider "${providerName}". Available: ${available.join(", ")}`
    );
  }
  return providerName;
}

export function resolveModel(provider: string, modelId: string): Model<any> {
  return getModel(provider, modelId);
}

export function listModels(provider: string) {
  return getModels(provider);
}

export { stream, complete, getProviders } from "@mariozechner/pi-ai";
```

#### 1.5 Delete JSON extraction utilities

**Delete entirely:**
- `src/lib/ai/utils/json/extract-json.ts`
- `src/lib/ai/utils/json/try-parse-json-response.ts`
- `src/lib/ai/utils/json/index.ts`
- `src/lib/ai/utils/json/` directory

These exist solely for the JSON extraction/repair cycle, which is eliminated.

#### 1.6 Replace usage tracking

**Delete:**
- `src/lib/ai/utils/usage/create-usage-tracker.ts`
- `src/lib/ai/utils/usage/usage-stats.ts`
- `src/lib/ai/utils/usage/estimate-context-usage.ts`
- `src/lib/ai/utils/usage/index.ts`

Pi-ai provides usage data directly on the `AssistantMessage` returned by `stream().result()`:

```ts
const message = await s.result();
// message.usage.input, message.usage.output
// message.usage.cost.total
```

Usage display becomes trivial — no need for a separate tracker.

#### 1.7 Simplify model selection

**Rewrite: `src/lib/ai/models.ts`**

Replace `buildModelChoices` / `findModelChoice` / `AIModelChoice` with a simpler approach using pi-ai's model registry:

```ts
import { getModels, type Model } from "@mariozechner/pi-ai";

export interface ModelChoice {
  model: Model<any>;
  label: string;
}

export function getModelChoices(provider: string): ModelChoice[] {
  return getModels(provider).map((m) => ({
    model: m,
    label: `${m.name}${m.reasoning ? " (reasoning)" : ""}`,
  }));
}

export function findModel(provider: string, modelId: string): Model<any> | undefined {
  const models = getModels(provider);
  return models.find(
    (m) => m.id === modelId || m.id.includes(modelId) || m.name.toLowerCase().includes(modelId.toLowerCase())
  );
}
```

#### 1.8 Delete shutdown utility

**Delete: `src/lib/ai/runtime/shutdown-provider.ts`**

Pi-ai makes direct HTTP calls — no server process to shut down.

---

### Phase 2: CLI Args and Auth

#### 2.1 Update CLI options

**File: `src/index.ts`**

```diff
  program
    .command("explain")
    .argument("[question...]", "Your question about a terminal command")
-   .option("--provider <name>", "AI provider")
-   .option("--model <name>", "Model to use")
-   .option("--effort <level>", "Reasoning effort")
-   .option("--no-short", "Show full response with all sections")
+   .option("--provider <name>", "AI provider (e.g. copilot, openai, anthropic, google)")
+   .option("--model <name>", "Model to use (e.g. gpt-4o-mini, claude-sonnet-4)")
+   .option("--effort <level>", "Reasoning effort (low, medium, high)")
+   .option("--detailed", "Show full response with all sections")
    .option("--show-usage", "Show token usage")
    .option("--bypass-permissions", "Skip command confirmation")
```

**File: `src/commands/explain/schemas/explain-options-schema.ts`**

```ts
export const explainOptionsSchema = z.object({
  question:          optionalTrimmedStringSchema,
  provider:          z.string().optional(),
  model:             optionalTrimmedStringSchema,
  effort:            reasoningEffortSchema.optional(),
  detailed:          z.boolean().default(false),
  showUsage:         z.boolean().default(false),
  bypassPermissions: z.boolean().default(false),
});
```

#### 2.2 Auth check with clack sign-in step

**New file: `src/lib/ai/auth.ts`**

Before making any API call, check if the provider has a valid API key. Pi-ai uses environment variables per provider (e.g. `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `COPILOT_GITHUB_TOKEN`).

For OAuth-based providers (Copilot, Codex, Gemini CLI), pi-ai has an OAuth module.

```ts
import * as clack from "@clack/prompts";
import { getProviders } from "@mariozechner/pi-ai";

const ENV_VAR_MAP: Record<string, string[]> = {
  openai:    ["OPENAI_API_KEY"],
  anthropic: ["ANTHROPIC_API_KEY"],
  google:    ["GEMINI_API_KEY"],
  copilot:   ["COPILOT_GITHUB_TOKEN", "GH_TOKEN", "GITHUB_TOKEN"],
  codex:     ["OPENAI_CODEX_TOKEN"],  // OAuth-based
  groq:      ["GROQ_API_KEY"],
  xai:       ["XAI_API_KEY"],
  mistral:   ["MISTRAL_API_KEY"],
  // ... etc
};

export function checkProviderAuth(provider: string): { authenticated: boolean; hint: string } {
  const vars = ENV_VAR_MAP[provider] ?? [];
  const found = vars.find((v) => process.env[v]);
  if (found) return { authenticated: true, hint: "" };

  // For OAuth providers, check if pi-ai has a cached token
  // (details TBD based on pi-ai OAuth module exploration)

  return {
    authenticated: false,
    hint: vars.length > 0
      ? `Set ${vars.join(" or ")} in your environment`
      : `Unknown provider auth requirements for "${provider}"`,
  };
}
```

In the explain command flow, after resolving the provider:

```ts
const auth = checkProviderAuth(provider);
if (!auth.authenticated) {
  clack.log.warn(`Not authenticated with ${provider}.`);
  clack.log.info(auth.hint);

  // For OAuth providers, offer to sign in
  if (isOAuthProvider(provider)) {
    const shouldSignIn = await clack.confirm({ message: `Sign in to ${provider}?` });
    if (clack.isCancel(shouldSignIn) || !shouldSignIn) {
      handlePromptCancel("Authentication required");
    }
    await performOAuthLogin(provider); // Uses pi-ai's OAuth module
  } else {
    handlePromptCancel("Authentication required");
  }
}
```

#### 2.3 Model validation and interactive fallback

When `--model` is provided but doesn't match any model for the provider:

```ts
const models = getModelChoices(provider);
let model = options.model ? findModel(provider, options.model) : undefined;

if (options.model && !model) {
  clack.log.warn(`Model "${options.model}" not found for ${provider}.`);
  // Fall through to interactive picker
}

if (!model) {
  const choice = await clack.select({
    message: `Choose a model (${provider}):`,
    options: models.map((m) => ({
      value: m.model.id,
      label: m.label,
      hint: m.model.reasoning ? "reasoning" : undefined,
    })),
  });
  model = resolveModel(provider, requirePromptValue(choice));
}
```

---

### Phase 3: Streaming Markdown Response

#### 3.1 New system prompt

**Rewrite: `src/commands/explain/prompts/explain-system-prompt.ts`**

```ts
export function buildSystemPrompt(detailed: boolean): string {
  const sections = detailed
    ? `
Your response MUST include ALL of the following sections in this order:

## Question
Restate the user's question clearly.

## Summary
A brief 1-2 sentence summary of the answer.

## Explanation
A detailed explanation with bullet points or numbered steps.

## Examples
Practical command examples with brief descriptions. Format each as:
\`\`\`sh
command here
\`\`\`
Description of what this command does.

## Warnings
Any safety warnings, caveats, or gotchas. Omit this section if there are none.

## Follow-up Questions
2-3 suggested follow-up questions the user might ask.`
    : `
Your response MUST include these sections in this order:

## Summary
A brief 1-2 sentence summary of the answer.

## Explanation
A concise explanation. Keep it brief but clear.`;

  return `You are Sage, a terminal command explanation engine.

You help users understand terminal commands, shell concepts, and CLI tools.
Respond in Markdown with the sections described below.
Focus on practical, actionable explanations.
Be concise but thorough.
${sections}

You have access to tools:
- **sh**: Execute shell commands to inspect the system, check installed tools, read files, or gather context. Use this when the user's question requires checking system state (e.g. "what version of node do I have?", "what's in my PATH?"). Only use for read-only, non-destructive commands.
- **git**: Run git commands to inspect repository state (status, log, diff, branch, etc.). Use this when the user asks about git or version control. Only read-only git operations.
- **suggest_command**: If the user's question involves a specific command they could run, use this tool to suggest it. Only suggest ONE safe, low-risk command. Never suggest destructive, privileged, or multi-step commands.`;
}
```

#### 3.2 Define agent tools

**New file: `src/commands/explain/tools/suggest-command-tool.ts`**

Use pi-agent-core's `AgentTool` type with TypeBox schema:

```ts
import { Type } from "@mariozechner/pi-ai";
import type { AgentTool } from "@mariozechner/pi-agent-core";

export const suggestCommandTool: AgentTool = {
  name: "suggest_command",
  label: "Suggest Command",
  description:
    "Suggest a single terminal command the user can run. Only call this if the explanation involves a runnable command. The command must be safe and low-risk.",
  parameters: Type.Object({
    command: Type.String({ description: "The exact command to run" }),
    reason: Type.String({ description: "Why this command is suggested" }),
    risk: Type.Union(
      [Type.Literal("low"), Type.Literal("medium"), Type.Literal("high")],
      { description: "Risk level of running this command" }
    ),
  }),
  execute: async (toolCallId, params) => {
    // This tool doesn't execute anything — it just captures structured data
    // for the UI to display after streaming completes.
    return {
      content: [{ type: "text", text: `Suggested: ${params.command}` }],
      details: params,
    };
  },
};

export interface SuggestedCommand {
  command: string;
  reason: string;
  risk: "low" | "medium" | "high";
}
```

**New file: `src/commands/explain/tools/sh-tool.ts`**

Shell execution tool — lets the agent run commands to gather context for its answer:

```ts
import { Type } from "@mariozechner/pi-ai";
import { execaCommand } from "execa";
import type { AgentTool } from "@mariozechner/pi-agent-core";

export const shTool: AgentTool = {
  name: "sh",
  label: "Shell",
  description:
    "Execute a shell command and return its output. Use this to inspect the system, check installed tools, read files, or gather context needed to answer the user's question. Do NOT use this for destructive or privileged operations.",
  parameters: Type.Object({
    command: Type.String({ description: "The shell command to execute" }),
  }),
  execute: async (toolCallId, params, signal) => {
    const result = await execaCommand(params.command, {
      cwd: process.cwd(),
      reject: false,
      timeout: 15_000,
      signal,
    });

    const output = [result.stdout, result.stderr].filter(Boolean).join("\n");

    if (result.exitCode !== 0) {
      throw new Error(
        `Command exited with code ${result.exitCode}:\n${output || "(no output)"}`
      );
    }

    return {
      content: [{ type: "text", text: output || "(no output)" }],
      details: { command: params.command, exitCode: result.exitCode },
    };
  },
};
```

**New file: `src/commands/explain/tools/git-tool.ts`**

Git-specific tool — lets the agent inspect repo state:

```ts
import { Type } from "@mariozechner/pi-ai";
import { execaCommand } from "execa";
import type { AgentTool } from "@mariozechner/pi-agent-core";

export const gitTool: AgentTool = {
  name: "git",
  label: "Git",
  description:
    "Run a git command in the current repository. Use this to inspect repo state (status, log, diff, branch, remote, etc.) when the user's question is about git or version control. Only read-only git operations are allowed.",
  parameters: Type.Object({
    args: Type.String({ description: "Git arguments (e.g. 'status', 'log --oneline -5', 'diff HEAD~1')" }),
  }),
  execute: async (toolCallId, params, signal) => {
    // Block destructive git operations
    const blocked = ["push", "reset --hard", "clean -fd", "checkout -f", "rebase", "merge", "cherry-pick"];
    const firstArg = params.args.split(/\s+/)[0];
    if (blocked.some((b) => params.args.startsWith(b))) {
      throw new Error(`Destructive git operation "${firstArg}" is not allowed.`);
    }

    const result = await execaCommand(`git ${params.args}`, {
      cwd: process.cwd(),
      reject: false,
      timeout: 15_000,
      signal,
    });

    const output = [result.stdout, result.stderr].filter(Boolean).join("\n");

    if (result.exitCode !== 0) {
      throw new Error(
        `git ${params.args} exited with code ${result.exitCode}:\n${output || "(no output)"}`
      );
    }

    return {
      content: [{ type: "text", text: output || "(no output)" }],
      details: { command: `git ${params.args}`, exitCode: result.exitCode },
    };
  },
};
```

**New file: `src/commands/explain/tools/index.ts`**

Barrel export for all tools:

```ts
export { suggestCommandTool, type SuggestedCommand } from "./suggest-command-tool.js";
export { shTool } from "./sh-tool.js";
export { gitTool } from "./git-tool.js";
```

#### 3.3 Delete old prompt/schema files

**Delete:**
- `src/commands/explain/prompts/build-explain-prompt.ts` — replaced by system prompt + direct user message
- `src/commands/explain/prompts/build-repair-prompt.ts` — no longer needed
- `src/commands/explain/schemas/explain-response-schema.ts` — no longer parsing JSON
- `src/commands/explain/schemas/explain-example-schema.ts`
- `src/commands/explain/schemas/explain-suggested-command-schema.ts`

#### 3.4 Delete old response renderer

**Delete:**
- `src/commands/explain/components/explain-response-view.ts` — replaced by streamed markdown
- `src/commands/explain/render-response.ts`
- `src/commands/explain/request-response.ts` — replaced by streaming flow

---

### Phase 4: Rewrite Explain Command (using pi-agent-core Agent)

#### 4.1 New explain flow

**Rewrite: `src/commands/explain/index.ts`**

Use `Agent` from pi-agent-core instead of raw `stream()`. The Agent handles the tool execution loop automatically — when the LLM calls `sh` or `git`, the agent executes the tool, feeds the result back, and the LLM continues. We subscribe to events for streaming output.

```ts
import * as clack from "@clack/prompts";
import { stream as clackStream } from "@clack/prompts";
import { Agent } from "@mariozechner/pi-agent-core";
import { buildSystemPrompt } from "./prompts/explain-system-prompt.js";
import { suggestCommandTool, shTool, gitTool, type SuggestedCommand } from "./tools/index.js";

export async function runExplainCommand(question: string, options: ExplainOptions) {
  clack.intro(" sage explain ");

  // 1. Resolve provider (default from config or --provider)
  const provider = resolveProvider(options.provider ?? config.ai.defaultProvider);

  // 2. Auth check
  await ensureAuthenticated(provider);

  // 3. Resolve model (--model or interactive picker)
  const model = await resolveOrPickModel(provider, options.model);

  // 4. Create Agent with tools
  const agent = new Agent({
    initialState: {
      systemPrompt: buildSystemPrompt(options.detailed),
      model,
      thinkingLevel: options.effort ?? "off",
      tools: [suggestCommandTool, shTool, gitTool],
      messages: [],
    },
    // Block destructive sh commands via beforeToolCall
    beforeToolCall: async ({ toolCall, args }) => {
      if (toolCall.name === "sh") {
        const assessment = assessSuggestedCommand(args.command);
        if (!assessment.allowed) {
          return { block: true, reason: assessment.reason };
        }
      }
    },
  });

  // 5. Subscribe to events for streaming + tool tracking
  let suggestedCommand: SuggestedCommand | undefined;
  let streamCollector: { push: (delta: string) => void; done: () => void } | undefined;

  agent.subscribe(async (event) => {
    // Stream text deltas
    if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
      streamCollector?.push(event.assistantMessageEvent.delta);
    }

    // Capture suggested command from tool execution
    if (event.type === "tool_execution_end" && event.toolName === "suggest_command") {
      suggestedCommand = event.result?.details as SuggestedCommand;
    }

    // Show tool execution in terminal
    if (event.type === "tool_execution_start") {
      if (event.toolName === "sh" || event.toolName === "git") {
        clack.log.step(`Running: ${event.toolName} ${JSON.stringify(event.args)}`);
      }
    }
  });

  // Outer loop for follow-ups
  while (true) {
    suggestedCommand = undefined;

    // Stream the agent response via clack
    const agentPromise = agent.prompt(question);

    await clackStream.step(async function* () {
      // Yield text deltas as they arrive from the agent subscription
      const buffer: string[] = [];
      let finished = false;

      streamCollector = {
        push: (delta) => buffer.push(delta),
        done: () => { finished = true; },
      };

      // Poll buffer for deltas (agent.subscribe pushes into buffer)
      while (!finished) {
        if (buffer.length > 0) {
          yield buffer.splice(0, buffer.length).join("");
        }
        await new Promise((r) => setTimeout(r, 16)); // ~60fps
      }
      // Flush remaining
      if (buffer.length > 0) {
        yield buffer.join("");
      }
    }());

    await agentPromise;
    streamCollector?.done();

    // Show usage if requested
    if (options.showUsage) {
      const lastMsg = agent.state.messages.at(-1);
      if (lastMsg?.role === "assistant" && lastMsg.usage) {
        renderUsage(lastMsg.usage, model);
      }
    }

    // Handle suggested command
    if (suggestedCommand) {
      renderSuggestedCommand(suggestedCommand);
    }

    // Next action
    const action = await promptForExplainNextAction(suggestedCommand);

    if (action === "cancel") {
      clack.outro("Done.");
      return;
    }

    if (action === "run" && suggestedCommand) {
      await maybeRunSuggestedCommand(suggestedCommand.command, options.bypassPermissions);
      suggestedCommand = undefined;
      continue;
    }

    if (action === "follow-up") {
      question = await promptForRequiredText({
        message: "Ask a follow-up question:",
        placeholder: "e.g. what does the -r flag do?",
        emptyError: "Please enter a question.",
      });
      continue; // agent.prompt() will append to existing messages
    }

    if (action === "new") {
      question = await promptForRequiredText({
        message: "What do you want to know?",
        placeholder: "e.g. how to find large files",
        emptyError: "Please enter a question.",
      });
      agent.state.messages = []; // Reset conversation
      suggestedCommand = undefined;
      continue;
    }
  }
}
```

#### 4.2 Markdown rendering for final output

The streaming via `clack.stream.step()` outputs raw text deltas. For the streamed output, we have two options:

**Option A (simpler):** Stream raw markdown — headings show as `## Summary`, code blocks as fenced blocks. Readable in terminal, zero overhead.

**Option B (polished):** Use `marked` + `marked-terminal` to re-render the final complete markdown with ANSI colors after streaming completes. During streaming, show raw deltas; after done, clear and re-render formatted.

Recommendation: **Start with Option A** (raw streaming). Add Option B as a follow-up if the raw output doesn't feel polished enough. The clack stream box already provides decent visual framing.

#### 4.3 Suggested command rendering

**Keep but simplify: `src/lib/terminal/render/render-note.ts`**

After streaming completes, if a `suggest_command` tool call was received, render it in a note box (same as current behavior):

```ts
function renderSuggestedCommand(cmd: SuggestedCommand) {
  note(
    [
      pc.green(cmd.command),
      pc.dim(`${cmd.reason} (risk: ${cmd.risk})`),
    ].join("\n"),
    "Suggested Command"
  );
}
```

#### 4.4 Usage rendering

```ts
function renderUsage(usage: AssistantMessage["usage"], model: Model<any>) {
  note(
    [
      `Model: ${model.name}`,
      `Tokens: ${usage.input} in / ${usage.output} out`,
      `Cost: $${usage.cost.total.toFixed(4)}`,
    ].join("\n"),
    "Usage"
  );
}
```

---

### Phase 5: Cleanup

#### 5.1 Files to delete

```
src/lib/ai/providers/copilot/                        # entire directory
src/lib/ai/providers/types.ts                         # replaced by pi-ai types
src/lib/ai/providers/index.ts                         # replaced by provider.ts
src/lib/ai/utils/json/                                # entire directory
src/lib/ai/utils/usage/                               # entire directory
src/lib/ai/runtime/shutdown-provider.ts               # no server to shut down
src/commands/explain/prompts/build-explain-prompt.ts   # replaced by system prompt
src/commands/explain/prompts/build-repair-prompt.ts    # no more repair cycle
src/commands/explain/schemas/explain-response-schema.ts
src/commands/explain/schemas/explain-example-schema.ts
src/commands/explain/schemas/explain-suggested-command-schema.ts
src/commands/explain/components/explain-response-view.ts
src/commands/explain/render-response.ts
src/commands/explain/request-response.ts
```

#### 5.2 Files to create

```
src/lib/ai/provider.ts                                # thin pi-ai wrapper
src/lib/ai/auth.ts                                    # auth check + OAuth flow
src/commands/explain/tools/suggest-command-tool.ts     # suggest_command tool definition
src/commands/explain/tools/sh-tool.ts                  # shell execution tool
src/commands/explain/tools/git-tool.ts                 # git inspection tool
src/commands/explain/tools/index.ts                    # barrel export
```

#### 5.3 Files to rewrite

```
src/index.ts                                          # CLI args (--detailed, --provider, --model)
src/commands/explain/index.ts                          # main flow (streaming)
src/commands/explain/prompts/explain-system-prompt.ts  # markdown-based prompt
src/commands/explain/schemas/explain-options-schema.ts # --detailed replaces --no-short
src/lib/ai/schemas/ai-provider-schema.ts              # multi-provider
src/lib/ai/schemas/ai-config-schema.ts                # multi-provider config
src/lib/ai/models.ts                                  # pi-ai model registry
src/lib/terminal/prompts/prompt-for-model-choice.ts   # use pi-ai models
src/lib/terminal/prompts/prompt-for-reasoning-effort.ts # use pi-ai model.reasoning
src/lib/terminal/prompts/prompt-for-explain-next-action.ts # minor (uses SuggestedCommand type)
```

#### 5.4 Files to keep unchanged

```
src/lib/config/store.ts                               # keep conf store
src/lib/config/read-config.ts                         # keep
src/lib/config/save-config.ts                         # keep (update imports)
src/lib/security/commands.ts                          # keep command safety
src/lib/terminal/suggested-command.ts                  # keep
src/lib/terminal/render/render-note.ts                 # keep
src/lib/terminal/render/render-command-result.ts       # keep
src/lib/terminal/prompts/prompt-for-required-text.ts   # keep
src/lib/terminal/prompts/require-prompt-value.ts       # keep
src/lib/terminal/prompts/handle-prompt-cancel.ts       # keep
```

#### 5.5 Update package.json

```diff
  "dependencies": {
    "@clack/prompts":      "^0.10.1",
-   "@github/copilot-sdk": "^0.2.0",
+   "@mariozechner/pi-ai": "^latest",
+   "@mariozechner/pi-agent-core": "^latest",
    "commander":           "^14.0.1",
    "conf":                "^14.0.0",
    "execa":               "^9.6.0",
    "picocolors":          "^1.1.1",
    "zod":                 "^4.1.11"
  }
```

Note: `marked` + `marked-terminal` are optional — only add if we go with Option B for polished markdown rendering post-stream.

---

## Implementation Order

| Step | Description | Effort |
|---|---|---|
| 1 | Install `@mariozechner/pi-ai` + `@mariozechner/pi-agent-core`, remove `@github/copilot-sdk` | Small |
| 2 | Rewrite provider schema + config for multi-provider | Small |
| 3 | Create `src/lib/ai/provider.ts` (pi-ai wrapper) | Small |
| 4 | Rewrite `src/lib/ai/models.ts` (pi-ai model registry) | Small |
| 5 | Create `src/lib/ai/auth.ts` (auth check + sign-in flow) | Medium |
| 6 | Create agent tools: `suggest-command-tool.ts`, `sh-tool.ts`, `git-tool.ts` | Medium |
| 7 | Rewrite system prompt (markdown sections, `--detailed` flag, tool descriptions) | Small |
| 8 | Update CLI args in `src/index.ts` (`--detailed`, `--provider`, `--model`) | Small |
| 9 | Update options schema | Small |
| 10 | Rewrite `src/commands/explain/index.ts` (Agent + streaming + tools) | Large |
| 11 | Update terminal prompts (model picker, effort picker) | Medium |
| 12 | Delete old files (JSON utils, Copilot adapter, old schemas, old views) | Small |
| 13 | Update barrel re-exports (`index.ts` files) | Small |
| 14 | Test end-to-end with multiple providers + tool execution | Medium |

Total estimated effort: **2-3 days** for a single developer familiar with the codebase.

---

## Open Questions

1. **OAuth flow for Copilot/Codex** — pi-ai has an OAuth module (`@mariozechner/pi-ai/oauth`). Need to verify the exact flow for GitHub Copilot auth and whether it can reuse existing `gh` CLI tokens.

2. **Streaming markdown quality** — raw streamed markdown is readable but not colorized. Should we add `marked-terminal` for post-stream re-rendering, or is raw markdown acceptable for v1?

3. **Config migration** — existing `~/.config/jam-sage/config.json` files have `providers.copilot.defaultModel: "raptor-mini"`. Should we auto-migrate, warn, or just let defaults override?

4. **Model ID mapping** — Copilot-specific model aliases (e.g. `raptor-mini`) may not exist in pi-ai's registry. Need to map or document the equivalent pi-ai model IDs.

5. **Abort support** — pi-ai supports `AbortController`. Should we wire Ctrl+C to abort the stream gracefully (showing partial content) rather than killing the process?

6. **Tool execution UX** — when the agent runs `sh` or `git` tools, should we show the commands being executed in the clack output (e.g. `clack.log.step("Running: git status")`)? Should tool execution require user confirmation, or run automatically with the `beforeToolCall` safety check?

7. **Tool execution limits** — should we cap the number of tool calls per prompt to prevent runaway loops (e.g. max 5 tool calls)? Pi-agent-core doesn't enforce this natively but we could implement it in `beforeToolCall`.
