# AgentShot

[English](README.md) | 简体中文

面向 Claude Code、Codex CLI、Aider、Gemini CLI、OpenCode 和终端 AI Agent 的本地优先截图桥接工具。

```text
剪贴板截图 -> 本地文件 -> AI prompt -> 剪贴板或当前终端
```

AgentShot 是为习惯在终端里使用 AI 工具的开发者设计的。它解决的是截图之后还要手动保存、命名、移动文件、复制路径、再组织 prompt 的繁琐流程。

## 它解决什么问题

很多终端 AI 工具可以读取本地图片文件，但普通终端通常不能直接把剪贴板图片传给 CLI。传统流程会变成：

```text
截图 -> 保存或导出 -> 命名 -> 移动目录 -> 复制路径 -> 写 prompt
```

AgentShot 的推荐流程是 clipboard-first：

```bash
# macOS: Cmd+Shift+Ctrl+4 框选区域，然后：
agentshot clipboard --ask "分析这个 UI 问题" --tool codex
```

更顺的方式是常驻 watcher：

```bash
agentshot daemon --ask "分析这张截图" --tool codex
```

之后每次新的剪贴板截图都会被保存，并转换成 AI 可用 prompt。
npm 全局安装后，AgentShot 会尝试自动注册这个后台监听器。默认仍然是安全的剪贴板模式：只准备 prompt，由用户自己回到 AI 终端粘贴。

## 和同类工具的区别

| 工具 | Windows + macOS | 纯本地 | 终端优先 | 多 AI 工具 | 不依赖 VS Code |
| --- | --- | --- | --- | --- | --- |
| AgentShot | 是 | 是 | 是 | 是 | 是 |
| Paparazzi | 偏 macOS | 是 | 偏 Claude Code | 有限 | 是 |
| Snap2Link | 是 | 否，生成分享链接 | 是 | 是 | 是 |
| VS Code 图片粘贴扩展 | 不一定 | 是 | 仅 VS Code 终端 | 不一定 | 否 |
| Raycast terminal image paste | macOS | 是 | 工具型 | 通用 | 依赖 Raycast |

## 平台能力

| 能力 | Windows | macOS |
| --- | --- | --- |
| 保存剪贴板截图 | 支持 | 支持 |
| 从 CLI 打开截图工具 | 支持，Windows 截图工具兜底 | 支持，`screencapture -i` 兜底 |
| 剪贴板 watcher | 支持 | 支持 |
| 开机常驻 daemon | 支持，计划任务 | 支持，LaunchAgent |
| 复制 prompt 到剪贴板 | 支持 | 支持 |
| best-effort 自动粘贴 | 支持 | 支持 |
| WSL 路径转换 | 支持 | 不适用 |
| AI 会话检测 | 支持 | 支持 |
| 全局快捷键/菜单栏 helper | 计划中 | 计划中 |
| SSH 远程复制 | 计划中 | 计划中 |

## 功能

- 自动保存截图并生成时间戳文件名。
- 自动复制 AI 可用 prompt。
- 通过 `agentshot watch` 监听剪贴板图片变化。
- 通过 `agentshot daemon install` 安装开机常驻监听器。
- 通过 `agentshot daemon status` 查看 daemon 状态。
- 通过 `agentshot sessions` 检测终端 AI 进程。
- 可选 best-effort 粘贴到当前终端。
- macOS 支持剪贴板截图保存和交互式截图兜底。
- Windows 支持剪贴板截图保存和系统截图工具兜底。
- 支持 Windows 到 WSL 的路径转换。
- 支持 `claude`、`codex`、`aider`、`gemini`、`opencode` 和 `generic` prompt 模板。
- 不上传、不遥测、不依赖图片托管服务。

## 安装

npm 是 AgentShot 的主流安装方式：

```bash
npm install -g @jcmeteor/agentshot
```

全局安装会 best-effort 尝试注册后台 daemon。如果当前环境不允许注册，安装不会失败，AgentShot 会提示手动命令。

跳过自动 daemon 注册：

```bash
AGENTSHOT_SKIP_POSTINSTALL=1 npm install -g @jcmeteor/agentshot
```

如果全局安装遇到权限不足，优先使用用户目录作为 npm 全局安装目录：

Windows 自动兜底安装：

```powershell
irm https://raw.githubusercontent.com/JunchenMeteor/AgentShot/main/install.ps1 | iex
```

macOS/Linux 自动兜底安装：

```bash
curl -fsSL https://raw.githubusercontent.com/JunchenMeteor/AgentShot/main/install.sh | bash
```

这些脚本会检查 Node.js，在需要时把 npm 全局安装目录切到用户可写目录，更新 PATH，安装 AgentShot，并注册 daemon。

如果希望先检查脚本再执行：

```powershell
irm https://raw.githubusercontent.com/JunchenMeteor/AgentShot/main/install.ps1 -OutFile install.ps1
notepad .\install.ps1
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

手动配置 npm prefix：

```bash
# 推荐给 npm 全局工具使用
npm config set prefix ~/.npm-global
```

然后把 npm 全局 bin 目录加入 shell PATH：

```bash
export PATH="$HOME/.npm-global/bin:$PATH"
```

Windows 可以使用用户可写目录：

```powershell
npm config set prefix "$env:USERPROFILE\.npm-global"
```

然后把 `%USERPROFILE%\.npm-global` 加入用户 PATH。

macOS/Linux 也可以临时使用 `sudo`，但更推荐用户可写 npm prefix：

```bash
sudo npm install -g @jcmeteor/agentshot
```

不全局安装，直接运行：

```bash
npx @jcmeteor/agentshot
```

从 GitHub 安装预览版本：

```bash
npm install -g github:JunchenMeteor/AgentShot
```

从源码安装：

```bash
git clone https://github.com/JunchenMeteor/AgentShot.git
cd AgentShot
npm install
npm link
```

## 快速开始

macOS clipboard-first：

```bash
# Cmd+Shift+Ctrl+4 框选区域，然后：
agentshot clipboard --ask "分析这个 UI 问题" --tool codex
```

Windows clipboard-first：

```powershell
# Win+Shift+S 框选区域，然后：
agentshot clipboard --ask "分析这个 UI 问题" --tool claude
```

剪贴板 watcher：

```bash
agentshot daemon --ask "分析这张截图" --tool codex
```

安装为开机常驻 watcher：

```bash
agentshot daemon install --ask "分析这张截图" --tool codex
agentshot daemon status
```

交互式截图兜底：

```bash
agentshot --ask "这个布局哪里不对？" --tool codex
```

macOS 会调用 `screencapture -i`。Windows 在剪贴板没有图片时会打开系统截图工具。

## 常用场景

在 WSL 里使用 Codex：

```powershell
agentshot clipboard --tool codex --wsl --ask "找出这个视觉问题"
```

复用最近一次截图：

```bash
agentshot last --tool aider --ask "检查这张截图"
```

使用已有图片文件：

```bash
agentshot --path ./error.png --tool opencode --ask "解释这个错误"
```

复制后尝试粘贴到当前终端：

```bash
agentshot clipboard --tool claude --ask "检查这个页面" --paste
```

## 命令

```text
agentshot [capture]        截图、保存并复制 prompt。
agentshot clipboard        保存当前剪贴板图片并复制 prompt。
agentshot watch            监听新的剪贴板截图。
agentshot daemon           常驻剪贴板监听器。
agentshot daemon install   安装开机常驻监听器。
agentshot daemon status    查看 daemon 安装状态、配置和日志路径。
agentshot daemon uninstall 移除开机常驻监听器。
agentshot sessions         列出检测到的 AI CLI 进程。
agentshot last             复用最近一次保存的截图。
agentshot dir              输出截图目录。
agentshot --help           显示帮助。
```

## 支持的 AI 工具

AgentShot 使用 prompt 模板，不绑定任何 AI API。只要 CLI Agent 能访问本地文件路径，就可以使用。

第一批模板：

- Claude Code
- Codex CLI
- Aider
- Gemini CLI
- OpenCode
- 通用终端 Agent

## 存储

AgentShot 不上传截图。图片默认保存到：

```text
macOS/Linux: ~/.agentshot/shots
Windows: %USERPROFILE%\.agentshot\shots
```

如果主目录不可写，AgentShot 会 fallback 到 `Pictures/agent-shots`，再 fallback 到系统临时目录。你也可以用 `AGENTSHOT_DIR` 指定目录：

```bash
AGENTSHOT_DIR=/path/to/shots agentshot
```

## 原生终端自动粘贴说明

`--paste` 会先复制 prompt，然后让系统在当前活跃 App 中执行粘贴：

- macOS：通过 System Events 发送 `Cmd+V`。
- Windows：通过 Windows Forms 发送 `Ctrl+V`。

在权限和焦点正确时，它应该可以作用于 Terminal.app 和 Windows Terminal，但仍然是 best-effort，因为不同终端和系统安全模型不完全一致。

推荐的日常流程：

```text
1. 全局安装 AgentShot，或执行：agentshot daemon install --ask "分析这张截图" --tool codex
2. 用系统快捷键截图到剪贴板。
3. 回到 Claude Code/Codex 终端粘贴。
```

这样不会把 prompt 误粘到错误窗口，同时也去掉了手动保存、命名、移动和复制路径。

## Daemon

AgentShot 的 daemon 是常驻剪贴板监听器。它不会上传截图，也不会默认向终端窗口注入内容。

```bash
agentshot daemon install --tool codex --ask "分析这张截图"
agentshot daemon status
agentshot daemon uninstall
```

开机常驻方式：

- macOS：`~/Library/LaunchAgents/com.junchenmeteor.agentshot.plist`。
- Windows：名为 `AgentShot` 的用户登录计划任务。

日志和配置：

```text
~/.agentshot/daemon.log
~/.agentshot/daemon.json
```

## 会话检测

`agentshot sessions` 会列出可能的终端 AI CLI 进程。它是只读能力，不会注入文本，目的是为后续显式选择会话、可选注入能力预留基础。

## 质量基线

运行完整本地校验：

```bash
npm run validate
```

它会检查语法、单元测试、help 输出和 npm 打包内容。CI 会在 Windows、macOS、Linux 以及 Node 18、20、22 上运行同样的校验。

## 当前状态

AgentShot 目前是 MVP。稳定基线是：

```text
剪贴板图片 -> 保存文件 -> 渲染 prompt -> 复制 prompt
```

自动粘贴是 best-effort。剪贴板 watcher 已实现为 CLI watcher；全局快捷键和菜单栏 helper 计划后续补齐。
开机常驻 daemon 和只读会话检测已经纳入当前路线。

## License

MIT
