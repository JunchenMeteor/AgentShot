# AgentShot

[English](README.md) | [简体中文](README.zh-CN.md)

Local-first screenshot bridge for Claude Code, Codex CLI, Aider, Gemini CLI, OpenCode, and terminal AI agents.

```text
clipboard screenshot -> local file -> AI-ready prompt -> clipboard or active terminal
```

AgentShot is built for developers who use AI tools from the terminal and need to show screenshots without saving files by hand, renaming them, moving them into a project folder, or uploading them to a public service.

## The Problem

Terminal AI tools can often inspect local image files, but terminals usually cannot pass clipboard images into CLI apps. The normal workflow becomes:

```text
take screenshot -> save or export -> rename -> move -> copy path -> write prompt
```

AgentShot makes the preferred workflow clipboard-first:

```bash
# macOS: Cmd+Shift+Ctrl+4, select a region, then:
agentshot clipboard --ask "Analyze this UI bug" --tool codex
```

For an even smoother flow, keep a watcher running:

```bash
agentshot daemon --ask "Analyze this screenshot" --tool codex
```

Then every new clipboard screenshot is saved and converted into an AI-ready prompt.
After a global npm install, AgentShot also tries to register this watcher as a startup daemon. The safe default is still clipboard-only: it prepares the prompt, then you paste it into the AI terminal yourself.

## What Makes It Different

| Tool | Windows + macOS | Pure local | Terminal-first | Multi-agent | No VS Code dependency |
| --- | --- | --- | --- | --- | --- |
| AgentShot | Yes | Yes | Yes | Yes | Yes |
| Paparazzi | macOS focused | Yes | Claude Code focused | Limited | Yes |
| Snap2Link | Yes | No, creates share links | Yes | Yes | Yes |
| VS Code image paste extensions | Mixed | Yes | VS Code terminal only | Mixed | No |
| Raycast terminal image paste | macOS | Yes | Utility-driven | Generic | Raycast required |

## Platform Coverage

| Capability | Windows | macOS |
| --- | --- | --- |
| Save clipboard screenshot | Yes | Yes |
| Open screenshot tool from CLI | Yes, screen clipping fallback | Yes, `screencapture -i` fallback |
| Clipboard watcher | Yes | Yes |
| Startup daemon | Yes, scheduled task | Yes, LaunchAgent |
| Copy prompt to clipboard | Yes | Yes |
| Best-effort paste | Yes | Yes |
| WSL path conversion | Yes | Not applicable |
| AI session detection | Yes | Yes |
| Global hotkey/menu bar helper | Planned | Planned |
| Remote SSH copy | Planned | Planned |

## Features

- Save screenshots automatically with timestamped names.
- Copy an AI-ready prompt to the clipboard.
- Watch clipboard image changes with `agentshot watch`.
- Install a startup watcher with `agentshot daemon install`.
- Inspect daemon state with `agentshot daemon status`.
- Detect terminal AI processes with `agentshot sessions`.
- Optional best-effort paste into the active terminal.
- macOS clipboard screenshot save and interactive capture fallback.
- Windows clipboard screenshot save and screen clipping fallback.
- WSL path conversion for Windows terminal workflows.
- Prompt templates for `claude`, `codex`, `aider`, `gemini`, `opencode`, and `generic`.
- No upload, telemetry, image host, or cloud account.

## Install

npm is the primary distribution channel:

```bash
npm install -g @jcmeteor/agentshot
```

The global install runs a best-effort daemon setup. If your environment blocks startup registration, installation still succeeds and AgentShot prints a manual command.

Skip automatic daemon setup:

```bash
AGENTSHOT_SKIP_POSTINSTALL=1 npm install -g @jcmeteor/agentshot
```

If global install fails with a permission error, use one of these options:

Windows automated fallback:

```powershell
irm https://raw.githubusercontent.com/JunchenMeteor/AgentShot/main/install.ps1 | iex
```

macOS/Linux automated fallback:

```bash
curl -fsSL https://raw.githubusercontent.com/JunchenMeteor/AgentShot/main/install.sh | bash
```

These scripts check Node.js, switch npm global installs to a user-writable prefix when needed, update PATH, install AgentShot, and register the daemon.

If you prefer to inspect the script before running it:

```powershell
irm https://raw.githubusercontent.com/JunchenMeteor/AgentShot/main/install.ps1 -OutFile install.ps1
notepad .\install.ps1
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

Manual npm prefix setup:

```bash
# Recommended for npm-managed global tools
npm config set prefix ~/.npm-global
```

Then add the npm global bin directory to your shell PATH:

```bash
export PATH="$HOME/.npm-global/bin:$PATH"
```

On Windows, use a user-writable npm prefix:

```powershell
npm config set prefix "$env:USERPROFILE\.npm-global"
```

Then add `%USERPROFILE%\.npm-global` to your user PATH.

As a temporary fallback on macOS/Linux, you can use `sudo`, but a user-writable npm prefix is preferred:

```bash
sudo npm install -g @jcmeteor/agentshot
```

Run without a global install:

```bash
npx @jcmeteor/agentshot
```

Install from GitHub for preview builds:

```bash
npm install -g github:JunchenMeteor/AgentShot
```

Install from source:

```bash
git clone https://github.com/JunchenMeteor/AgentShot.git
cd AgentShot
npm install
npm link
```

## Quick Start

macOS clipboard-first:

```bash
# Cmd+Shift+Ctrl+4, select an area, then:
agentshot clipboard --ask "Analyze this UI bug" --tool codex
```

Windows clipboard-first:

```powershell
# Win+Shift+S, select an area, then:
agentshot clipboard --ask "Analyze this UI bug" --tool claude
```

Clipboard watcher:

```bash
agentshot daemon --ask "Analyze this screenshot" --tool codex
```

Install the watcher as a startup daemon:

```bash
agentshot daemon install --ask "Analyze this screenshot" --tool codex
agentshot daemon status
```

Interactive fallback:

```bash
agentshot --ask "What is wrong with this layout?" --tool codex
```

On macOS this runs `screencapture -i`. On Windows it opens screen clipping if the clipboard does not already contain an image.

## Common Workflows

Use Codex from WSL:

```powershell
agentshot clipboard --tool codex --wsl --ask "Find the visual bug"
```

Reuse the latest screenshot:

```bash
agentshot last --tool aider --ask "Review this screenshot"
```

Use an existing image file:

```bash
agentshot --path ./error.png --tool opencode --ask "Explain this error"
```

Copy and try to paste into the active terminal:

```bash
agentshot clipboard --tool claude --ask "Inspect this page" --paste
```

## Commands

```text
agentshot [capture]        Capture/save a screenshot and copy a prompt.
agentshot clipboard        Save the current clipboard image and copy a prompt.
agentshot watch            Watch for new clipboard screenshots.
agentshot daemon           Long-running clipboard watcher.
agentshot daemon install   Install startup clipboard watcher.
agentshot daemon status    Show daemon install state, config, and log path.
agentshot daemon uninstall Remove startup watcher.
agentshot sessions         List detected AI CLI processes.
agentshot last             Reuse the latest saved screenshot.
agentshot dir              Print the screenshot directory.
agentshot --help           Show help.
```

## Supported AI Tools

AgentShot uses prompt templates instead of provider APIs. That keeps it compatible with any CLI agent that can access local files.

First-class templates:

- Claude Code
- Codex CLI
- Aider
- Gemini CLI
- OpenCode
- Generic terminal agents

## Storage

AgentShot never uploads screenshots. Files are saved under:

```text
macOS/Linux: ~/.agentshot/shots
Windows: %USERPROFILE%\.agentshot\shots
```

If the home directory is not writable, AgentShot falls back to `Pictures/agent-shots`, then the system temp directory. Set `AGENTSHOT_DIR` to force a specific location:

```bash
AGENTSHOT_DIR=/path/to/shots agentshot
```

## Native Terminal Paste Notes

`--paste` copies the prompt first, then asks the OS to press paste in the active app:

- macOS: AppleScript sends `Cmd+V` through System Events.
- Windows: PowerShell sends `Ctrl+V` through Windows Forms.

This should work with native Terminal.app and Windows Terminal when permissions and focus are correct, but it remains best-effort because terminal apps and OS security models differ.

Recommended daily workflow:

```text
1. Install AgentShot globally, or run: agentshot daemon install --ask "Analyze this screenshot" --tool codex
2. Take a clipboard screenshot with the OS shortcut.
3. Return to Claude Code/Codex and paste.
```

This avoids unsafe automatic paste into the wrong window while still removing manual file naming and path copying.

## Daemon

AgentShot's daemon is a resident clipboard watcher. It does not upload screenshots and does not inject text into terminal windows.

```bash
agentshot daemon install --tool codex --ask "Analyze this screenshot"
agentshot daemon status
agentshot daemon uninstall
```

Startup integration:

- macOS: LaunchAgent at `~/Library/LaunchAgents/com.junchenmeteor.agentshot.plist`.
- Windows: user logon scheduled task named `AgentShot`.

Logs and config:

```text
~/.agentshot/daemon.log
~/.agentshot/daemon.json
```

## Session Detection

`agentshot sessions` lists likely terminal AI CLI processes. This is read-only and exists to support future explicit injection workflows without making direct injection the default behavior.

## Quality

Run the full local validation suite:

```bash
npm run validate
```

This checks syntax, unit tests, help output, and npm package contents. CI runs the same validation on Windows, macOS, and Linux across Node 18, 20, and 22.

## Status

AgentShot is currently an MVP. The stable baseline is:

```text
clipboard image -> save file -> render prompt -> copy prompt
```

Automatic paste is best-effort. Clipboard watch is implemented as a CLI watcher; global hotkey and menu bar helpers are planned.

## License

MIT
