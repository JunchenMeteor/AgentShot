# npm Release Guide

AgentShot's primary distribution channel is npm:

```bash
npm install -g @junchenmeteor/agentshot
```

GitHub installs are reserved for preview builds or source testing.

## Account Requirements

You need:

- An npm account: https://www.npmjs.com/signup
- 2FA configured if npm requires it for publishing.
- Access to the package scope.

For the package name `@junchenmeteor/agentshot`, the npm user or organization must own the `junchenmeteor` scope. If the scope does not exist, npm creates it for your user on first publish if the username matches, or for an organization if created in npm first.

## Login

```bash
npm login
npm whoami
```

If `npm whoami` prints your npm username, the local machine is authenticated.

## Preflight

Run these before every publish:

```bash
npm run validate
npm pack --dry-run
```

Check that the tarball includes:

- `bin/agentshot.js`
- `scripts/postinstall.mjs`
- `README.md`
- `README.zh-CN.md`
- `docs`
- `LICENSE`

## First Publish

```bash
npm login
npm publish --access public
```

Scoped packages need `--access public` for public release.

After publishing, verify:

```bash
npm view @junchenmeteor/agentshot version
npm view @junchenmeteor/agentshot dist.tarball
```

Then test install on a clean machine or throwaway directory:

```bash
npm install -g @junchenmeteor/agentshot
agentshot --help
agentshot daemon status
```

## Permission Issues During Global Install

If users get permission errors during global install, the recommended fallback is the official install script.

Windows:

```powershell
irm https://raw.githubusercontent.com/JunchenMeteor/AgentShot/main/install.ps1 | iex
```

macOS/Linux:

```bash
curl -fsSL https://raw.githubusercontent.com/JunchenMeteor/AgentShot/main/install.sh | bash
```

Safer Windows inspection flow:

```powershell
irm https://raw.githubusercontent.com/JunchenMeteor/AgentShot/main/install.ps1 -OutFile install.ps1
notepad .\install.ps1
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

Manual fallback: use a user-writable npm prefix.

macOS/Linux:

```bash
npm config set prefix ~/.npm-global
export PATH="$HOME/.npm-global/bin:$PATH"
npm install -g @junchenmeteor/agentshot
```

Windows PowerShell:

```powershell
npm config set prefix "$env:USERPROFILE\.npm-global"
npm install -g @junchenmeteor/agentshot
```

Then add `%USERPROFILE%\.npm-global` to the user PATH if `agentshot` is not found.

Temporary macOS/Linux fallback:

```bash
sudo npm install -g @junchenmeteor/agentshot
```

A user-writable prefix is preferred because it avoids mixing npm global tools with administrator-owned files.

## Version Bump

```bash
npm version patch
npm run validate
npm publish --access public
```

Use:

- `npm version patch` for fixes.
- `npm version minor` for new features.
- `npm version major` for breaking changes.

## Preview Install From GitHub

Users can install preview builds from GitHub:

```bash
npm install -g github:JunchenMeteor/AgentShot
```

Source install for development:

```bash
npm install
npm link
```

## Unpublish Warning

Do not rely on unpublishing as a normal rollback path. Publish a fixed version instead:

```bash
npm version patch
npm publish --access public
```
