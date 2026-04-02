import pc from "picocolors";
import { render } from "markdansi";

import { noteContentWidth } from "@/lib/terminal/render/wrap-text";

const BAR = pc.gray("│");

/**
 * Renders a markdown section matching clack's visual language:
 * a `◇` diamond header followed by markdown-rendered content,
 * each line prefixed with the `│` bar.
 */
export function renderMarkdownSection(markdown: string, title: string): void {
  const rendered = render(markdown, { width: noteContentWidth() });
  const lines = rendered.split("\n");

  // Trim leading/trailing empty lines from the rendered output
  while (lines.length > 0 && lines[0]!.trim() === "") lines.shift();
  while (lines.length > 0 && lines[lines.length - 1]!.trim() === "") lines.pop();

  const body = lines.map((line) => `${BAR}  ${line}`).join("\n");

  process.stdout.write(`${BAR}\n${pc.green("◇")}  ${pc.yellow(pc.bold(title))}\n${body}\n`);
}
