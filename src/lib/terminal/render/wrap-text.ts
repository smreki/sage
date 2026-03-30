import { stripVTControlCharacters } from "node:util";

/** Returns the max content width that fits inside a clack `note()` box. */
export function noteContentWidth(): number {
  return (process.stdout.columns || 80) - 6;
}

/** ANSI-aware word wrap. Splits on whitespace, preserving existing newlines. */
export function wrapText(text: string, maxWidth: number): string {
  return text
    .split("\n")
    .map((line) => wrapLine(line, maxWidth))
    .join("\n");
}

function wrapLine(line: string, maxWidth: number): string {
  if (stripVTControlCharacters(line).length <= maxWidth) return line;

  const words = line.split(/( +)/);
  const lines: string[] = [];
  let current = "";
  let currentVisible = 0;

  for (const word of words) {
    const wordVisible = stripVTControlCharacters(word).length;
    if (currentVisible + wordVisible > maxWidth && current.length > 0) {
      lines.push(current.trimEnd());
      current = "";
      currentVisible = 0;
      // Skip standalone whitespace at line start
      if (word.trim().length === 0) continue;
    }
    current += word;
    currentVisible += wordVisible;
  }

  if (current.length > 0) lines.push(current.trimEnd());
  return lines.join("\n");
}
