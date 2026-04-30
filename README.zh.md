<img src="public/logo.png" alt="ColonyNote" width="120">

# ColonyNote

**支持实时预览的现代 Markdown 在线编辑器。**

直接在浏览器中编辑服务器上的 Markdown 文件 —— 无需上传下载，打开即写。

[English](README.md) · 简体中文

---

## 界面预览

<table style="min-width: 50px;">
<colgroup><col style="min-width: 25px;"><col style="min-width: 25px;"></colgroup><tbody><tr><td colspan="1" rowspan="1"><img src="screenshots/light-editor.png" alt="浅色主题编辑器" width="100%"></td><td colspan="1" rowspan="1"><img src="screenshots/dark-editor.png" alt="深色主题编辑器" width="100%"></td></tr><tr><td colspan="1" rowspan="1" style="text-align: center;"><p>浅色主题</p></td><td colspan="1" rowspan="1" style="text-align: center;"><p>深色主题</p></td></tr><tr><td colspan="1" rowspan="1"><img src="screenshots/search.png" alt="全文搜索" width="100%"></td><td colspan="1" rowspan="1"><img src="screenshots/mobile-editor.png" alt="移动端编辑器" width="100%"></td></tr><tr><td colspan="1" rowspan="1" style="text-align: center;"><p>全文搜索</p></td><td colspan="1" rowspan="1" style="text-align: center;"><p>移动端编辑器</p></td></tr></tbody>
</table>

## 功能特性

- **服务端文件编辑** — 直接在浏览器中编辑服务器上的 Markdown 文件，无需上传下载。
- **所见即所得 + 源码模式** — 一键切换富文本编辑和原始 Markdown 源码。
- **实时预览** — 基于 TipTap 3，输入内容实时渲染。
- **Mermaid 图表** — 支持流程图、时序图、类图、状态图、ER 图、甘特图、饼图和用户旅程图。
- **LaTeX 数学公式** — 通过 KaTeX 完整支持数学公式渲染。
- **代码高亮** — 支持 15+ 编程语言的语法高亮，带一键复制功能。
- **全文搜索** — 基于 ripgrep 的模糊匹配搜索，快速定位文档内容。
- **多目录管理** — 同时管理多个文档目录，每个目录独立文件树。
- **多标签页** — 支持多文件标签页打开，带脏状态提示和自动保存。
- **实时同步** — 基于 WebSocket 的文件变更通知，多端保持同步。
- **外部变更检测** — 自动检测并处理编辑器外的文件修改。
- **深色 / 浅色 / 跟随系统** — 自由选择主题或跟随系统设置。
- **移动端优先** — 针对移动设备优化的响应式布局和触摸交互。

## 快速开始

### 安装

```bash
npm install -g colonynote
```

### 启动

```bash
# 使用当前目录启动
colonynote

# 指定目录
colonynote -d /path/to/docs

# 指定多个目录
colonynote -d ./docs -d ./notes

# 指定端口
colonynote -p 3000

# 指定监听地址
colonynote --host 127.0.0.1
```

然后在浏览器中打开 `http://localhost:5787`。

### CLI 选项

| 选项 | 别名 | 描述 | 默认值 |
| --- | --- | --- | --- |
| `--dir` | `-d` | 文档根目录（可多次指定） | 当前目录 |
| `--port` | `-p` | 服务器端口 | `5787` |
| `--host` |  | 服务器监听地址 | `0.0.0.0` |

## 配置

ColonyNote 从 `~/.colonynote/config.json`（生产环境）或 `~/.colonynote/config.dev.json`（开发环境）读取配置。

手动创建配置文件：

```json
{
  "dirs": [
    { "path": "/path/to/docs", "name": "文档" }
  ],
  "allowedExtensions": [".md", ".markdown", ".mdown", ".mkdn"],
  "showHiddenFiles": false,
  "theme": {
    "default": "system"
  },
  "editor": {
    "autosave": true,
    "debounceMs": 300
  },
  "ignore": {
    "patterns": [
      "node_modules",
      ".git",
      ".next",
      "dist",
      "build"
    ]
  }
}
```

配置文件修改后会自动重新加载 —— 无需重启服务器。

### 配置字段说明

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `dirs` | `Array<{path, name?, exclude?}>` | 要服务的文档目录 |
| `allowedExtensions` | `string[]` | 文件树中显示的文件扩展名 |
| `showHiddenFiles` | `boolean` | 是否显示隐藏文件（以点开头的文件） |
| `theme.default` | \`"light" | "dark" |
| `editor.autosave` | `boolean` | 是否启用自动保存 |
| `editor.debounceMs` | `number` | 自动保存防抖延迟（毫秒） |
| `ignore.patterns` | `string[]` | 全局忽略模式（支持 glob 语法） |

## 开发

```bash
# 克隆仓库
git clone https://github.com/opencolony/note.git
cd note

# 安装依赖
pnpm install

# 启动开发服务器（后端 + 前端热更新）
pnpm dev

# 仅前端开发（Vite 开发服务器，端口 5787）
pnpm dev:frontend

# 仅后端开发（Hono 服务器，端口 5788）
pnpm dev:backend

# 构建生产版本
pnpm build

# 运行生产版本
pnpm start

# 类型检查
pnpm typecheck

# 运行测试
pnpm test
```

## 技术栈

- **后端**: [Hono](https://hono.dev) + [@hono/node-server](https://github.com/honojs/node-server) + [ws](https://github.com/websockets/ws)
- **前端**: [React 18](https://react.dev) + [Vite](https://vitejs.dev) + [Tailwind CSS v4](https://tailwindcss.com)
- **UI 组件**: [shadcn/ui](https://ui.shadcn.com)（基于 [Radix UI](https://www.radix-ui.com)）
- **编辑器**: [TipTap 3](https://tiptap.dev) + [tiptap-markdown](https://github.com/aguingand/tiptap-markdown)
- **图表**: [Mermaid](https://mermaid.js.org)
- **数学公式**: [KaTeX](https://katex.org)
- **搜索**: ripgrep（服务端）+ FlexSearch（客户端索引）
- **代码高亮**: [lowlight](https://github.com/wooorm/lowlight)
- **图标**: [lucide-react](https://lucide.dev)

## 许可证

MIT

## 作者

岳晓亮 [hi@yuexiaoliang.com](mailto:hi@yuexiaoliang.com)