#!/usr/bin/env bash
set -euo pipefail

step() {
  printf '==> %s\n' "$1" >&2
}

ensure_node() {
  if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    printf 'Node.js and npm are required. Install Node.js 18+ from https://nodejs.org/ and rerun this script.\n' >&2
    exit 1
  fi

  local major
  major="$(node -p "process.versions.node.split('.')[0]")"
  if [ "$major" -lt 18 ]; then
    printf 'Node.js 18+ is required. Current major version: %s.\n' "$major" >&2
    exit 1
  fi
}

is_writable_dir() {
  local dir="$1"
  mkdir -p "$dir" 2>/dev/null || return 1
  local probe="$dir/.agentshot-write-test"
  printf 'ok' > "$probe" 2>/dev/null || return 1
  rm -f "$probe"
}

ensure_npm_prefix() {
  local current_prefix
  current_prefix="$(npm prefix -g)"
  local target_prefix="$HOME/.npm-global"

  if is_writable_dir "$current_prefix"; then
    step "npm global prefix is writable: $current_prefix"
    printf '%s\n' "$current_prefix"
    return
  fi

  step "npm global prefix is not writable: $current_prefix"
  step "Configuring user npm prefix: $target_prefix"
  mkdir -p "$target_prefix"
  npm config set prefix "$target_prefix"
  printf '%s\n' "$target_prefix"
}

ensure_path() {
  local prefix="$1"
  case ":$PATH:" in
    *":$prefix:"*) ;;
    *) export PATH="$prefix:$PATH" ;;
  esac

  local shell_profile="$HOME/.profile"
  if [ -n "${SHELL:-}" ] && [[ "$SHELL" == *"zsh"* ]]; then
    shell_profile="$HOME/.zshrc"
  elif [ -n "${SHELL:-}" ] && [[ "$SHELL" == *"bash"* ]]; then
    shell_profile="$HOME/.bashrc"
  fi

  if [ -f "$shell_profile" ] && grep -F "$prefix" "$shell_profile" >/dev/null 2>&1; then
    step "PATH already configured in $shell_profile"
    return
  fi

  step "Adding AgentShot npm prefix to $shell_profile"
  {
    printf '\n# AgentShot npm global tools\n'
    printf 'export PATH="%s:$PATH"\n' "$prefix"
  } >> "$shell_profile"
}

install_agentshot() {
  step "Installing jcagentshot from npm"
  npm install -g jcagentshot
}

ensure_node
prefix="$(ensure_npm_prefix)"
ensure_path "$prefix"
install_agentshot

step "AgentShot is ready"
printf 'Run this to enable background clipboard watching:\n'
printf 'jcshot daemon install --tool codex --ask "Analyze this screenshot"\n'
jcshot --help
