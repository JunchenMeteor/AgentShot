# AgentShot

<p align="center">
  <strong>面向终端 AI Agent 的本地优先截图桥接工具</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/jcagentshot"><img alt="npm" src="https://img.shields.io/npm/v/jcagentshot?style=for-the-badge&logo=npm&color=CB3837" /></a>
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img alt="Local First" src="https://img.shields.io/badge/Local--first-No%20upload-1F6FEB?style=for-the-badge" />
  <br />
  <a href="https://github.com/JunchenMeteor/AgentShot/issues"><img alt="Issues" src="https://img.shields.io/badge/Links-Issues-1F6FEB" /></a>
  <a href="https://www.npmjs.com/package/jcagentshot"><img alt="npm downloads" src="https://img.shields.io/npm/dm/jcagentshot?label=npm%20downloads" /></a>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/License-MIT-blue" /></a>
  <br />
  <a href="README.md"><img alt="Docs English" src="https://img.shields.io/badge/Docs-English-black" /></a>
  <a href="README.zh-CN.md"><img alt="Docs 中文" src="https://img.shields.io/badge/Docs-%E4%B8%AD%E6%96%87-red" /></a>
</p>

面向 Claude Code、Codex CLI、Aider、Gemini CLI、OpenCode 和终端 AI Agent 的本地优先截图桥接工具。

```text
剪贴板截图 -> 本地文件 -> AI prompt -> 剪贴板或当前终端
```

AgentShot 是为习惯在终端里使用 AI 编程工具的开发者设计的。它解决的是截图之后还要手动保存、命名、移动文件、复制路径、再组织 prompt 的繁琐流程。

## 目录

- [快速开始](#快速开始)
- [安装](#安装)
- [为什么需要 AgentShot](#为什么需要-agentshot)
- [常用场景](#常用场景)
- [命令](#命令)
- [支持的 AI 工具](#支持的-ai-工具)
- [存储与隐私](#存储与隐私)
- [Daemon](#daemon)
- [平台能力](#平台能力)
- [和同类工具的区别](#和同类工具的区别)
- [质量基线](#质量基线)
- [当前状态](#当前状态)

## 快速开始

全局安装：

```bash
npm install -g jcagentshot
```

处理一次剪贴板截图：

```bash
# macOS: Cmd+Shift+Ctrl+4 框选区域，然后：
jcshot clipboard --ask "分析这个 UI 问题"
```

如果你经常截图，可以安装常驻监听器：

```bash
jcshot daemon install --ask "分析这张截图"
jcshot daemon status
```

之后用系统快捷键截图到剪贴板，再回到 Claude Code、Codex、Aider、Gemini CLI、OpenCode 或其他终端 Agent 粘贴即可。

生成的 prompt 大概长这样：

```text
Analyze this screenshot: /Users/you/.agentshot/shots/shot-20260608-224138.png
```

命名说明：产品名是 AgentShot，npm 包名是 `jcagentshot`，CLI 命令是 `jcshot`，本地数据仍保存在 `~/.agentshot`。

## 安装

npm 是 AgentShot 的主要安装方式：

```bash
npm install -g jcagentshot
```

全局安装不会自动注册后台 daemon。需要后台监听时，显式执行：

```bash
jcshot daemon install --ask "分析这张截图"
```

不全局安装，直接运行：

```bash
npx jcagentshot
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

跳过 postinstall 提示：

```bash
AGENTSHOT_SKIP_POSTINSTALL=1 npm install -g jcagentshot
```

如果全局安装遇到权限不足，优先使用用户目录作为 npm 全局安装目录：

```bash
npm config set prefix ~/.npm-global
export PATH="$HOME/.npm-global/bin:$PATH"
npm install -g jcagentshot
```

Windows 可以使用用户可写目录：

```powershell
npm config set prefix "$env:USERPROFILE\.npm-global"
```

然后把 `%USERPROFILE%\.npm-global` 加入用户 PATH。

自动兜底安装脚本：

```powershell
# Windows
irm https://raw.githubusercontent.com/JunchenMeteor/AgentShot/main/install.ps1 | iex
```

```bash
# macOS/Linux
curl -fsSL https://raw.githubusercontent.com/JunchenMeteor/AgentShot/main/install.sh | bash
```

这些脚本会检查 Node.js，在需要时把 npm 全局安装目录切到用户可写目录，更新 PATH，安装 AgentShot，然后提示你显式启用 daemon。

如果希望先检查 Windows 脚本再执行：

```powershell
irm https://raw.githubusercontent.com/JunchenMeteor/AgentShot/main/install.ps1 -OutFile install.ps1
notepad .\install.ps1
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

macOS/Linux 也可以临时使用 `sudo`，但更推荐用户可写 npm prefix：

```bash
sudo npm install -g jcagentshot
```

## 为什么需要 AgentShot

很多终端 AI 工具可以读取本地图片文件，但普通终端通常不能直接把剪贴板图片传给 CLI。传统流程会变成：

```text
截图 -> 保存或导出 -> 命名 -> 移动目录 -> 复制路径 -> 写 prompt
```

AgentShot 把流程改成剪贴板优先：

```text
截图到剪贴板 -> AgentShot 保存图片 -> AgentShot 复制 AI 可用 prompt
```

适合使用 AgentShot 的场景：

- 你在终端里使用 Claude Code、Codex CLI、Aider、Gemini CLI、OpenCode 或类似工具。
- 你经常需要把 UI bug、布局问题、日志截图、Dashboard 或 App 截图交给 AI 分析。
- 你希望截图保留在本地，不上传到图片托管服务。
- 你希望一套流程同时支持多个终端 Agent。

如果你使用的 AI 工具已经在当前工作位置支持直接粘贴图片，就不一定需要 AgentShot。

## 常用场景

macOS 剪贴板优先：

```bash
# Cmd+Shift+Ctrl+4 框选区域，然后：
jcshot clipboard --ask "分析这个 UI 问题"
```

Windows 剪贴板优先：

```powershell
# Win+Shift+S 框选区域，然后：
jcshot clipboard --ask "分析这个 UI 问题"
```

在当前终端临时运行 watcher：

```bash
jcshot watch --ask "分析这张截图"
```

安装为开机常驻 watcher：

```bash
jcshot daemon install --ask "分析这张截图"
jcshot daemon status
```

在 WSL 中使用 Codex：

```powershell
jcshot clipboard --tool codex --wsl --ask "找出这个视觉问题"
```

复用最近一次截图：

```bash
jcshot last --tool aider --ask "检查这张截图"
```

使用已有图片文件：

```bash
jcshot --path ./error.png --tool opencode --ask "解释这个错误"
```

复制后尝试粘贴到当前终端：

```bash
jcshot clipboard --tool claude --ask "检查这个页面" --paste
```

交互式截图兜底：

```bash
jcshot --ask "这个布局哪里不对？"
```

macOS 会调用 `screencapture -i`。Windows 在剪贴板没有图片时会打开系统截图工具。

## 命令

| 命令 | 作用 |
| --- | --- |
| `jcshot [capture]` | 截图、保存并复制 prompt。 |
| `jcshot clipboard` | 保存当前剪贴板图片并复制 prompt。 |
| `jcshot watch` | 在当前终端监听新的剪贴板截图。 |
| `jcshot daemon` | 常驻剪贴板监听器。 |
| `jcshot daemon install` | 安装开机常驻监听器。 |
| `jcshot daemon status` | 查看 daemon 安装状态、配置和日志路径。 |
| `jcshot daemon uninstall` | 移除开机常驻监听器。 |
| `jcshot sessions` | 列出检测到的 AI CLI 进程。 |
| `jcshot last` | 复用最近一次保存的截图。 |
| `jcshot dir` | 输出截图目录。 |
| `jcshot --help` | 显示帮助。 |

模式区别：

| 模式 | 适合场景 |
| --- | --- |
| `clipboard` | 单次处理剪贴板截图。 |
| `watch` | 在当前终端临时监听。 |
| `daemon` | 长时间运行监听进程。 |
| `daemon install` | 登录后自动启动监听器。 |
| `last` | 复用最近一次截图。 |

## 支持的 AI 工具

AgentShot 使用 prompt 模板，不绑定任何 AI API。只要 CLI Agent 能访问本地文件路径，就可以使用。

`--tool` 是可选参数。不写时，AgentShot 会使用通用 prompt 模板。只有当你希望针对某个具体 Agent 调整措辞时，才需要加 `--tool codex`、`--tool claude` 或其他模板。

第一批模板：

- Claude Code
- Codex CLI
- Aider
- Gemini CLI
- OpenCode
- 通用终端 Agent

## 存储与隐私

AgentShot 不上传截图，没有遥测，不依赖图片托管服务，也不需要云账号。

图片默认保存到：

```text
macOS/Linux: ~/.agentshot/shots
Windows: %USERPROFILE%\.agentshot\shots
```

如果主目录不可写，AgentShot 会 fallback 到 `Pictures/agent-shots`，再 fallback 到系统临时目录。你也可以用 `AGENTSHOT_DIR` 指定目录：

```bash
AGENTSHOT_DIR=/path/to/shots jcshot
```

原生终端自动粘贴说明：

- `--paste` 会先复制 prompt，然后让系统在当前活跃 App 中执行粘贴。
- macOS 通过 System Events 发送 `Cmd+V`。
- Windows 通过 Windows Forms 发送 `Ctrl+V`。
- 自动粘贴是 best-effort，因为不同终端和系统安全模型不完全一致。

推荐的日常流程：

```text
1. 全局安装 AgentShot，或执行 daemon install。
2. 用系统快捷键截图到剪贴板。
3. 回到 Claude Code/Codex 终端粘贴。
```

这样不会把 prompt 误粘到错误窗口，同时也去掉了手动保存、命名、移动和复制路径。

## Daemon

AgentShot 的 daemon 是常驻剪贴板监听器。它不会上传截图，也不会默认向终端窗口注入内容。

```bash
jcshot daemon install --ask "分析这张截图"
jcshot daemon status
jcshot daemon doctor
jcshot daemon uninstall
```

`daemon install` 必须显式执行。npm install 不会注册或启动后台服务。安装前 AgentShot 会打印 daemon 范围：只监听剪贴板图片变化，不读取文字剪贴板，不上传文件，也不会向终端窗口注入文本。

开机常驻方式：

- macOS：`~/Library/LaunchAgents/com.junchenmeteor.agentshot.plist`。
- Windows：名为 `AgentShot` 的用户登录计划任务。监听器使用一个隐藏的剪贴板 helper 进程，不再为每次轮询反复启动 PowerShell。

日志和配置：

```text
~/.agentshot/daemon.log
~/.agentshot/daemon.json
```

`jcshot daemon doctor` 会输出已安装任务/agent 状态、配置路径、日志路径、截图目录和安全边界检查。

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

## 和同类工具的区别

这是高层定位表，不是完整 benchmark。

| 工具 | Windows + macOS | 纯本地 | 终端优先 | 多 AI 工具 | 不依赖 VS Code |
| --- | --- | --- | --- | --- | --- |
| AgentShot | 是 | 是 | 是 | 是 | 是 |
| Paparazzi | 偏 macOS | 是 | 偏 Claude Code | 有限 | 是 |
| Snap2Link | 是 | 否，生成分享链接 | 是 | 是 | 是 |
| VS Code 图片粘贴扩展 | 不一定 | 是 | 仅 VS Code 终端 | 不一定 | 否 |
| Raycast terminal image paste | macOS | 是 | 工具型 | 通用 | 依赖 Raycast |

## 会话检测

`jcshot sessions` 会列出可能的终端 AI CLI 进程。它是只读能力，不会注入文本，目的是为后续显式选择会话、可选注入能力预留基础。

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

## License

MIT
