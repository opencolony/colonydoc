# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# ColonyNote

Markdown 在线编辑器，支持服务端文件编辑、实时预览、Mermaid 图表和 LaTeX 公式。

可作为 CLI 工具全局安装：`npm install -g colonynote` → `colonynote -d /path/to/docs`

## 构建命令

```bash
# 全栈开发（后端 + 前端热更新）- 默认端口：前端 5787，后端 5788
pnpm dev

# 仅前端开发（Vite 开发服务器，端口 5787）
pnpm dev:frontend

# 仅后端开发（Hono 服务器，端口 5788）
pnpm dev:backend

# 生产构建（前端 Vite + 后端 TypeScript 编译）
pnpm build

# 运行生产服务器
pnpm start

# 预览生产构建
pnpm preview

# TypeScript 类型检查
pnpm typecheck

# 运行测试
pnpm test
```

## 技术栈

- **后端**: Hono.js + @hono/node-server + ws (WebSocket)
- **前端**: React 18 + Vite + Tailwind CSS v4
- **编辑器**: TipTap 3 + tiptap-markdown (所见即所得 + 源码模式切换)
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **图标**: lucide-react
- **图表**: Mermaid
- **公式**: KaTeX
- **搜索**: FlexSearch (服务端 ripgrep) + IndexedDB 缓存
- **代码高亮**: lowlight
- **包管理**: pnpm

## 架构概览

### 目录结构

```
src/
├── client/           # 前端 React 应用
│   ├── App.tsx       # 主应用组件（布局、状态管理）
│   ├── main.tsx      # 入口
│   ├── components/   # UI 组件
│   │   ├── ui/       # shadcn/ui 基础组件
│   │   ├── TipTapEditor.tsx   # 主编辑器组件
│   │   ├── FileTree.tsx       # 文件树
│   │   └── ...       # 各种对话框/模态框
│   ├── hooks/        # React hooks
│   │   ├── useFile.ts         # 文件操作（加载/保存）
│   │   ├── useWebSocket.ts    # WebSocket 实时同步
│   │   └── useSearch.ts       # 搜索索引
│   └── lib/          # 工具库
│       ├── types.ts   # 类型定义
│       └── utils.ts   # 工具函数（cn 等）
├── server/           # 后端 Hono 服务
│   ├── index.ts      # 服务器入口
│   ├── app.ts        # Hono 应用创建
│   ├── api.ts        # REST API 路由
│   ├── watcher.ts    # 文件变更监听 + WebSocket 广播
│   └── ignore.ts     # 文件忽略匹配
├── config.ts         # 配置加载（全局 + 用户配置）
└── dev.ts            # 开发模式启动（前后端同时运行）
```

### 前后端通信

- **REST API**: `/api/files` 系列端点处理文件 CRUD、目录管理
- **WebSocket**: `/ws` 连接广播文件变更事件（`file:change`），实现多端实时同步
- **URL 路由**: 使用 hash 格式 `#rootPath:filePath` 定位文件

### 配置加载

- **全局配置**: `~/.colonynote/config.json`（自动创建和合并）
- **项目配置**: 项目目录下的 `colonynote.config.js`
- 配置优先级：项目配置 > 全局配置 > 默认配置
- 敏感文件路径由 `DEFAULT_SENSITIVE_PATHS` 定义，禁止访问

### 核心机制

- **自动保存**: `useFile.updateContent()` 默认 300ms 防抖自动保存
- **外部修改检测**: `pendingSaveSessionsRef` + `SAVE_IGNORE_BUFFER_MS` (5s) 缓冲，避免将自己的保存误判为外部修改
- **文件树**: 按 `dirs` 分组显示，支持多根目录切换，展开状态按目录分别保存

## 编码规范

### 组件

- 使用**函数组件 + React Hooks**，不使用类组件
- 组件文件名使用 PascalCase（如 `EditorToolbar.tsx`）
- Props 接口定义在组件文件内，命名为 `ComponentNameProps`
- 必选属性在前，可选属性（`?`）在后

### Hooks

- 自定义 Hook 以 `use` 开头，camelCase 命名（如 `useFile`）
- 使用 `useCallback` 缓存函数引用
- 使用 `useRef` 存储最新值，避免依赖循环
- Hook 文件放在 `src/client/hooks/` 目录

### API 调用

- API 逻辑封装在自定义 Hook 中（如 `useFile`）
- RESTful 风格：
  - `GET` → 读取
  - `POST` → 创建/保存
  - `PUT` → 更新/重命名/移动
  - `DELETE` → 删除
- 带 root 参数的动态路径构建：
  ```typescript
  const url = dirPath
    ? `/api/files${filePath}?root=${encodeURIComponent(dirPath)}`
    : `/api/files${filePath}`
  ```

### WebSocket

- 全局单例模式（模块级全局变量）
- 支持自动重连（3 秒间隔）
- 消息类型定义在 `WSMessage` 接口中

### 响应式设计

- **移动端优先**：断点为 768px
- 移动端/桌面端判断：`window.innerWidth < 768`
- 使用 `isMobile` state + `useEffect` 监听 resize
- 条件渲染模式：
  ```tsx
  {isMobile && <MobileComponent />}
  {!isMobile && <DesktopComponent />}
  ```
- 或使用 `variant` prop 区分

### 样式

- 使用 Tailwind CSS v4
- 使用 `cn()` 工具函数合并类名（基于 clsx + tailwind-merge）
- 图标统一使用 `lucide-react`，尺寸用 `size-4`、`size-5`

### 类型管理

- 类型定义在 `src/client/lib/types.ts`
- 客户端类型需与服务器端（`src/config.ts`）保持同步
- 使用 JSDoc 注释说明

## Git 提交规范

格式：`<类型>(<范围>): <描述>`

**类型**:
- `feat`: 新功能
- `fix`: 修复 bug
- `refactor`: 重构（非功能变更）
- `style`: 样式调整
- `chore`: 杂项/构建/配置
- `ai`: AI 相关（如添加 skill）

**范围**（可选）: 如 `editor`、`server`、`search` 等

示例：
```
feat(editor): 添加移动端快捷工具栏
fix(editor): 移动端下拉菜单改为向上展开
refactor(editor): 标题按钮改为下拉菜单，节省工具栏空间
```

## 移动端优先原则 ⚠️

本项目是**移动端优先**的 Markdown 在线编辑器。所有功能开发、UI 设计必须：
1. 首先为移动端屏幕（< 768px）设计
2. 再逐步增强到桌面端
3. 移动端/桌面端判断使用 `window.innerWidth < 768`

**移动端特殊处理**:
- 侧边栏：桌面端固定可拖拽（200-600px），移动端 Sheet 抽屉
- 工具栏：桌面端顶部固定，移动端底部固定
- 对话框：桌面端 Dialog，移动端底部 Sheet（85vh）
- 触摸优化：按钮 active 态缩放、safe-area-inset 适配

## 关键设计决策

- 保存时记录会话 ID（`pendingSaveSessionsRef`），避免在网络延迟时将自身的保存误判为外部修改
- 文件树按 `dirs` 分组显示，支持多根目录切换
- 侧边栏宽度可拖拽调整（桌面端），宽度值持久化到 localStorage
- WebSocket 使用全局单例，多个组件共享连接
- 文件保存使用防抖（默认 300ms）
- TipTap editor 内部更新使用 `isInternalUpdateRef` 防止 `onUpdate` 循环触发
- Mermaid 源码编辑使用防抖（800ms）自动渲染，避免频繁调用 render
