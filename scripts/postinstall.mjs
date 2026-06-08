import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const skip = process.env.AGENTSHOT_SKIP_POSTINSTALL === '1'
  || process.env.CI === 'true'
  || process.env.npm_lifecycle_event !== 'postinstall'

if (skip) process.exit(0)

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const cli = join(root, 'bin', 'agentshot.js')

if (!existsSync(cli)) process.exit(0)

const result = spawnSync(process.execPath, [cli, 'daemon', 'install', '--quiet'], {
  cwd: root,
  stdio: 'pipe',
  shell: false,
  encoding: 'utf8',
})

if (result.status !== 0) {
  const message = (result.stderr || result.stdout || '').trim()
  console.warn(`AgentShot daemon auto-install skipped: ${message || 'unsupported environment'}`)
  console.warn('Run `agentshot daemon install` manually after installation if you want startup listening.')
}
