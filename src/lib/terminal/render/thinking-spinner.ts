import pc from "picocolors";

const FRAMES = ["◒", "◐", "◓", "◑"];
const FRAME_MS = 80;

/**
 * Creates a spinner that animates on the current line.
 * When stopped, the spinner line is erased entirely so the next
 * output can take its place seamlessly.
 */
export function createThinkingSpinner() {
  let frame = 0;
  let interval: ReturnType<typeof setInterval> | undefined;

  return {
    start(message: string) {
      process.stdout.write(pc.gray("│") + "\n");
      process.stdout.write("\x1b[?25l");
      interval = setInterval(() => {
        process.stdout.write(
          `\x1b[999D\x1b[J${pc.magenta(FRAMES[frame % FRAMES.length]!)}  ${message}`
        );
        frame++;
      }, FRAME_MS);
    },

    stop() {
      if (interval) {
        clearInterval(interval);
        interval = undefined;
      }
      process.stdout.write("\x1b[999D\x1b[J");
      process.stdout.write("\x1b[?25h");
    }
  };
}
