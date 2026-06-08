const skip = process.env.AGENTSHOT_SKIP_POSTINSTALL === '1'
  || process.env.CI === 'true'
  || process.env.npm_lifecycle_event !== 'postinstall'

if (!skip) {
  console.log('AgentShot installed.')
  console.log('Run `jcshot daemon install --tool codex --ask "Analyze this screenshot"` to enable background clipboard watching.')
}
