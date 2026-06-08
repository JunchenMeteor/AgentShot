# npm Release Guide

AgentShot's primary distribution channel is npm:

```bash
npm install -g jcagentshot
```

GitHub installs are reserved for preview builds or source testing.

## Account Requirements

You need:

- An npm account: https://www.npmjs.com/signup
- 2FA configured if npm requires it for publishing.
- Ownership of the `jcagentshot` package name.

For the unscoped package name `jcagentshot`, the first successful publish claims that package name for the publishing npm account.

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

## Automated Release

AgentShot keeps npm publishing and GitHub Releases synchronized through Git tags.

AgentShot uses npm Trusted Publishing instead of a long-lived `NPM_TOKEN` secret. GitHub Actions receives a short-lived OIDC credential from npm during the release job.

Required npm package setting:

```text
npm package -> Settings -> Trusted publishing -> GitHub Actions
```

Configure the trusted publisher as:

```text
Organization or user: JunchenMeteor
Repository: AgentShot
Workflow filename: release.yml
Environment name: leave empty
```

Release flow:

```bash
npm version patch
git push origin main
git push origin v$(node -p "require('./package.json').version")
```

When the `vX.Y.Z` tag is pushed, GitHub Actions will:

1. Check that the tag version matches `package.json`.
2. Install an npm CLI version that supports Trusted Publishing.
3. Run `npm run validate`.
4. Publish `jcagentshot@X.Y.Z` to npm through Trusted Publishing.
5. Create or update the matching GitHub Release with generated notes.

If the tag and `package.json` version do not match, the release workflow fails before publishing.
If npm publish succeeds but a later step fails, do not rerun blindly for the same version. Check npm first, then repair the GitHub Release manually or publish a new patch version.

Because `main` is protected, prefer opening a version bump PR first, merging it, then creating the tag from the merged `main` commit.

## First Publish

```bash
npm login
npm publish
```

Unscoped packages publish publicly by default.

After publishing, verify:

```bash
npm view jcagentshot version
npm view jcagentshot dist.tarball
```

Then test install on a clean machine or throwaway directory:

```bash
npm install -g jcagentshot
jcshot --help
jcshot daemon status
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
npm install -g jcagentshot
```

Windows PowerShell:

```powershell
npm config set prefix "$env:USERPROFILE\.npm-global"
npm install -g jcagentshot
```

Then add `%USERPROFILE%\.npm-global` to the user PATH if `jcshot` is not found.

Temporary macOS/Linux fallback:

```bash
sudo npm install -g jcagentshot
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
