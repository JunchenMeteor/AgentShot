# AgentShot

<p align="center">
  <strong>Local-first screenshot bridge for terminal AI agents</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/jcagentshot"><img alt="npm" src="https://img.shields.io/npm/v/jcagentshot?style=for-the-badge&logo=npm&color=CB3837" /></a>
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img alt="Local First" src="https://img.shields.io/badge/Local--first-No%20upload-1F6FEB?style=for-the-badge" />
  <br />
  <a href="https://github.com/JunchenMeteor/AgentShot/issues"><img alt="Issues" src="https://img.shields.io/badge/Links-Issues-1F6FEB" /></a>
  <a href="https://www.npmjs.com/package/jcagentshot"><img alt="npm downloads" src="https://img.shields.io/npm/dm/jcagentshot?label=npm%20downloads" /></a>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/License-MIT-blue" /></a>
  <br />
  <a href="README.md"><img alt="Docs English" src="https://img.shields.io/badge/Docs-English-black" /></a>
  <a href="README.zh-CN.md"><img alt="Docs 中文" src="https://img.shields.io/badge/Docs-%E4%B8%AD%E6%96%87-red" /></a>
</p>

Local-first screenshot bridge for Claude Code, Codex CLI, Aider, Gemini CLI, OpenCode, and terminal AI agents.

```text
clipboard screenshot -> local file -> AI-ready prompt -> clipboard or active terminal
```

AgentShot is for developers who use AI coding agents from the terminal and need to show screenshots without manually saving, renaming, moving, uploading, or copying image paths.

## Table of Contents

- [Quick Start](#quick-start)
- [Install](#install)
- [Why AgentShot](#why-agentshot)
- [Common Workflows](#common-workflows)
- [Commands](#commands)
- [Supported AI Tools](#supported-ai-tools)
- [Storage and Privacy](#storage-and-privacy)
- [Daemon](#daemon)
- [Platform Coverage](#platform-coverage)
- [Comparison](#comparison)
- [Quality](#quality)
- [Status](#status)

## Quick Start

Install globally:

```bash
npm install -g jcagentshot
```

Use one screenshot from the clipboard:

```bash
# macOS: Cmd+Shift+Ctrl+4, select a region, then:
jcshot clipboard --ask "Analyze this UI bug"
```

Keep a watcher running for repeated screenshots:

```bash
jcshot daemon install --ask "Analyze this screenshot"
jcshot daemon status
```

After that, take a clipboard screenshot and paste the generated prompt into Claude Code, Codex, Aider, Gemini CLI, OpenCode, or another terminal agent.

Example generated prompt:

```text
Analyze this screenshot: /Users/you/.agentshot/shots/shot-20260608-224138.png
```

Naming note: the product is AgentShot, the npm package is `jcagentshot`, the CLI command is `jcshot`, and local data remains under `~/.agentshot`.

## Install

npm is the primary distribution channel:

```bash
npm install -g jcagentshot
```

The global install does not start a background service automatically. Enable background clipboard watching explicitly:

```bash
jcshot daemon install --ask "Analyze this screenshot"
```

Run without a global install:

```bash
npx jcagentshot
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

Skip postinstall guidance:

```bash
AGENTSHOT_SKIP_POSTINSTALL=1 npm install -g jcagentshot
```

If global install fails with a permission error, prefer a user-writable npm prefix:

```bash
npm config set prefix ~/.npm-global
export PATH="$HOME/.npm-global/bin:$PATH"
npm install -g jcagentshot
```

Windows user-writable prefix:

```powershell
npm config set prefix "$env:USERPROFILE\.npm-global"
```

Then add `%USERPROFILE%\.npm-global` to your user PATH.

Automated fallback installers:

```powershell
# Windows
irm https://raw.githubusercontent.com/JunchenMeteor/AgentShot/main/install.ps1 | iex
```

```bash
# macOS/Linux
curl -fsSL https://raw.githubusercontent.com/JunchenMeteor/AgentShot/main/install.sh | bash
```

These scripts check Node.js, switch npm global installs to a user-writable prefix when needed, update PATH, install AgentShot, and then ask you to explicitly enable the daemon.

If you prefer to inspect the Windows script before running it:

```powershell
irm https://raw.githubusercontent.com/JunchenMeteor/AgentShot/main/install.ps1 -OutFile install.ps1
notepad .\install.ps1
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

As a temporary fallback on macOS/Linux, you can use `sudo`, but a user-writable npm prefix is preferred:

```bash
sudo npm install -g jcagentshot
```

## Why AgentShot

Terminal AI tools can often inspect local image files, but terminals usually cannot pass clipboard images directly into CLI apps. The normal workflow becomes:

```text
take screenshot -> save/export -> rename -> move -> copy path -> write prompt
```

AgentShot makes the workflow clipboard-first:

```text
take screenshot to clipboard -> AgentShot saves it -> AgentShot copies an AI-ready prompt
```

Use AgentShot when:

- You use Claude Code, Codex CLI, Aider, Gemini CLI, OpenCode, or similar tools in a terminal.
- You frequently need to show UI bugs, layout issues, logs, dashboards, or app screenshots.
- You want screenshots to stay local instead of being uploaded to an image host.
- You want one workflow that works across multiple terminal agents.

Do not use AgentShot if your AI tool already supports direct image paste in the place where you work.

## Common Workflows

macOS clipboard-first:

```bash
# Cmd+Shift+Ctrl+4, select an area, then:
jcshot clipboard --ask "Analyze this UI bug"
```

Windows clipboard-first:

```powershell
# Win+Shift+S, select an area, then:
jcshot clipboard --ask "Analyze this UI bug"
```

Run a watcher in the current terminal:

```bash
jcshot watch --ask "Analyze this screenshot"
```

Install the watcher as a startup daemon:

```bash
jcshot daemon install --ask "Analyze this screenshot"
jcshot daemon status
```

Use Codex from WSL:

```powershell
jcshot clipboard --tool codex --wsl --ask "Find the visual bug"
```

Reuse the latest screenshot:

```bash
jcshot last --tool aider --ask "Review this screenshot"
```

Use an existing image file:

```bash
jcshot --path ./error.png --tool opencode --ask "Explain this error"
```

Copy and try to paste into the active terminal:

```bash
jcshot clipboard --tool claude --ask "Inspect this page" --paste
```

Interactive fallback:

```bash
jcshot --ask "What is wrong with this layout?"
```

On macOS this runs `screencapture -i`. On Windows it opens screen clipping if the clipboard does not already contain an image.

## Commands

| Command | What it does |
| --- | --- |
| `jcshot [capture]` | Capture/save a screenshot and copy a prompt. |
| `jcshot clipboard` | Save the current clipboard image and copy a prompt. |
| `jcshot watch` | Watch for new clipboard screenshots in the current terminal. |
| `jcshot daemon` | Run the long-running clipboard watcher. |
| `jcshot daemon install` | Install the startup clipboard watcher. |
| `jcshot daemon status` | Show daemon install state, config, and log path. |
| `jcshot daemon uninstall` | Remove the startup watcher. |
| `jcshot sessions` | List detected AI CLI processes. |
| `jcshot last` | Reuse the latest saved screenshot. |
| `jcshot dir` | Print the screenshot directory. |
| `jcshot --help` | Show help. |

Command modes at a glance:

| Mode | Best for |
| --- | --- |
| `clipboard` | One clipboard screenshot at a time. |
| `watch` | Temporary watcher in the current terminal. |
| `daemon` | Long-running watcher process. |
| `daemon install` | Start watcher automatically on login. |
| `last` | Reusing the most recent screenshot. |

## Supported AI Tools

AgentShot uses prompt templates instead of provider APIs. That keeps it compatible with any CLI agent that can access local files.

`--tool` is optional. If you omit it, AgentShot uses the generic prompt template. Add `--tool codex`, `--tool claude`, or another template only when you want wording tailored to a specific agent.

First-class templates:

- Claude Code
- Codex CLI
- Aider
- Gemini CLI
- OpenCode
- Generic terminal agents

## Storage and Privacy

AgentShot never uploads screenshots. It has no telemetry, image host, or cloud account.

Files are saved under:

```text
macOS/Linux: ~/.agentshot/shots
Windows: %USERPROFILE%\.agentshot\shots
```

If the home directory is not writable, AgentShot falls back to `Pictures/agent-shots`, then the system temp directory. Set `AGENTSHOT_DIR` to force a specific location:

```bash
AGENTSHOT_DIR=/path/to/shots jcshot
```

Native terminal paste notes:

- `--paste` copies the prompt first, then asks the OS to press paste in the active app.
- macOS uses AppleScript to send `Cmd+V` through System Events.
- Windows uses PowerShell to send `Ctrl+V` through Windows Forms.
- Paste is best-effort because terminal apps and OS security models differ.

Recommended daily workflow:

```text
1. Install AgentShot globally, or run daemon install.
2. Take a clipboard screenshot with the OS shortcut.
3. Return to Claude Code/Codex and paste.
```

This avoids unsafe automatic paste into the wrong window while still removing manual file naming and path copying.

## Daemon

AgentShot's daemon is a resident clipboard watcher. It does not upload screenshots and does not inject text into terminal windows by default.

```bash
jcshot daemon install --ask "Analyze this screenshot"
jcshot daemon status
jcshot daemon doctor
jcshot daemon uninstall
```

`daemon install` is explicit. npm install does not register or start background services. Before installation, AgentShot prints the daemon scope: it watches clipboard image changes only, does not read text clipboard content, does not upload files, and does not inject text into terminal windows.

Startup integration:

- macOS: LaunchAgent at `~/Library/LaunchAgents/com.junchenmeteor.agentshot.plist`.
- Windows: user logon scheduled task named `AgentShot`. The watcher uses one hidden clipboard helper process instead of repeatedly spawning PowerShell for each poll.

Logs and config:

```text
~/.agentshot/daemon.log
~/.agentshot/daemon.json
```

`jcshot daemon doctor` prints the installed task/agent state, config path, log path, screenshot directory, and safety-scope checks.

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

## Comparison

This is a high-level positioning table, not an exhaustive benchmark.

| Tool | Windows + macOS | Pure local | Terminal-first | Multi-agent | No VS Code dependency |
| --- | --- | --- | --- | --- | --- |
| AgentShot | Yes | Yes | Yes | Yes | Yes |
| Paparazzi | macOS focused | Yes | Claude Code focused | Limited | Yes |
| Snap2Link | Yes | No, creates share links | Yes | Yes | Yes |
| VS Code image paste extensions | Mixed | Yes | VS Code terminal only | Mixed | No |
| Raycast terminal image paste | macOS | Yes | Utility-driven | Generic | Raycast required |

## Session Detection

`jcshot sessions` lists likely terminal AI CLI processes. This is read-only and exists to support future explicit injection workflows without making direct injection the default behavior.

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
