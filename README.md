# @jam/sage

`sage` is a Bun-based CLI that explains terminal commands with an AI provider and lets you optionally run the suggested command after confirmation.

It is currently focused on one core workflow:

- ask what a command does
- get a short explanation by default
- inspect a suggested command
- optionally run that command from the same flow

## Features

- built with Bun and TypeScript
- provider abstraction for future AI backends
- current provider: GitHub Copilot
- prompt-driven CLI with `commander` and `@clack/prompts`
- response rendering with `@clack/prompts` and `picocolors`
- safe suggested-command execution with local blocking rules
- short mode by default, with optional full output and usage details

## Requirements

- Bun
- Node-compatible environment for the installed dependencies
- GitHub Copilot CLI installed and authenticated

Example:

```bash
copilot auth login
```

## Installation

Install dependencies:

```bash
bun install
```

Run in development:

```bash
bun run dev -- explain
```

Build:

```bash
bun run build
```

## Usage

Start an interactive explain flow:

```bash
sage explain
```

Explain a command directly:

```bash
sage explain "what is whoami"
```

Choose a model and effort:

```bash
sage explain "what does ls -la do" --model raptor-mini --effort low
```

Show the full response instead of the short default:

```bash
sage explain "what is whoami" --no-short
```

Show usage details:

```bash
sage explain "what is whoami" --show-usage
```

Skip the local confirmation prompt before running the suggested command:

```bash
sage explain "what is whoami" --bypass-permissions
```

## Command Reference

### `sage explain [question...]`

Explains a terminal command or shell concept.

Options:

- `-p, --provider <provider>` - AI provider to use
- `-m, --model <model>` - model to use
- `-e, --effort <effort>` - reasoning effort
- `--no-short` - show the full response
- `--show-usage` - show model and token usage
- `--bypass-permissions` - skip confirmation before running the suggested command

Default behavior:

- short mode is enabled
- usage is hidden
- command execution still follows the app's local safety checks

### `sage config`

Prints the current local config.

## Config

Sage stores local config with `conf`.

Current config shape:

```json
{
  "ai": {
    "defaultProvider": "copilot",
    "confirmBeforeRun": true,
    "providers": {
      "copilot": {
        "defaultModel": "raptor-mini",
        "availableModels": ["raptor-mini", "gpt-5-mini", "claude-haiku-4.5"],
        "defaultEffort": "low"
      }
    }
  }
}
```

On Linux, the config currently resolves to:

```text
~/.config/jam-sage/config.json
```

## Safety Notes

- Sage may suggest a command to run, but it does not execute it automatically
- destructive or suspicious commands are blocked by local checks
- `--bypass-permissions` skips the extra confirmation prompt, but does not bypass the local safety rules

## Development

Useful commands:

```bash
bun run check
bun run build
bun run dev -- explain
```

## Project Status

This project is under active iteration. The provider abstraction is in place, but only the Copilot provider is implemented today.

## License

[MIT](./LICENSE)
