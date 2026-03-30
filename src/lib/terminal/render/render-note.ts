import { stripVTControlCharacters } from "node:util";
import pc from "picocolors";

import { noteContentWidth, wrapText } from "@/lib/terminal/render/wrap-text";

const BAR = pc.gray("│");

/**
 * Renders a bordered note box matching clack's visual language,
 * but without dimming the content text.
 */
export function note(content: string, title: string): void {
  const maxWidth = noteContentWidth();
  const wrapped = `\n${wrapText(content, maxWidth)}\n`;
  const lines = wrapped.split("\n");

  const titleLen = stripVTControlCharacters(title).length;
  const boxWidth =
    Math.max(
      lines.reduce((max, line) => {
        const len = stripVTControlCharacters(line).length;
        return len > max ? len : max;
      }, 0),
      titleLen,
    ) + 2;

  const titleBar = pc.gray("─".repeat(Math.max(boxWidth - titleLen - 1, 1)));
  const padded = lines
    .map((line) => {
      const pad = " ".repeat(boxWidth - stripVTControlCharacters(line).length);
      return `${BAR}  ${line}${pad}${BAR}`;
    })
    .join("\n");

  process.stdout.write(
    `${BAR}\n${pc.green("◇")}  ${pc.reset(title)} ${pc.gray(titleBar + "╮")}\n${padded}\n${pc.gray("├" + "─".repeat(boxWidth + 2) + "╯")}\n`,
  );
}
