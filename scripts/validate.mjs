import { spawnSync } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const projectRoot = process.cwd()
const npmCache = join(tmpdir(), 'agentshot-npm-cache')

function run(label, command, args, options = {}) {
  console.log(`\n> ${label}`)
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      npm_config_cache: npmCache,
      ...options.env,
    },
  })

  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status}`)
  }
}

try {
  mkdirSync(npmCache, { recursive: true })
  run('syntax check', 'node', ['--check', 'bin/agentshot.js'])
  run('unit tests', 'node', ['--test'])
  run('help smoke test', 'node', ['bin/agentshot.js', '--help'])
  run('package dry run', 'npm', ['pack', '--dry-run'])
} finally {
  rmSync(npmCache, { recursive: true, force: true })
}
