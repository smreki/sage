import React from "react";
import { render } from "ink";

import { ExplainResponseView } from "@/commands/explain/components/explain-response-view";

import type { UsageStats } from "@/lib/ai/utils/usage";
import type { ExplainResponse } from "@/commands/explain/schemas";

export async function renderExplainResponse(options: {
  response: ExplainResponse;
  modelLabel: string;
  usage: UsageStats;
  contextEstimate: { percent: number | undefined; label: string };
  short: boolean;
  showUsage: boolean;
}) {
  const instance = render(<ExplainResponseView {...options} />);
  await instance.waitUntilExit();
}
