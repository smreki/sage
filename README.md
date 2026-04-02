# @jam/sage

`sage` is a Bun-based CLI that explains terminal commands with an AI provider and lets you optionally run the suggested command after confirmation.

It is currently focused on one core workflow:

- ask what a command does
- get a short explanation by default
- inspect a suggested command
- optionally run that command from the same flow

## Features

- built with Bun and TypeScript
- multi-provider support via `@mariozechner/pi-ai` (GitHub Copilot, OpenAI, Anthropic, Google Gemini, Google Antigravity)
- OAuth authentication with automatic token refresh
- prompt-driven CLI with `commander` and `@clack/prompts`
- response rendering with `@clack/prompts` and `picocolors`
- safe suggested-command execution with local blocking rules
- short mode by default, with optional detailed output and usage stats
- follow-up and new-session flows without restarting

## Requirements

- Bun
- Node-compatible environment for the installed dependencies
- An API key or OAuth credentials for at least one supported provider

Supported providers: `github-copilot`, `openai-codex`, `anthropic`, `google-gemini-cli`, `google-antigravity`

Authentication is resolved in order: environment variable, stored OAuth credentials, interactive OAuth login.

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

| Command                                                                | Description                                                             |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `sage explain`                                                         | Start an interactive explain flow                                       |
| `sage explain "what is whoami"`                                        | Explain a command directly                                              |
| `sage explain "what does ls -la do" --model gpt-5.4-mini --effort low` | Choose a model and effort                                               |
| `sage explain "what is whoami" --detailed`                             | Show the full response instead of the short default                     |
| `sage explain "what is whoami" --show-usage`                           | Show usage details                                                      |
| `sage explain "what is whoami" --bypass-permissions`                   | Skip the local confirmation prompt before running the suggested command |

## Command Reference

### `sage explain [question...]`

Explains a terminal command or shell concept.

Options:

- `-p, --provider <provider>` - AI provider (e.g. `github-copilot`, `openai-codex`, `anthropic`)
- `-m, --model <model>` - model to use (e.g. `gpt-5.4-mini`, `claude-sonnet-4`)
- `-e, --effort <effort>` - reasoning effort (`low`, `medium`, `high`, `xhigh`)
- `--detailed` - show the full response with all sections
- `--show-usage` - show token usage and cost
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
    "defaultProvider": "openai-codex",
    "confirmBeforeRun": true,
    "providers": {
      "openai-codex": {
        "defaultModel": "gpt-5.4-mini",
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

## License

[MIT](./LICENSE)
