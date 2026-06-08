# AgentShot Agent Guide

This file is for AI coding agents working on AgentShot.

## Project Summary

AgentShot is a local-first screenshot bridge for terminal AI agents. It helps users capture or copy a screenshot, save it as a local image file, render an AI-tool-specific prompt that references the image path, and copy that prompt to the clipboard.

The primary user workflow is:

```text
install AgentShot -> daemon watches clipboard -> user takes screenshot -> AgentShot saves image and copies prompt -> user pastes into Claude Code, Codex CLI, or another terminal AI tool
```

AgentShot should not upload screenshots, call AI APIs, or inject text into terminal windows by default.

## Product Direction

Primary distribution is npm:

```bash
npm install -g jcagentshot
```

The package uses `postinstall` only to print daemon setup guidance. It must not start background processes or register startup services during package installation.

Current product phases:

1. Robust local screenshot bridge.
2. Resident startup daemon by default.
3. Read-only AI session detection for future explicit injection workflows.

Direct terminal injection is not a default behavior. Keep the safe default as "copy prompt to clipboard, user pastes manually".

## Tech Stack

- Runtime: Node.js 18+
- Module system: ESM
- CLI entrypoint: `bin/agentshot.js`
- Tests: Node built-in test runner
- Package manager: npm
- Platforms: Windows and macOS first, limited Linux clipboard fallback
- No runtime npm dependencies currently

## Important Files

- `bin/agentshot.js`: main CLI implementation.
- `scripts/postinstall.mjs`: npm postinstall guidance. It must not start the daemon.
- `scripts/validate.mjs`: local validation runner.
- `tests/agentshot.test.js`: unit tests.
- `README.md`: English user-facing README.
- `README.zh-CN.md`: Chinese user-facing README.
- `docs/PRODUCT_SPEC.md`: product scope, platform strategy, and roadmap.
- `docs/NPM_RELEASE.md`: npm publishing checklist.
- `docs/QUALITY.md`: quality and validation baseline.

## Commands

Run full validation:

```bash
npm run validate
```

Run tests:

```bash
npm test
```

Syntax check:

```bash
npm run check
```

Smoke test:

```bash
npm run smoke
```

Package dry run:

```bash
npm pack --dry-run
```

Manual CLI examples:

```bash
node bin/agentshot.js --help
node bin/agentshot.js daemon status
node bin/agentshot.js sessions
```

## CLI Commands

Supported commands:

- `jcshot [capture]`
- `jcshot clipboard`
- `jcshot watch`
- `jcshot daemon`
- `jcshot daemon run`
- `jcshot daemon install`
- `jcshot daemon status`
- `jcshot daemon uninstall`
- `jcshot sessions`
- `jcshot last`
- `jcshot dir`

Supported tool templates:

- `claude`
- `codex`
- `aider`
- `gemini`
- `opencode`
- `generic`

## Daemon Behavior

The daemon is a clipboard watcher.

- macOS startup integration uses `~/Library/LaunchAgents/com.junchenmeteor.agentshot.plist`.
- Windows startup integration uses a user logon scheduled task named `AgentShot`.
- Logs are written to `~/.agentshot/daemon.log`.
- Config is written to `~/.agentshot/daemon.json`.
- `AGENTSHOT_SKIP_POSTINSTALL=1` skips postinstall guidance during npm install.

Daemon registration must be explicit through `jcshot daemon install`. Do not start background processes during npm installation.

## Storage

Screenshots are local only.

Default candidate directories:

1. `AGENTSHOT_DIR` if set.
2. `~/.agentshot/shots`.
3. `~/Pictures/agent-shots`.
4. System temp directory.

Do not add cloud upload, telemetry, remote image hosting, or third-party accounts without explicit product approval.

## Coding Rules

- Keep source code comments and internal code text in English.
- Keep README content bilingual: update both `README.md` and `README.zh-CN.md` for user-facing behavior changes.
- Prefer zero runtime dependencies unless a dependency clearly reduces platform risk.
- Keep OS integration conservative and failure-tolerant.
- Avoid direct terminal injection as a default behavior.
- Do not add a GUI, tray app, or global hotkey without updating product docs first.
- Preserve existing CLI compatibility where practical. For example, `jcshot daemon` should remain a foreground watcher alias.
- Use structured APIs for OS integration where practical. Avoid brittle string parsing when an OS command can return JSON.
- Do not upload screenshots or send image data to AI providers.

## Testing Rules

When changing CLI parsing, prompt rendering, path conversion, daemon lifecycle parsing, or session detection helpers, add or update unit tests.

Before considering work complete, run:

```bash
npm run validate
```

Real screenshot capture and OS startup registration require manual acceptance testing on Windows and macOS. Do not pretend these are covered by unit tests.

## Documentation Rules

Update docs when behavior changes:

- User-facing install or workflow changes: update both READMEs.
- Product scope or roadmap changes: update `docs/PRODUCT_SPEC.md`.
- Publishing changes: update `docs/NPM_RELEASE.md`.
- Quality process changes: update `docs/QUALITY.md`.

## Release Rules

Primary package name:

```text
jcagentshot
```

First public publish:

```bash
npm login
npm run validate
npm publish --access public
```

Version bumps:

- Patch: bug fixes.
- Minor: new features.
- Major: breaking changes.

Always run validation before publish.

## Known Constraints

- The project currently has no runtime dependencies.
- The current implementation is optimized for Windows and macOS.
- `--paste` is best-effort and depends on focus and OS permissions.
- `sessions` is read-only and should remain non-invasive.
- Global daemon install behavior can vary by OS permissions and npm environment.
