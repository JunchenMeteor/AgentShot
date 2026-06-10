import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  VERSION,
  parseArgs,
  renderPathForPrompt,
  renderPrompt,
  timestampName,
  toWslPath,
  usage,
} from '../bin/agentshot.js'

test('VERSION matches package metadata', () => {
  const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  assert.equal(VERSION, packageJson.version)
})

test('usage includes core commands and supported tools', () => {
  const text = usage()
  assert.match(text, /jcshot \[capture\]/)
  assert.match(text, /clipboard/)
  assert.match(text, /watch/)
  assert.match(text, /daemon/)
  assert.match(text, /claude, codex, aider, gemini, opencode, generic/)
})

test('parseArgs defaults to capture and generic tool', () => {
  const parsed = parseArgs([])
  assert.equal(parsed.command, 'capture')
  assert.equal(parsed.options.tool, 'generic')
})

test('parseArgs supports watch interval', () => {
  const parsed = parseArgs(['watch', '--interval', '1200'])
  assert.equal(parsed.command, 'watch')
  assert.equal(parsed.options.intervalMs, 1200)
})

test('parseArgs supports daemon command', () => {
  const parsed = parseArgs(['daemon', '--tool', 'claude'])
  assert.equal(parsed.command, 'daemon')
  assert.equal(parsed.options.tool, 'claude')
})

test('parseArgs supports daemon lifecycle actions', () => {
  const parsed = parseArgs(['daemon', 'install', '--tool', 'codex', '--ask', 'Analyze this'])
  assert.equal(parsed.command, 'daemon')
  assert.equal(parsed.options.daemonAction, 'install')
  assert.equal(parsed.options.tool, 'codex')
  assert.equal(parsed.options.ask, 'Analyze this')
})

test('parseArgs supports daemon doctor action', () => {
  const parsed = parseArgs(['daemon', 'doctor'])
  assert.equal(parsed.command, 'daemon')
  assert.equal(parsed.options.daemonAction, 'doctor')
})

test('parseArgs supports quiet postinstall mode', () => {
  const parsed = parseArgs(['daemon', 'install', '--quiet'])
  assert.equal(parsed.options.daemonAction, 'install')
  assert.equal(parsed.options.quiet, true)
})

test('parseArgs clamps invalid watch interval', () => {
  const parsed = parseArgs(['watch', '--interval', '100'])
  assert.equal(parsed.options.intervalMs, 1500)
})

test('parseArgs supports command, ask, tool, paste, wsl, and path', () => {
  const parsed = parseArgs([
    'last',
    '--ask',
    'Analyze this',
    '--tool',
    'codex',
    '--paste',
    '--wsl',
    '--path',
    'C:\\shots\\a.png',
  ])

  assert.equal(parsed.command, 'last')
  assert.equal(parsed.options.ask, 'Analyze this')
  assert.equal(parsed.options.tool, 'codex')
  assert.equal(parsed.options.paste, true)
  assert.equal(parsed.options.wsl, true)
  assert.equal(parsed.options.imagePath, 'C:\\shots\\a.png')
})

test('parseArgs falls back unknown tools to generic', () => {
  const parsed = parseArgs(['--tool', 'unknown'])
  assert.equal(parsed.options.tool, 'generic')
})

test('timestampName is deterministic for a supplied date', () => {
  assert.equal(timestampName(new Date(2026, 5, 8, 12, 34, 56)), '20260608-123456')
})

test('toWslPath converts Windows paths', () => {
  assert.equal(
    toWslPath('C:\\Users\\me\\.agentshot\\shots\\shot.png'),
    '/mnt/c/Users/me/.agentshot/shots/shot.png',
  )
})

test('toWslPath normalizes non-drive paths', () => {
  assert.equal(toWslPath('\\\\server\\share\\shot.png'), '//server/share/shot.png')
})

test('renderPrompt uses tool-specific wording and ask text', () => {
  const prompt = renderPrompt('/tmp/shot.png', {
    ask: 'Review the layout',
    tool: 'codex',
    wsl: false,
  })

  assert.match(prompt, /Review the layout/)
  assert.match(prompt, /Analyze this local screenshot:/)
  assert.match(prompt, /shot\.png/)
})

test('renderPrompt puts Claude image path before ask text', () => {
  const prompt = renderPrompt('/tmp/shot.png', {
    ask: 'Review the layout',
    tool: 'claude',
    wsl: false,
  })
  const renderedPath = renderPathForPrompt('/tmp/shot.png', { wsl: false })

  assert.equal(prompt, `${renderedPath}\n\nReview the layout`)
})

test('renderPrompt puts Claude image path before default instruction', () => {
  const prompt = renderPrompt('/tmp/shot.png', {
    ask: '',
    tool: 'claude',
    wsl: false,
  })
  const renderedPath = renderPathForPrompt('/tmp/shot.png', { wsl: false })

  assert.equal(prompt, `${renderedPath}\n\nPlease inspect this image.`)
})

test('renderPrompt supports generic fallback shape', () => {
  const prompt = renderPrompt('/tmp/shot.png', {
    ask: '',
    tool: 'generic',
    wsl: false,
  })

  assert.match(prompt, /Please analyze this local image:/)
})

test('renderPathForPrompt returns normal path when wsl is false', () => {
  const rendered = renderPathForPrompt('README.md', { wsl: false })
  assert.match(rendered, /README\.md$/)
})
