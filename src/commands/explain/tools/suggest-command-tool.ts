import { Type, type Static } from "@mariozechner/pi-ai";
import type { AgentTool } from "@mariozechner/pi-agent-core";

/** A command suggestion returned by the AI agent, including the command string, rationale, and risk assessment. */
export interface SuggestedCommand {
  command: string;
  reason: string;
  risk: "low" | "medium" | "high";
}

const suggestCommandParams = Type.Object({
  command: Type.String({ description: "The exact command to run" }),
  reason: Type.String({ description: "Why this command is suggested" }),
  risk: Type.Union(
    [Type.Literal("low"), Type.Literal("medium"), Type.Literal("high")],
    { description: "Risk level of running this command" }
  )
});

type SuggestCommandParams = Static<typeof suggestCommandParams>;

/** Agent tool that allows the AI to suggest a single terminal command for the user to run. */
export const suggestCommandTool: AgentTool<typeof suggestCommandParams, SuggestedCommand> = {
  name: "suggest_command",
  label: "Suggest Command",
  description:
    "Suggest a single terminal command the user can run. Only call this if the explanation involves a runnable command. The command must be safe and low-risk.",
  parameters: suggestCommandParams,
  execute: async (_toolCallId, params: SuggestCommandParams) => {
    return {
      content: [{ type: "text", text: `Suggested: ${params.command}` }],
      details: params as SuggestedCommand
    };
  }
};
