import pc from "picocolors";

import { formatBulletList } from "@/lib/terminal/render/format-bullet-list";
import { formatKeyValueList } from "@/lib/terminal/render/format-key-value-list";
import { note } from "@/lib/terminal/render/render-note";

import type { UsageStats } from "@/lib/ai/utils/usage";
import type { ExplainResponse } from "@/commands/explain/schemas";

type RenderExplainResponseOptions = {
  response: ExplainResponse;
  modelLabel: string;
  usage: UsageStats;
  contextEstimate: { percent: number | undefined; label: string };
  short: boolean;
  showUsage: boolean;
};

export function renderExplainResponseView(
  options: RenderExplainResponseOptions,
): void {
  const { response, modelLabel, usage, contextEstimate, short, showUsage } =
    options;

  note(response.summary, "= Summary");

  if (response.suggestedCommand?.command) {
    const content = [
      pc.green(response.suggestedCommand.command),
      pc.dim(
        `${response.suggestedCommand.reason} (${response.suggestedCommand.risk} risk)`,
      ),
    ].join("\n");
    note(content, "$ Suggested Command");
  }

  if (!short) {
    note(response.question, "? Question");

    if (response.explanation.length > 0) {
      note(formatBulletList(response.explanation), "> Explanation");
    }

    if (response.examples.length > 0) {
      const items = response.examples.map(
        (ex) => `${pc.green(ex.command)} - ${ex.description}`,
      );
      note(formatBulletList(items), "* Examples");
    }

    if (response.warnings.length > 0) {
      note(formatBulletList(response.warnings), pc.yellow("! Warnings"));
    }

    if (response.followUpQuestions.length > 0) {
      note(formatBulletList(response.followUpQuestions), "+ Follow-ups");
    }
  }

  if (showUsage) {
    note(
      formatKeyValueList([
        { label: "model", value: modelLabel },
        {
          label: "tokens",
          value: `${usage.inputTokens} in / ${usage.outputTokens} out`,
        },
        {
          label: "cache",
          value: `${usage.cacheReadTokens} read / ${usage.cacheWriteTokens} write`,
        },
        {
          label: "context",
          value:
            contextEstimate.percent !== undefined
              ? `~${contextEstimate.percent}% (${contextEstimate.label})`
              : contextEstimate.label,
        },
      ]),
      "# Usage",
    );
  }
}
