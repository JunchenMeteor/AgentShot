# Quality Baseline

AgentShot is a small CLI, but it should still keep a real engineering baseline.

## Local Validation

Run before every commit:

```bash
npm run validate
```

This executes:

- syntax check: `node --check bin/agentshot.js`
- unit tests: `node --test`
- help smoke test: `node bin/agentshot.js --help`
- npm package dry run: `npm pack --dry-run`

## Test Scope

The v0.1 test suite covers:

- argument parsing
- timestamp naming
- WSL path conversion
- prompt rendering
- help output
- path rendering

Real screenshot capture is intentionally not unit-tested because it requires OS permissions and user interaction. It should be covered with manual acceptance checks on macOS and Windows.

## Manual Acceptance Checks

macOS:

```bash
# Cmd+Shift+Ctrl+4, select an area, then:
jcshot clipboard --ask "Analyze this screenshot" --tool codex
```

Expected:

- clipboard image is saved
- prompt is copied to clipboard

Windows:

```powershell
# Win+Shift+S, select an area, then:
jcshot clipboard --ask "Analyze this screenshot" --tool claude
```

Expected:

- clipboard image is saved
- prompt is copied to clipboard

Windows screen clipping fallback:

```powershell
jcshot --ask "Analyze this screenshot" --tool codex
```

Expected:

- screen clipping opens if clipboard has no image
- selected image is saved after clipping completes

Watcher:

```bash
jcshot daemon --ask "Analyze this screenshot" --tool codex
```

Expected:

- new clipboard images are detected
- image is saved
- prompt is copied after each new image

## CI

GitHub Actions runs validation on:

- Ubuntu latest
- macOS latest
- Windows latest
- Node 18, 20, 22
