# AgentShot Product Spec

## Product Goal

AgentShot is a local-first screenshot bridge for terminal AI agents. It reduces screenshot-to-AI friction from a manual multi-step workflow to a background clipboard loop: screenshot, return to the AI terminal, paste.

## Target Users

- Developers who run Claude Code, Codex CLI, Aider, Gemini CLI, OpenCode, or similar agents in a terminal.
- Windows/macOS users who frequently ask AI tools to inspect screenshots.
- Users who do not want screenshots uploaded to a third-party image host.

## Core Loop

```text
user copies screenshot to clipboard -> agentshot saves image -> AI prompt is rendered -> prompt is copied or pasted -> AI reads local image path
```

## Product Direction

AgentShot should optimize for safe automation before direct window injection.

Phase 1: robust clipboard bridge

- Save clipboard screenshots on Windows and macOS.
- Render AI-tool-specific prompts.
- Copy prompts to the clipboard.
- Keep all screenshots local.
- Provide tests, validation, CI, and npm packaging.

Phase 2: resident daemon by default

- `agentshot daemon run` is the long-running clipboard watcher.
- `agentshot daemon install` registers a startup service.
- `agentshot daemon status` reports installed state, config, and log path.
- `agentshot daemon uninstall` removes the startup service.
- npm `postinstall` should only print setup guidance. It must not start background processes or register startup services.
- Postinstall guidance must be skippable with `AGENTSHOT_SKIP_POSTINSTALL=1` and must not fail package installation.

Phase 3: session detection for future evolution

- `agentshot sessions` lists detected terminal AI CLI processes.
- Detection is read-only and should not inject text.
- Supported process families should include Claude Code, Codex CLI, Aider, Gemini CLI, and OpenCode.
- Session data can later support explicit user-selected injection, but injection is not a default behavior.

## MVP Scope

- macOS clipboard image save from PNG/TIFF pasteboard data.
- macOS interactive region capture with `screencapture` as fallback.
- Windows clipboard-image save and optional screen clipping launch.
- Clipboard watcher with `agentshot watch`.
- Long-running daemon command with `agentshot daemon`.
- Startup daemon management with `agentshot daemon install/status/uninstall`.
- npm postinstall guidance without automatic daemon registration.
- Read-only session detection with `agentshot sessions`.
- Local file storage with timestamped names.
- Prompt templates for multiple AI tools.
- Clipboard copy by default.
- Optional best-effort paste.
- Windows WSL path conversion.
- npm package layout and GitHub-ready README.

## Non-Goals

- No cloud upload.
- No AI API call.
- No OCR.
- No VS Code extension dependency.
- No GUI/tray app in v0.1.
- No terminal-private protocol integration in v0.1.
- No default direct injection into AI terminal windows.

## Architecture

```text
CLI parser
  -> platform screenshot provider
  -> shot store
  -> path translator
  -> prompt renderer
  -> clipboard/paste integration
```

## Platform Strategy

macOS:

- Clipboard-first flow reads PNG/TIFF data from `NSPasteboard` through JavaScript for Automation.
- `screencapture -i <file>` captures a user-selected region.
- `pbcopy` copies prompt text.
- `osascript` is used for optional paste.

Windows:

- PowerShell reads `[Windows.Forms.Clipboard]::GetImage()`.
- If the clipboard has no image during `capture`, AgentShot launches `ms-screenclip:` and polls the clipboard.
- `Set-Clipboard` copies prompt text.
- `System.Windows.Forms.SendKeys` is used for optional paste.
- `schtasks` registers the daemon at user logon.

Daemon:

- The installed daemon runs `agentshot daemon run`.
- Logs are written under `~/.agentshot/daemon.log`.
- Runtime config is written to `~/.agentshot/daemon.json`.
- macOS uses a LaunchAgent under `~/Library/LaunchAgents`.
- Windows uses a user logon scheduled task named `AgentShot`.

## AI Tool Adapter Strategy

Adapters are prompt templates. This avoids provider lock-in and keeps AgentShot compatible with any CLI that can access local paths.

Initial adapters:

- `claude`
- `codex`
- `aider`
- `gemini`
- `opencode`
- `generic`

## GitHub Search Positioning

README and topics should include:

- screenshot to Claude Code
- screenshot to Codex CLI
- terminal AI image input
- local image paste for AI agents
- Windows macOS screenshot CLI
- no cloud screenshot tool
- AI coding agent screenshot

## Acceptance Criteria

- `agentshot --help` prints usage.
- `agentshot dir` prints the local screenshot directory.
- `agentshot last --ask "..." --tool codex` works after at least one saved screenshot exists.
- `agentshot clipboard` saves a clipboard PNG on macOS and Windows.
- `agentshot watch` detects new clipboard images and generates prompts.
- `agentshot daemon` provides a memorable long-running watcher entrypoint.
- `agentshot daemon install` installs a startup watcher on Windows/macOS.
- `agentshot daemon status` reports config and log location.
- `agentshot daemon uninstall` removes startup integration.
- `agentshot sessions` prints detected AI CLI process candidates or an empty message.
- macOS capture saves a PNG file under `~/.agentshot/shots`.
- Windows clipboard capture saves a PNG file under `%USERPROFILE%\.agentshot\shots`.
- Prompt is copied to clipboard after a successful capture.

## Native Terminal Paste Feasibility

Initial support is implemented as best-effort OS paste:

- macOS uses AppleScript/System Events to send `Cmd+V`.
- Windows uses Windows Forms `SendKeys` to send `Ctrl+V`.

This can work with Terminal.app and Windows Terminal when the terminal has focus and macOS Accessibility permission is granted. It is not treated as a hard guarantee because focus, secure input, terminal settings, and OS permission prompts can block synthetic paste.

## Release Plan

v0.1:

- Node CLI published to npm.
- GitHub source install documented.
- Local-first clipboard/capture and prompt copy.
- Clipboard watcher.
- Installed daemon for daily long-running use.
- Read-only session detection.

v0.2:

- Rust single-binary rewrite or native helper for better global hotkey support.
- More robust terminal detection.
- Optional explicit injection experiments behind opt-in flags.

v0.3:

- SSH/remote workspace mode: save locally, optionally copy/scp to remote target, render remote path.

v1.0:

- Stable cross-platform CLI, documented adapters, tested install paths.
