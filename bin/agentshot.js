#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { homedir, platform, tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const VERSION = '0.1.0'
export const SUPPORTED_TOOLS = new Set(['claude', 'codex', 'aider', 'gemini', 'opencode', 'generic'])

export function usage() {
  return `AgentShot ${VERSION}

Local-first screenshot bridge for terminal AI agents.

Usage:
  agentshot [capture] [--ask "question"] [--tool codex] [--paste] [--wsl]
  agentshot clipboard [--ask "question"] [--tool claude]
  agentshot watch [--ask "question"] [--tool codex] [--paste] [--interval 800]
  agentshot daemon [--ask "question"] [--tool codex] [--interval 800]
  agentshot daemon install [--ask "question"] [--tool codex]
  agentshot daemon status
  agentshot daemon uninstall
  agentshot sessions
  agentshot last [--ask "question"] [--tool aider]
  agentshot dir
  agentshot --help

Commands:
  capture      Capture a screenshot. Default command.
  clipboard    Save an image from the clipboard.
  watch        Watch for new clipboard screenshots.
  daemon       Alias for watch, intended for long-running background sessions.
               Use daemon install/status/uninstall to manage startup service.
  sessions     List detected terminal AI CLI processes.
  last         Reuse the latest saved screenshot.
  dir          Print the screenshot directory.

Options:
  --ask TEXT   Add a question or instruction to the rendered prompt.
  --tool NAME  claude, codex, aider, gemini, opencode, generic. Default: generic.
  --paste      Best-effort paste into the active window after copying.
  --wsl        On Windows, render /mnt/c/... path for WSL terminals.
  --path PATH  Reuse a specific image path instead of capturing.
  --interval   Watch polling interval in milliseconds. Default: 800.
`
}

export function parseArgs(argv) {
  const args = [...argv]
  let command = 'capture'
  const options = {
    ask: '',
    tool: process.env.AGENTSHOT_TOOL || 'generic',
    paste: false,
    wsl: false,
    imagePath: '',
    intervalMs: 800,
    daemonAction: '',
    quiet: false,
  }

  if (args[0] && !args[0].startsWith('-')) {
    command = args.shift()
  }
  if (command === 'daemon' && args[0] && !args[0].startsWith('-')) {
    options.daemonAction = args.shift()
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--help' || arg === '-h') {
      command = 'help'
    } else if (arg === '--version' || arg === '-v') {
      command = 'version'
    } else if (arg === '--ask') {
      options.ask = args[++index] ?? ''
    } else if (arg.startsWith('--ask=')) {
      options.ask = arg.slice('--ask='.length)
    } else if (arg === '--tool') {
      options.tool = args[++index] ?? options.tool
    } else if (arg.startsWith('--tool=')) {
      options.tool = arg.slice('--tool='.length)
    } else if (arg === '--paste') {
      options.paste = true
    } else if (arg === '--wsl') {
      options.wsl = true
    } else if (arg === '--path') {
      options.imagePath = args[++index] ?? ''
    } else if (arg.startsWith('--path=')) {
      options.imagePath = arg.slice('--path='.length)
    } else if (arg === '--interval') {
      options.intervalMs = Number(args[++index] ?? options.intervalMs)
    } else if (arg.startsWith('--interval=')) {
      options.intervalMs = Number(arg.slice('--interval='.length))
    } else if (arg === '--quiet') {
      options.quiet = true
    } else if (!options.ask) {
      options.ask = arg
    }
  }

  options.tool = options.tool.toLowerCase()
  if (!SUPPORTED_TOOLS.has(options.tool)) options.tool = 'generic'
  if (!Number.isFinite(options.intervalMs) || options.intervalMs < 250) options.intervalMs = 800
  return { command, options }
}

export function shotDirCandidates() {
  const configured = process.env.AGENTSHOT_DIR?.trim()
  return [
    configured,
    join(homedir(), '.agentshot', 'shots'),
    join(homedir(), 'Pictures', 'agent-shots'),
    join(tmpdir(), 'agentshot', 'shots'),
  ].filter(Boolean)
}

export function configDir() {
  return configDirCandidates()[0]
}

export function configDirCandidates() {
  const configured = process.env.AGENTSHOT_HOME?.trim()
  return [
    configured,
    join(homedir(), '.agentshot'),
    join(tmpdir(), 'agentshot'),
  ].filter(Boolean)
}

export function daemonLogPath() {
  return join(ensureConfigDir(), 'daemon.log')
}

export function daemonConfigPath() {
  return join(ensureConfigDir(), 'daemon.json')
}

function ensureConfigDir() {
  const errors = []
  for (const dir of configDirCandidates()) {
    try {
      mkdirSync(dir, { recursive: true })
      return dir
    } catch (error) {
      errors.push(`${dir}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  throw new Error(`Unable to create AgentShot config directory. Tried: ${errors.join('; ')}`)
}

function currentScriptPath() {
  return fileURLToPath(import.meta.url)
}

export function shotDir() {
  return shotDirCandidates()[0]
}

export function ensureShotDir() {
  const errors = []
  for (const dir of shotDirCandidates()) {
    try {
      mkdirSync(dir, { recursive: true })
      return dir
    } catch (error) {
      errors.push(`${dir}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  throw new Error(`Unable to create screenshot directory. Tried: ${errors.join('; ')}`)
}

export function timestampName(date = new Date()) {
  const now = date
  const pad = (value) => String(value).padStart(2, '0')
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    '-',
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join('')
}

export function newShotPath() {
  return join(ensureShotDir(), `shot-${timestampName()}.png`)
}

export function latestShotPath() {
  const dir = ensureShotDir()
  const files = readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(png|jpg|jpeg|webp)$/i.test(entry.name))
    .map((entry) => join(dir, entry.name))
    .sort()
  return files.at(-1) ?? null
}

function run(command, args, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { stdio: options.stdio ?? 'inherit', shell: false })
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolvePromise()
      else reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`))
    })
  })
}

function runCaptureCommand(command, args) {
  return run(command, args, { stdio: 'inherit' })
}

function powershell(args, stdio = 'inherit') {
  const executable = process.env.PWSH || 'powershell.exe'
  return run(executable, ['-NoProfile', '-ExecutionPolicy', 'Bypass', ...args], { stdio })
}

async function captureMacOS(file) {
  await runCaptureCommand('screencapture', ['-i', file])
  if (!existsSync(file)) {
    throw new Error('No screenshot was saved. Capture may have been cancelled.')
  }
  return file
}

async function saveWindowsClipboardImage(file) {
  const script = `
Add-Type -AssemblyName System.Windows.Forms,System.Drawing
$img = [Windows.Forms.Clipboard]::GetImage()
if ($null -eq $img) { exit 3 }
$img.Save('${escapePowerShellSingleQuoted(file)}', [Drawing.Imaging.ImageFormat]::Png)
`
  await powershell(['-Command', script], 'ignore')
  if (!existsSync(file)) throw new Error('Clipboard does not contain an image.')
  return file
}

async function captureWindows(file) {
  try {
    return await saveWindowsClipboardImage(file)
  } catch {
    console.error('No clipboard image found. Opening Windows screen clipping. Select an area, then wait...')
    await powershell(['-Command', 'Start-Process "ms-screenclip:"'], 'ignore').catch(() => undefined)
    const startedAt = Date.now()
    while (Date.now() - startedAt < 30000) {
      await delay(700)
      try {
        return await saveWindowsClipboardImage(file)
      } catch {
        // Keep polling while the user is selecting a region.
      }
    }
    throw new Error('Timed out waiting for a clipboard image. Try Win+Shift+S, then run `agentshot clipboard`.')
  }
}

async function captureScreenshot() {
  const file = newShotPath()
  const currentPlatform = platform()
  if (currentPlatform === 'darwin') return captureMacOS(file)
  if (currentPlatform === 'win32') return captureWindows(file)
  throw new Error('Capture is currently supported on macOS and Windows.')
}

async function saveClipboardScreenshot() {
  const file = newShotPath()
  const currentPlatform = platform()
  if (currentPlatform === 'win32') return saveWindowsClipboardImage(file)
  if (currentPlatform === 'darwin') {
    return saveMacOSClipboardImage(file)
  }
  throw new Error('Clipboard image save is currently supported on Windows.')
}

async function getClipboardState() {
  const currentPlatform = platform()
  if (currentPlatform === 'darwin') return getMacOSClipboardState()
  if (currentPlatform === 'win32') return getWindowsClipboardState()
  throw new Error('Clipboard watch is currently supported on macOS and Windows.')
}

async function getMacOSClipboardState() {
  const script = `
ObjC.import('AppKit')
const pasteboard = $.NSPasteboard.generalPasteboard
const changeCount = Number(pasteboard.changeCount)
const hasImage = Boolean(pasteboard.dataForType('public.png') || pasteboard.dataForType('public.tiff'))
JSON.stringify({ changeCount, hasImage })
`
  const output = await captureOutput('osascript', ['-l', 'JavaScript', '-e', script])
  return JSON.parse(output)
}

async function getWindowsClipboardState() {
  const script = `
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class ClipboardNative {
  [DllImport("user32.dll")]
  public static extern uint GetClipboardSequenceNumber();
}
'@
Add-Type -AssemblyName System.Windows.Forms
$sequence = [ClipboardNative]::GetClipboardSequenceNumber()
$hasImage = [System.Windows.Forms.Clipboard]::ContainsImage()
@{ changeCount = [int64]$sequence; hasImage = [bool]$hasImage } | ConvertTo-Json -Compress
`
  const output = await captureOutput('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script])
  return JSON.parse(output)
}

async function saveMacOSClipboardImage(file) {
  const script = `
ObjC.import('AppKit')
ObjC.import('Foundation')

const pasteboard = $.NSPasteboard.generalPasteboard
const pngType = 'public.png'
const tiffType = 'public.tiff'
let data = pasteboard.dataForType(pngType)

if (!data) {
  const tiffData = pasteboard.dataForType(tiffType)
  if (tiffData) {
    const image = $.NSImage.alloc.initWithData(tiffData)
    if (image) {
      const imageRep = $.NSBitmapImageRep.imageRepWithData(image.TIFFRepresentation)
      if (imageRep) {
        data = imageRep.representationUsingTypeProperties($.NSBitmapImageFileTypePNG, $())
      }
    }
  }
}

if (!data) {
  throw new Error('Clipboard does not contain an image.')
}

const output = $.NSString.alloc.initWithUTF8String('${escapeJavaScriptSingleQuoted(file)}')
const ok = data.writeToFileAtomically(output, true)
if (!ok) {
  throw new Error('Failed to write clipboard image.')
}
`
  await run('osascript', ['-l', 'JavaScript', '-e', script], { stdio: 'ignore' })
  if (!existsSync(file)) throw new Error('Clipboard does not contain an image.')
  return file
}

function escapePowerShellSingleQuoted(value) {
  return value.replace(/'/g, "''")
}

function escapeJavaScriptSingleQuoted(value) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function delay(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms))
}

function captureOutput(command, args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { shell: false, stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', chunk => {
      stdout += chunk.toString()
    })
    child.stderr.on('data', chunk => {
      stderr += chunk.toString()
    })
    child.on('error', reject)
    child.on('exit', code => {
      if (code === 0) resolvePromise(stdout.trim())
      else reject(new Error(stderr.trim() || `${command} exited with code ${code}`))
    })
  })
}

export function renderPathForPrompt(file, options) {
  const absolute = resolve(file)
  if (options.wsl && platform() === 'win32') return toWslPath(absolute)
  return absolute
}

export function toWslPath(file) {
  const match = /^([A-Za-z]):\\(.*)$/.exec(file)
  if (!match) return file.replaceAll('\\', '/')
  return `/mnt/${match[1].toLowerCase()}/${match[2].replaceAll('\\', '/')}`
}

export function renderPrompt(file, options) {
  const pathForPrompt = renderPathForPrompt(file, options)
  const ask = options.ask?.trim()
  const templates = {
    claude: ask
      ? `${ask} Please inspect this local image: ${pathForPrompt}`
      : `Please inspect this local image: ${pathForPrompt}`,
    codex: ask
      ? `${ask} Analyze this local screenshot: ${pathForPrompt}`
      : `Analyze this local screenshot: ${pathForPrompt}`,
    aider: ask
      ? `${ask} Use this image as context: ${pathForPrompt}`
      : `Use this image as context: ${pathForPrompt}`,
    gemini: ask
      ? `${ask} Review this local image: ${pathForPrompt}`
      : `Review this local image: ${pathForPrompt}`,
    opencode: ask
      ? `${ask} Inspect this screenshot file: ${pathForPrompt}`
      : `Inspect this screenshot file: ${pathForPrompt}`,
    generic: ask
      ? `${ask} Image path: ${pathForPrompt}`
      : `Please analyze this local image: ${pathForPrompt}`,
  }
  return templates[options.tool] ?? templates.generic
}

async function copyText(text) {
  if (platform() === 'darwin') {
    const child = spawn('pbcopy')
    child.stdin.write(text)
    child.stdin.end()
    await waitForChild(child, 'pbcopy')
    return
  }

  if (platform() === 'win32') {
    const clipboardTextPath = join(tmpdir(), `agentshot-clipboard-${process.pid}-${Date.now()}.txt`)
    writeFileSync(clipboardTextPath, text, 'utf8')
    const script = `
$text = Get-Content -LiteralPath '${escapePowerShellSingleQuoted(clipboardTextPath)}' -Raw -Encoding UTF8
Set-Clipboard -Value $text
`
    try {
      await powershell(['-Command', script], 'ignore')
    } finally {
      try {
        unlinkSync(clipboardTextPath)
      } catch {
        // Temporary clipboard file cleanup is best-effort.
      }
    }
    return
  }

  const xclip = spawnSync('which', ['xclip'])
  if (xclip.status === 0) {
    const child = spawn('xclip', ['-selection', 'clipboard'])
    child.stdin.write(text)
    child.stdin.end()
    await waitForChild(child, 'xclip')
    return
  }

  throw new Error('Clipboard copy is not available on this platform.')
}

function waitForChild(child, label) {
  return new Promise((resolvePromise, reject) => {
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolvePromise()
      else reject(new Error(`${label} exited with code ${code}`))
    })
  })
}

async function pasteIntoActiveWindow() {
  if (platform() === 'darwin') {
    await run('osascript', ['-e', 'tell application "System Events" to keystroke "v" using command down'], { stdio: 'ignore' })
    return
  }
  if (platform() === 'win32') {
    const script = `
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.SendKeys]::SendWait('^v')
`
    await powershell(['-Command', script], 'ignore')
    return
  }
  throw new Error('Auto paste is currently supported on macOS and Windows.')
}

async function complete(file, options) {
  const prompt = renderPrompt(file, options)
  await copyText(prompt)
  if (options.paste) await pasteIntoActiveWindow()
  console.log(prompt)
  console.error('')
  console.error(`Saved: ${file}`)
  console.error(`Copied prompt for: ${options.tool}`)
  if (options.paste) console.error('Paste attempted.')
}

async function watchClipboard(options) {
  console.error('AgentShot watch is running. Copy a screenshot to the clipboard to generate a prompt.')
  console.error(`Tool: ${options.tool}. Paste: ${options.paste ? 'enabled' : 'disabled'}. Interval: ${options.intervalMs}ms.`)
  console.error('Press Ctrl+C to stop.')

  let lastChangeCount = null
  let lastSavedChangeCount = null
  try {
    const initialState = await getClipboardState()
    lastChangeCount = initialState.changeCount
  } catch (error) {
    throw new Error(`Clipboard watch is unavailable: ${error instanceof Error ? error.message : String(error)}`)
  }

  while (true) {
    await delay(options.intervalMs)
    let state
    try {
      state = await getClipboardState()
    } catch (error) {
      console.error(`agentshot: clipboard state error: ${error instanceof Error ? error.message : String(error)}`)
      continue
    }

    if (state.changeCount === lastChangeCount) continue
    lastChangeCount = state.changeCount
    if (!state.hasImage || state.changeCount === lastSavedChangeCount) continue

    try {
      const file = await saveClipboardScreenshot()
      lastSavedChangeCount = state.changeCount
      await complete(file, options)
    } catch (error) {
      console.error(`agentshot: clipboard image save failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

function daemonArgs(options, settings = {}) {
  const includeAsk = settings.includeAsk ?? true
  const args = ['daemon', 'run', '--tool', options.tool, '--interval', String(options.intervalMs)]
  if (includeAsk && options.ask) args.push('--ask', options.ask)
  if (options.paste) args.push('--paste')
  if (options.wsl) args.push('--wsl')
  return args
}

function writeDaemonConfig(options) {
  ensureConfigDir()
  const config = {
    tool: options.tool,
    ask: options.ask,
    paste: options.paste,
    wsl: options.wsl,
    intervalMs: options.intervalMs,
    installedAt: new Date().toISOString(),
  }
  writeFileSync(daemonConfigPath(), `${JSON.stringify(config, null, 2)}\n`)
}

function readDaemonConfig() {
  try {
    return JSON.parse(readFileSync(daemonConfigPath(), 'utf8'))
  } catch {
    return null
  }
}

function applyDaemonConfig(options) {
  const config = readDaemonConfig()
  if (!config) return options
  return {
    ...options,
    ask: options.ask || config.ask || '',
    tool: options.tool === 'generic' && config.tool ? config.tool : options.tool,
    paste: options.paste || Boolean(config.paste),
    wsl: options.wsl || Boolean(config.wsl),
    intervalMs: options.intervalMs === 800 && config.intervalMs ? config.intervalMs : options.intervalMs,
  }
}

function shellQuoteWindows(value) {
  return `"${String(value).replaceAll('"', '\\"')}"`
}

function shellQuotePosix(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`
}

function installWindowsDaemon(options) {
  writeDaemonConfig(options)
  const taskName = 'AgentShot'
  const node = process.execPath
  const script = currentScriptPath()
  const log = daemonLogPath()
  const runnerPath = join(ensureConfigDir(), 'daemon-launch.ps1')
  const runner = [
    '$ErrorActionPreference = "Continue"',
    `$env:AGENTSHOT_HOME = ${toPowerShellLiteral(ensureConfigDir())}`,
    `$env:AGENTSHOT_DIR = ${toPowerShellLiteral(ensureShotDir())}`,
    `$env:AGENTSHOT_DAEMON_LOG = ${toPowerShellLiteral(log)}`,
    `$node = ${toPowerShellLiteral(node)}`,
    `$script = ${toPowerShellLiteral(script)}`,
    `$arguments = @(${daemonArgs(options, { includeAsk: false }).map(toPowerShellLiteral).join(', ')})`,
    'Start-Process -FilePath $node -ArgumentList @($script) + $arguments -WindowStyle Hidden',
    '',
  ].join('\r\n')
  writeFileSync(runnerPath, `${runner}\r\n`)
  const powershellPath = windowsPowerShellPath()
  const taskRun = `${shellQuoteWindows(powershellPath)} -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File ${shellQuoteWindows(runnerPath)}`
  const result = spawnSync('schtasks.exe', ['/Create', '/TN', taskName, '/SC', 'ONLOGON', '/TR', taskRun, '/F'], {
    shell: false,
    stdio: 'pipe',
    encoding: 'utf8',
  })
  if (result.status !== 0) {
    return installWindowsStartupFallback(runnerPath, result.stderr.trim() || result.stdout.trim())
  }
  startWindowsRunner(node, script, options, log)
  return `Installed Windows scheduled task: ${taskName}`
}

function startWindowsRunner(node, script, options, log) {
  const child = spawn(node, [script, ...daemonArgs(options, { includeAsk: false })], {
    shell: false,
    stdio: ['ignore', 'ignore', 'ignore'],
    windowsHide: true,
    detached: true,
    env: {
      ...process.env,
      AGENTSHOT_HOME: ensureConfigDir(),
      AGENTSHOT_DIR: ensureShotDir(),
      AGENTSHOT_DAEMON_LOG: log,
    },
  })
  child.unref()
}

function installWindowsStartupFallback(runnerPath, reason) {
  const startupDir = join(
    process.env.APPDATA || join(homedir(), 'AppData', 'Roaming'),
    'Microsoft',
    'Windows',
    'Start Menu',
    'Programs',
    'Startup',
  )
  mkdirSync(startupDir, { recursive: true })
  const startupScript = join(startupDir, 'AgentShot.cmd')
  writeFileSync(
    startupScript,
    [
      '@echo off',
      `${shellQuoteWindows(windowsPowerShellPath())} -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File ${shellQuoteWindows(runnerPath)}`,
      '',
    ].join('\r\n'),
  )
  const config = readDaemonConfig() || {}
  startWindowsRunner(process.execPath, currentScriptPath(), {
    tool: config.tool || 'generic',
    ask: config.ask || '',
    paste: Boolean(config.paste),
    wsl: Boolean(config.wsl),
    intervalMs: config.intervalMs || 800,
  }, daemonLogPath())
  return `Installed Windows Startup fallback: ${startupScript}${reason ? ` (scheduled task unavailable: ${reason})` : ''}`
}

function windowsPowerShellPath() {
  return join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')
}

function toPowerShellLiteral(value) {
  return `'${escapePowerShellSingleQuoted(String(value))}'`
}

function installMacOSDaemon(options) {
  writeDaemonConfig(options)
  const label = 'com.junchenmeteor.agentshot'
  const plistPath = join(homedir(), 'Library', 'LaunchAgents', `${label}.plist`)
  mkdirSync(join(homedir(), 'Library', 'LaunchAgents'), { recursive: true })
  const args = [process.execPath, currentScriptPath(), ...daemonArgs(options)]
  const programArguments = args.map((value) => `    <string>${escapeXml(value)}</string>`).join('\n')
  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${label}</string>
  <key>ProgramArguments</key>
  <array>
${programArguments}
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${escapeXml(daemonLogPath())}</string>
  <key>StandardErrorPath</key>
  <string>${escapeXml(daemonLogPath())}</string>
</dict>
</plist>
`
  writeFileSync(plistPath, plist)
  spawnSync('launchctl', ['unload', plistPath], { stdio: 'ignore' })
  const result = spawnSync('launchctl', ['load', plistPath], { stdio: 'pipe', encoding: 'utf8' })
  if (result.status !== 0) throw new Error(result.stderr.trim() || result.stdout.trim() || 'Failed to load LaunchAgent.')
  return `Installed macOS LaunchAgent: ${plistPath}`
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

async function installDaemon(options) {
  const currentPlatform = platform()
  let message
  if (currentPlatform === 'win32') message = installWindowsDaemon(options)
  else if (currentPlatform === 'darwin') message = installMacOSDaemon(options)
  else throw new Error('Daemon install is currently supported on Windows and macOS.')
  if (!options.quiet) {
    console.log(message)
    console.log(`Log: ${daemonLogPath()}`)
  }
}

function uninstallDaemon(options = {}) {
  const currentPlatform = platform()
  if (currentPlatform === 'win32') {
    spawnSync('schtasks.exe', ['/Delete', '/TN', 'AgentShot', '/F'], { stdio: 'ignore' })
  } else if (currentPlatform === 'darwin') {
    const plistPath = join(homedir(), 'Library', 'LaunchAgents', 'com.junchenmeteor.agentshot.plist')
    spawnSync('launchctl', ['unload', plistPath], { stdio: 'ignore' })
    rmSync(plistPath, { force: true })
  } else {
    throw new Error('Daemon uninstall is currently supported on Windows and macOS.')
  }
  if (!options.quiet) console.log('AgentShot daemon uninstalled.')
}

function daemonStatus() {
  const currentPlatform = platform()
  const config = readDaemonConfig()
  let installed = false
  let details = ''
  if (currentPlatform === 'win32') {
    const result = spawnSync('schtasks.exe', ['/Query', '/TN', 'AgentShot'], { stdio: 'pipe', encoding: 'utf8' })
    installed = result.status === 0
    details = result.stdout.trim()
  } else if (currentPlatform === 'darwin') {
    const plistPath = join(homedir(), 'Library', 'LaunchAgents', 'com.junchenmeteor.agentshot.plist')
    installed = existsSync(plistPath)
    details = plistPath
  } else {
    details = 'Daemon status is currently supported on Windows and macOS.'
  }
  console.log(JSON.stringify({ installed, config, log: daemonLogPath(), details }, null, 2))
}

function parseProcessLines(output, currentPlatform) {
  const tools = ['claude', 'codex', 'aider', 'gemini', 'opencode']
  const rows = []
  if (currentPlatform === 'win32') {
    for (const item of JSON.parse(output || '[]')) {
      const command = `${item.Name ?? ''} ${item.CommandLine ?? ''}`.trim()
      const matchedTool = tools.find((tool) => command.toLowerCase().includes(tool))
      if (matchedTool) rows.push({ pid: item.ProcessId, tool: matchedTool, command })
    }
    return rows
  }
  for (const line of output.split('\n').slice(1)) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const match = /^(\d+)\s+(.+)$/.exec(trimmed)
    if (!match) continue
    const command = match[2]
    const matchedTool = tools.find((tool) => command.toLowerCase().includes(tool))
    if (matchedTool) rows.push({ pid: Number(match[1]), tool: matchedTool, command })
  }
  return rows
}

export async function detectSessions() {
  const currentPlatform = platform()
  if (currentPlatform === 'win32') {
    const script = `
try {
  Get-CimInstance Win32_Process -ErrorAction Stop | Select-Object ProcessId,Name,CommandLine | ConvertTo-Json -Compress
} catch {
  Get-Process | Select-Object @{Name='ProcessId';Expression={$_.Id}},@{Name='Name';Expression={$_.ProcessName}},@{Name='CommandLine';Expression={''}} | ConvertTo-Json -Compress
}
`
    const output = await captureOutput('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script])
    const normalized = output.trim().startsWith('[') ? output : `[${output}]`
    return parseProcessLines(normalized, currentPlatform)
  }
  if (currentPlatform === 'darwin' || currentPlatform === 'linux') {
    const output = await captureOutput('ps', ['-axo', 'pid=,command='])
    return parseProcessLines(`PID COMMAND\n${output}`, currentPlatform)
  }
  return []
}

async function printSessions() {
  const rows = await detectSessions()
  if (rows.length === 0) {
    console.log('No terminal AI sessions detected.')
    return
  }
  console.log(JSON.stringify(rows, null, 2))
}

export async function main(argv = process.argv.slice(2)) {
  const { command, options } = parseArgs(argv)

  if (command === 'help') {
    console.log(usage())
    return
  }
  if (command === 'version') {
    console.log(VERSION)
    return
  }
  if (command === 'dir') {
    console.log(ensureShotDir())
    return
  }
  if (command === 'sessions') {
    await printSessions()
    return
  }
  if (command === 'daemon') {
    if (options.daemonAction === 'install') {
      await installDaemon(options)
      return
    }
    if (options.daemonAction === 'status') {
      daemonStatus()
      return
    }
    if (options.daemonAction === 'uninstall') {
      uninstallDaemon(options)
      return
    }
    if (options.daemonAction && options.daemonAction !== 'run') {
      throw new Error(`Unknown daemon action: ${options.daemonAction}`)
    }
    await watchClipboard(options.daemonAction === 'run' ? applyDaemonConfig(options) : options)
    return
  }
  if (command === 'watch') {
    await watchClipboard(options)
    return
  }

  let file = options.imagePath ? resolve(options.imagePath) : ''
  if (file && !existsSync(file)) throw new Error(`Image path not found: ${file}`)

  if (!file) {
    if (command === 'capture') file = await captureScreenshot()
    else if (command === 'clipboard') file = await saveClipboardScreenshot()
    else if (command === 'last') {
      const latest = latestShotPath()
      if (!latest) throw new Error(`No saved screenshots found in ${ensureShotDir()}`)
      file = latest
    } else {
      throw new Error(`Unknown command: ${command}`)
    }
  }

  await complete(file, options)
}

function isCliEntrypoint() {
  if (!process.argv[1]) return false
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1])
  } catch {
    return import.meta.url === pathToFileURL(process.argv[1]).href
  }
}

if (isCliEntrypoint()) {
  main().catch((error) => {
    console.error(`agentshot: ${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
  })
}
