import { Box, Newline, Text } from "ink";
import React from "react";

import { BulletList, KeyValueList, Section } from "@/lib/terminal/render/ink";

import type { UsageStats } from "@/lib/ai/utils/usage";
import type { ExplainResponse } from "@/commands/explain/schemas";

type ExplainResponseViewProps = {
  response: ExplainResponse;
  modelLabel: string;
  usage: UsageStats;
  contextEstimate: { percent: number | undefined; label: string };
  short: boolean;
  showUsage: boolean;
};

export function ExplainResponseView({ response, modelLabel, usage, contextEstimate, short, showUsage }: ExplainResponseViewProps) {
  return (
    <Box flexDirection="column">
      <Section title="Summary" icon="=">
        <Text>{response.summary}</Text>
      </Section>

      {response.suggestedCommand?.command && (
        <Section title="Suggested Command" icon="$">
          <Box flexDirection="column">
            <Text color="green">{response.suggestedCommand.command}</Text>
            <Text dimColor>
              {response.suggestedCommand.reason} ({response.suggestedCommand.risk} risk)
            </Text>
          </Box>
        </Section>
      )}

      {!short && (
        <>
          <Section title="Question" icon="?">
            <Text>{response.question}</Text>
          </Section>

          {response.explanation.length > 0 && (
            <Section title="Explanation" icon=">">
              <BulletList items={response.explanation} />
            </Section>
          )}

          {response.examples.length > 0 && (
            <Section title="Examples" icon="*">
              <BulletList
                items={response.examples.map((example) => (
                  <>
                    <Text color="green">{example.command}</Text>
                    <Text> - {example.description}</Text>
                  </>
                ))}
              />
            </Section>
          )}

          {response.warnings.length > 0 && (
            <Section title="Warnings" icon="!" titleColor="yellow">
              <BulletList items={response.warnings} />
            </Section>
          )}

          {response.followUpQuestions.length > 0 && (
            <Section title="Follow-ups" icon="+">
              <BulletList items={response.followUpQuestions} />
            </Section>
          )}
        </>
      )}

      {showUsage && (
        <Section title="Usage" icon="#">
          <KeyValueList
            items={[
              { label: "model", value: modelLabel },
              { label: "tokens", value: `${usage.inputTokens} in / ${usage.outputTokens} out` },
              { label: "cache", value: `${usage.cacheReadTokens} read / ${usage.cacheWriteTokens} write` },
              {
                label: "context",
                value: contextEstimate.percent !== undefined ? `~${contextEstimate.percent}% (${contextEstimate.label})` : contextEstimate.label
              }
            ]}
          />
        </Section>
      )}
    </Box>
  );
}
