import pc from "picocolors";

const BAR = pc.gray("│");
const DIAMOND = pc.green("◇");

/**
 * Consumes an async iterable of text chunks and writes each line
 * prefixed with the clack `│` bar. The first non-empty line gets a
 * `◇` diamond prefix instead, matching clack's section header style.
 * Handles partial lines by buffering until the next chunk completes them.
 */
export async function streamWithBar(chunks: AsyncIterable<string>): Promise<void> {
  let buffer = "";
  let isFirstLine = true;

  for await (const chunk of chunks) {
    buffer += chunk;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (isFirstLine && line.trim().length > 0) {
        process.stdout.write(`${DIAMOND}  ${line}\n`);
        isFirstLine = false;
      } else {
        process.stdout.write(`${BAR}  ${line}\n`);
      }
    }
  }

  if (buffer.length > 0) {
    if (isFirstLine) {
      process.stdout.write(`${DIAMOND}  ${buffer}\n`);
    } else {
      process.stdout.write(`${BAR}  ${buffer}\n`);
    }
  }
}
