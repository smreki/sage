import pc from "picocolors";

export function renderCommandResult(result: {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
}) {
  console.log();
  console.log(pc.bold(pc.cyan("Command Result")));
  console.log(`- command: ${result.command}`);
  console.log(`- exit code: ${result.exitCode}`);

  if (result.stdout.trim()) {
    console.log();
    console.log(pc.bold(pc.cyan("stdout")));
    console.log(result.stdout.trim());
  }

  if (result.stderr.trim()) {
    console.log();
    console.log(pc.bold(pc.yellow("stderr")));
    console.log(result.stderr.trim());
  }

  console.log();
}
