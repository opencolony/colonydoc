# Multi-Path Document Root Extension

## TL;DR

> **Quick Summary**: 扩展 ColonyNote 文档根目录功能，从单一启动目录改为支持多个指定目录或文件。用户可通过路径输入添加文档源，带模糊匹配下拉选择，并配置排除规则防止敏感路径被添加。
>
> **Deliverables**:
> - 新增配置结构：`roots: RootConfig[]`（存储于家目录）
> - 后端 API：多路径文件树、路径管理、模糊搜索
> - 前端组件：路径输入带下拉、分组文件树、排除配置面板
> - 文件监视：多路径支持，depth 限制防止 macOS FD exhaustion
> - 安全检查：敏感路径检测 + 嵌套路径阻止
>
> **Estimated Effort**: Large (架构重大扩展)
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Config → Backend API → Frontend UI → Integration

---

## Context

### Original Request

用户原话：
> "现在只支持启动目录作为文档根目录，我想改为可以添加多个指定目录或者文件。可以通过输入路径进行添加，输入的时候会进行模糊匹配，下拉列表出现匹配到的路径，并且可以配置哪些路径会被排除，防止敏感路径被添加。"

### Interview Summary

**Key Discussions**:
- UI 位置：侧边栏顶部（路径输入 + 管理按钮）
- 展示方式：分组显示（每个路径独立 SidebarGroup）
- 排除配置：全局 + 目录级，同一设置面板
- 匹配范围：相对路径从家目录匹配，绝对路径按输入匹配
- 路径类型：绝对路径 + 相对路径都支持
- 路径移除：需要（侧边栏分组旁移除按钮）
- 展开状态：各自独立
- 存储位置：配置文件（家目录 colonynote.user.json）
- 跨路径操作：同路径内移动/重命名，支持复制到其他路径
- 确认交互：点击下拉填充 + Enter 确认
- 敏感路径：内置默认 + 用户可扩展
- 匹配深度：最多 3 层递归
- 向后兼容：不需要（直接升级）
- 嵌套路径：检测并阻止

**Research Findings**:
- 当前 `isAllowed()` 只检查单一 root（api.ts:21-24）
- `walkDirectory()` 需支持多根目录（api.ts:31-73）
- watcher 使用 chokidar 监视单一路径（watcher.ts:10-54）
- FileTree 已有 SidebarGroup 结构可扩展（FileTree.tsx:303-371）
- chokidar macOS 有 FD 限制（~10,500 handles），需设置 depth: 3

### Metis Review

**Identified Gaps** (addressed):
- 向后兼容：用户确认不需要
- 配置位置：家目录 colonynote.user.json
- 嵌套路径：必须检测并阻止
- chokidar depth：必须设置 depth: 3
- 空根目录：显示空状态提示

---

## Work Objectives

### Core Objective

将 ColonyNote 从单一根目录架构扩展为多根目录架构，支持：
1. 通过路径输入 + 模糊匹配添加多个文档目录
2. 分组展示各根目录的文件树
3. 全局 + 目录级排除配置
4. 敏感路径保护 + 嵌套路径检测
5. 同路径内完整文件操作，跨路径仅支持复制

### Concrete Deliverables

- `src/config.ts`: 新增 RootConfig 接口，roots 数组字段
- `src/server/api.ts`: 多路径文件树 API、路径管理 API、模糊搜索 API
- `src/server/watcher.ts`: 多路径监视，depth 限制
- `src/server/ignore.ts`: 多根目录支持
- `src/client/components/PathInput.tsx`: 路径输入 + 模糊下拉组件
- `src/client/components/FileTree.tsx`: 分组展示改造
- `src/client/components/RootSettings.tsx`: 排除配置面板
- `src/client/App.tsx`: 多根状态管理
- `~/.colonynote/colonynote.user.json`: 用户配置存储

### Definition of Done

- [ ] 用户可通过输入框添加多个文档目录（模糊匹配下拉）
- [ ] 文件树分组展示各根目录内容
- [ ] 敏感路径被阻止添加
- [ ] 嵌套路径被检测并阻止
- [ ] 文件操作正常（同路径完整，跨路径仅复制）
- [ ] WebSocket 正常推送所有根目录的文件变更
- [ ] 设置面板可编辑全局 + 目录级排除规则
- [ ] 移动端正常工作
- [ ] `npm run typecheck` 通过

### Must Have

- 多路径文件树 API（GET /api/files 返回分组结构）
- 路径管理 API（POST/DELETE /api/roots）
- 模糊搜索 API（GET /api/roots/search?q=xxx）
- 敏感路径验证（默认列表 + 用户配置）
- 嵌套路径检测（阻止子目录/父目录重叠）
- chokidar depth: 3 限制

### Must NOT Have (Guardrails)

- 跨路径移动/重命名（仅支持复制）
- Root aliases/names/colors/icons（第一迭代排除）
- Root-level ignore patterns（先做全局，目录级可后续）
- Workspace/project 抽象
- Root ordering/priority
- Root templates/presets
- Root statistics/analytics

---

## Verification Strategy

### Test Decision

- **Infrastructure exists**: NO（项目无测试框架）
- **Automated tests**: Agent QA Scenarios（每个任务包含）
- **Framework**: 无单元测试，依赖 Agent 执行 QA

### QA Policy

Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Backend API**: Bash (curl) — Send requests, assert status + response
- **Frontend UI**: Playwright — Navigate, interact, screenshot
- **WebSocket**: Bash + node REPL — Connect, listen, verify messages

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Backend Foundation — config + API core):
├── Task 1: Config structure update [quick]
├── Task 2: Root management API (add/remove/list) [unspecified-high]
├── Task 3: Fuzzy search API [unspecified-high]
├── Task 4: Multi-root file tree API [unspecified-high]
├── Task 5: Sensitive path validation [quick]
└── Task 6: Nested path detection [quick]

Wave 2 (Backend Extension + Frontend Foundation):
├── Task 7: Multi-path watcher with depth limit [unspecified-high]
├── Task 8: WebSocket routing with root context [unspecified-high]
├── Task 9: Path input component with dropdown [visual-engineering]
├── Task 10: FileTree grouped display [visual-engineering]
├── Task 11: Root settings panel [visual-engineering]
└── Task 12: App.tsx state management refactor [unspecified-high]

Wave 3 (Integration + Polish):
├── Task 13: Cross-root copy operation [unspecified-high]
├── Task 14: Error handling for inaccessible roots [unspecified-high]
├── Task 15: Mobile UI verification [visual-engineering]
├── Task 16: Empty root state handling [quick]
└── Task 17: Long path truncation UI [quick]

Wave FINAL (Verification):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay
```

### Dependency Matrix

- **1-6**: No dependencies (Wave 1 parallel)
- **7**: depends on 1, 2
- **8**: depends on 7
- **9**: depends on 3
- **10**: depends on 4
- **11**: depends on 5
- **12**: depends on 9, 10, 11
- **13**: depends on 12
- **14**: depends on 12
- **15**: depends on 12
- **16**: depends on 10
- **17**: depends on 10

### Agent Dispatch Summary

- **Wave 1**: 6 tasks → T1, T5, T6 → `quick`, T2-T4 → `unspecified-high`
- **Wave 2**: 6 tasks → T7-T8 → `unspecified-high`, T9-T11 → `visual-engineering`, T12 → `unspecified-high`
- **Wave 3**: 5 tasks → T13-T14 → `unspecified-high`, T15 → `visual-engineering`, T16-T17 → `quick`
- **FINAL**: 4 tasks → F1 → `oracle`, F2-T3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [x] 1. **Config Structure Update**

  **What to do**:
  - 在 `src/config.ts` 中添加 `RootConfig` 接口定义
  - 修改 `ColonynoteConfig` 接口：将 `root: string` 改为 `roots: RootConfig[]`
  - RootConfig 包含：`path: string`, `exclude?: string[]`, `alias?: string`（可选）
  - 更新 `loadConfig()` 逻辑：从家目录 `~/.colonynote/colonynote.user.json` 加载 roots 配置
  - 更新 `saveUserConfig()` 逻辑：保存 roots 配置到家目录
  - 添加默认 roots：启动目录作为第一个 root（如果配置中没有 roots）
  - 添加敏感路径默认列表常量：`DEFAULT_SENSITIVE_PATHS`

  **Must NOT do**:
  - 不要保留旧的 `root: string` 字段（用户确认不需要向后兼容）
  - 不要添加 root aliases/colors/icons（第一迭代排除）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 配置文件修改，类型定义，逻辑简单
  - **Skills**: []
    - 无特殊技能需求

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2-6)
  - **Blocks**: Tasks 7, 8, 12
  - **Blocked By**: None

  **References**:
  - `src/config.ts:5-23` - 当前 ColonynoteConfig 接口定义位置
  - `src/config.ts:45-106` - loadConfig() 函数逻辑
  - `src/config.ts:108-139` - saveUserConfig() 函数逻辑
  - `src/server/api.ts:21-24` - isAllowed() 使用 config.root，需修改为检查 roots

  **Acceptance Criteria**:
  - [ ] RootConfig 接口已定义：`{ path: string; exclude?: string[] }`
  - [ ] ColonynoteConfig 已更新：`roots: RootConfig[]` 替换 `root: string`
  - [ ] loadConfig() 从 `~/.colonynote/colonynote.user.json` 加载配置
  - [ ] DEFAULT_SENSITIVE_PATHS 常量已定义（包含 `/etc`, `/root`, `/sys`, `/proc`, `~/.ssh`, `~/.gnupg`, `~/.aws`, `.env` 等）

  **QA Scenarios**:

  ```
  Scenario: Config loads roots from home directory
    Tool: Bash (curl)
    Preconditions: Create ~/.colonynote/colonynote.user.json with roots array
    Steps:
      1. mkdir -p ~/.colonynote
      2. echo '{"roots":[{"path":"/tmp/test-root-1"},{"path":"/tmp/test-root-2"}]}' > ~/.colonynote/colonynote.user.json
      3. npm run dev:backend (启动后端)
      4. curl -s http://localhost:5788/api/files/config | jq '.roots'
    Expected Result: Returns array with 2 roots: [{"path":"/tmp/test-root-1"}, {"path":"/tmp/test-root-2"}]
    Failure Indicators: Empty array or error response
    Evidence: .sisyphus/evidence/task-01-config-load.txt

  Scenario: Default root is startup directory when no config
    Tool: Bash (curl)
    Preconditions: Remove ~/.colonynote/colonynote.user.json
    Steps:
      1. rm -f ~/.colonynote/colonynote.user.json
      2. npm run dev:backend
      3. curl -s http://localhost:5788/api/files/config | jq '.roots[0].path'
    Expected Result: Returns the current working directory (process.cwd())
    Failure Indicators: Returns null or empty
    Evidence: .sisyphus/evidence/task-01-default-root.txt
  ```

  **Evidence to Capture**:
  - [ ] curl response showing roots array loaded

  **Commit**: YES (1)
  - Message: `feat(config): add roots array and RootConfig interface`
  - Files: `src/config.ts`
  - Pre-commit: `npm run typecheck`

---

- [x] 2. **Root Management API**

  **What to do**:
  - 在 `src/server/api.ts` 中添加 root 管理 API 路由
  - `GET /api/roots`: 返回当前所有 roots 配置
  - `POST /api/roots`: 添加新 root（带敏感路径验证 + 嵌套路径检测）
  - `DELETE /api/roots`: 移除指定 root（需传入 path 参数）
  - `PATCH /api/roots`: 更新指定 root 的排除规则
  - 添加 `checkSensitivePath(path)` 函数：检查路径是否在敏感列表中
  - 添加 `checkNestedPath(newPath, existingRoots)` 函数：检测嵌套关系
  - 添加后保存配置到家目录

  **Must NOT do**:
  - 不要允许添加敏感路径（返回 400 错误）
  - 不要允许嵌套路径（返回 400 错误）
  - 不要在移除 root 时删除文件（仅移除配置）

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: API 路由设计，安全验证逻辑，需要完整实现
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3-6)
  - **Blocks**: Task 7, 12
  - **Blocked By**: Task 1 (config structure)

  **References**:
  - `src/server/api.ts:75-134` - createFileRouter 函数，添加新路由的位置
  - `src/server/api.ts:21-24` - isAllowed() 函数，需要修改为多路径检查
  - `src/config.ts` - 新的 RootConfig 和 ColonynoteConfig 结构
  - `src/server/ignore.ts:50-60` - IgnoreMatcher 构造，需要适配多 root

  **Acceptance Criteria**:
  - [ ] GET /api/roots 返回 roots 数组
  - [ ] POST /api/roots 成功添加非敏感路径
  - [ ] POST /api/roots 拒绝敏感路径（返回 400）
  - [ ] POST /api/roots 拒绝嵌套路径（返回 400）
  - [ ] DELETE /api/roots 成功移除 root
  - [ ] PATCH /api/roots 成功更新 root 的排除规则

  **QA Scenarios**:

  ```
  Scenario: Add valid root successfully
    Tool: Bash (curl)
    Preconditions: Backend running, create test directory
    Steps:
      1. mkdir -p /tmp/test-root-add
      2. curl -X POST http://localhost:5788/api/roots -H 'Content-Type: application/json' -d '{"path":"/tmp/test-root-add"}'
      3. curl -s http://localhost:5788/api/roots | jq '.roots[] | select(.path == "/tmp/test-root-add")'
    Expected Result: POST returns {success: true, root: {...}}, GET shows the new root
    Failure Indicators: POST returns error or GET shows no matching root
    Evidence: .sisyphus/evidence/task-02-add-root.txt

  Scenario: Reject sensitive path
    Tool: Bash (curl)
    Preconditions: Backend running
    Steps:
      1. curl -w "%{http_code}" -X POST http://localhost:5788/api/roots -H 'Content-Type: application/json' -d '{"path":"/etc"}'
    Expected Result: HTTP status 400, response contains error message about sensitive path
    Failure Indicators: Returns 200 or no error message
    Evidence: .sisyphus/evidence/task-02-sensitive-path.txt

  Scenario: Reject nested path (subdirectory of existing root)
    Tool: Bash (curl)
    Preconditions: Backend running with root /tmp/test-root-existing, subdirectory exists
    Steps:
      1. mkdir -p /tmp/test-root-existing/sub
      2. curl -X POST http://localhost:5788/api/roots -H 'Content-Type: application/json' -d '{"path":"/tmp/test-root-existing"}'
      3. curl -w "%{http_code}" -X POST http://localhost:5788/api/roots -H 'Content-Type: application/json' -d '{"path":"/tmp/test-root-existing/sub"}'
    Expected Result: Second POST returns 400 with nested path error
    Failure Indicators: Returns 200 success
    Evidence: .sisyphus/evidence/task-02-nested-path.txt

  Scenario: Remove root successfully
    Tool: Bash (curl)
    Preconditions: Backend running with root /tmp/test-root-remove
    Steps:
      1. curl -X POST http://localhost:5788/api/roots -H 'Content-Type: application/json' -d '{"path":"/tmp/test-root-remove"}'
      2. curl -X DELETE "http://localhost:5788/api/roots?path=/tmp/test-root-remove"
      3. curl -s http://localhost:5788/api/roots | jq '.roots[] | select(.path == "/tmp/test-root-remove")'
    Expected Result: DELETE returns {success: true}, third query returns null
    Failure Indicators: DELETE returns error or root still exists
    Evidence: .sisyphus/evidence/task-02-remove-root.txt
  ```

  **Evidence to Capture**:
  - [ ] curl responses for add, remove, reject scenarios

  **Commit**: YES (2)
  - Message: `feat(api): add root management endpoints (POST/DELETE/GET /api/roots)`
  - Files: `src/server/api.ts`, `src/config.ts`
  - Pre-commit: `npm run typecheck`

---

- [x] 3. **Fuzzy Search API**

  **What to do**:
  - 在 `src/server/api.ts` 中添加模糊搜索 API
  - `GET /api/roots/search?q=xxx`: 根据输入模糊匹配路径
  - 匹配逻辑：
    - 输入是相对路径 → 从家目录 `~` 开始搜索
    - 输入是绝对路径 → 从输入的路径开始搜索
  - 递归深度限制：最多 3 层
  - 返回匹配路径列表（最多 20 个结果）
  - 使用 minimatch 或类似库进行模糊匹配
  - 排除敏感路径和已忽略的路径

  **Must NOT do**:
  - 不要返回敏感路径（过滤掉）
  - 不要递归超过 3 层（防止性能问题）
  - 不要返回文件（只返回目录）

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 需要实现文件系统遍历、模糊匹配逻辑
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1-2, 4-6)
  - **Blocks**: Task 9 (前端下拉组件)
  - **Blocked By**: Task 1 (config structure)

  **References**:
  - `src/server/api.ts:31-73` - walkDirectory() 函数，可参考遍历逻辑
  - `src/server/ignore.ts` - IgnoreMatcher 类，用于排除路径过滤
  - minimatch 库（已安装）用于模糊匹配

  **Acceptance Criteria**:
  - [ ] GET /api/roots/search?q=proj 返回匹配目录列表
  - [ ] 相对路径从家目录搜索
  - [ ] 绝对路径从指定路径搜索
  - [ ] 递归深度不超过 3 层
  - [ ] 返回最多 20 个结果
  - [ ] 排除敏感路径

  **QA Scenarios**:

  ```
  Scenario: Fuzzy search from home directory
    Tool: Bash (curl)
    Preconditions: Home directory contains projects folder
    Steps:
      1. mkdir -p ~/projects/test-project
      2. curl -s "http://localhost:5788/api/roots/search?q=proj" | jq '.matches | length'
    Expected Result: Returns at least 1 match containing "projects"
    Failure Indicators: Returns empty array or error
    Evidence: .sisyphus/evidence/task-03-fuzzy-search-home.txt

  Scenario: Fuzzy search from absolute path
    Tool: Bash (curl)
    Preconditions: /tmp contains subdirectories with "test" in name
    Steps:
      1. mkdir -p /tmp/test-dir-1 /tmp/test-dir-2
      2. curl -s "http://localhost:5788/api/roots/search?q=/tmp/test" | jq '.matches'
    Expected Result: Returns matches starting with /tmp, including test-dir-1 and test-dir-2
    Failure Indicators: Returns empty or wrong paths
    Evidence: .sisyphus/evidence/task-03-fuzzy-search-abs.txt

  Scenario: Depth limit enforced (max 3 layers)
    Tool: Bash (curl)
    Preconditions: Create deep nested directory structure
    Steps:
      1. mkdir -p /tmp/deep/a/b/c/d/e
      2. curl -s "http://localhost:5788/api/roots/search?q=/tmp/deep" | jq '.matches'
    Expected Result: Returns paths up to depth 3 (/tmp/deep/a/b/c), not deeper
    Failure Indicators: Returns paths deeper than 3 levels
    Evidence: .sisyphus/evidence/task-03-depth-limit.txt
  ```

  **Evidence to Capture**:
  - [ ] Search responses with match lists

  **Commit**: YES (3)
  - Message: `feat(api): add fuzzy path search endpoint`
  - Files: `src/server/api.ts`
  - Pre-commit: `npm run typecheck`

---

- [x] 4. **Multi-Root File Tree API**

  **What to do**:
  - 修改 `GET /api/files` 返回分组结构
  - 响应格式：`{ groups: [{ root: RootConfig, files: FileNode[] }] }`
  - 每个组包含一个 root 的文件树
  - 修改 `walkDirectory()` 支持遍历多个 root
  - 修改 `isAllowed()` 检查路径是否在任意一个 root 内
  - 文件路径相对于各自 root 显示（如 root 为 `/home/user/docs`，文件 `/home/user/docs/readme.md` 显示为 `/readme.md`）
  - FileNode 结构添加 `rootPath: string` 字段标识所属 root

  **Must NOT do**:
  - 不要合并多个 root 的文件树（保持分组）
  - 不要显示绝对路径（使用相对路径）

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 核心 API 重构，影响文件树展示逻辑
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1-3, 5-6)
  - **Blocks**: Task 10 (前端分组展示)
  - **Blocked By**: Task 1 (config structure)

  **References**:
  - `src/server/api.ts:31-73` - walkDirectory() 函数
  - `src/server/api.ts:21-24` - isAllowed() 函数
  - `src/server/api.ts:127-134` - GET /api/files 路由
  - `src/client/components/FileTree.tsx:28-33` - FileNode 接口定义

  **Acceptance Criteria**:
  - [ ] GET /api/files 返回 `{ groups: [...] }` 结构
  - [ ] 每个组包含 root 配置和文件数组
  - [ ] FileNode 包含 rootPath 字段
  - [ ] isAllowed() 检查所有 roots
  - [ ] 文件路径相对于 root 显示

  **QA Scenarios**:

  ```
  Scenario: File tree returns grouped structure
    Tool: Bash (curl)
    Preconditions: Two roots configured with test files
    Steps:
      1. mkdir -p /tmp/root1 /tmp/root2
      2. echo "content1" > /tmp/root1/file1.md
      3. echo "content2" > /tmp/root2/file2.md
      4. curl -X POST http://localhost:5788/api/roots -H 'Content-Type: application/json' -d '{"path":"/tmp/root1"}'
      5. curl -X POST http://localhost:5788/api/roots -H 'Content-Type: application/json' -d '{"path":"/tmp/root2"}'
      6. curl -s http://localhost:5788/api/files | jq '.groups | length'
    Expected Result: Returns 2 (number of groups)
    Failure Indicators: Returns 1 or different structure
    Evidence: .sisyphus/evidence/task-04-grouped-tree.txt

  Scenario: File paths are relative to root
    Tool: Bash (curl)
    Preconditions: Root /tmp/root-rel with nested file
    Steps:
      1. mkdir -p /tmp/root-rel/sub
      2. echo "content" > /tmp/root-rel/sub/nested.md
      3. curl -X POST http://localhost:5788/api/roots -H 'Content-Type: application/json' -d '{"path":"/tmp/root-rel"}'
      4. curl -s http://localhost:5788/api/files | jq '.groups[] | select(.root.path == "/tmp/root-rel") | .files[] | select(.name == "nested.md") | .path'
    Expected Result: Returns "/sub/nested.md" (relative path, not absolute)
    Failure Indicators: Returns absolute path like "/tmp/root-rel/sub/nested.md"
    Evidence: .sisyphus/evidence/task-04-relative-path.txt

  Scenario: isAllowed checks all roots
    Tool: Bash (curl)
    Preconditions: Two roots configured
    Steps:
      1. Configure roots /tmp/root-a and /tmp/root-b
      2. curl -s http://localhost:5788/api/files/root-a/file.md
      3. curl -s http://localhost:5788/api/files/root-b/file.md
      4. curl -s http://localhost:5788/api/files/../../etc/passwd
    Expected Result: First two succeed (200), third fails (403)
    Failure Indicators: Third request returns 200
    Evidence: .sisyphus/evidence/task-04-isallowed.txt
  ```

  **Evidence to Capture**:
  - [ ] Grouped file tree response
  - [ ] Relative path verification

  **Commit**: YES (4)
  - Message: `feat(api): extend file tree for multi-root groups`
  - Files: `src/server/api.ts`
  - Pre-commit: `npm run typecheck`

---

- [x] 5. **Sensitive Path Validation**

  **What to do**:
  - 在 `src/server/api.ts` 中添加敏感路径验证函数
  - `checkSensitivePath(path: string): boolean` - 检查是否为敏感路径
  - 默认敏感路径列表（定义在 config.ts 常量）：
    - `/etc`, `/root`, `/sys`, `/proc`, `/dev`
    - `~/.ssh`, `~/.gnupg`, `~/.aws`, `~/.config`
    - `.env`, `.env.local`, `.env.*`
    - `.git`, `.svn`, `.hg`（VCS 内部目录）
  - 支持 glob 模式匹配（如 `.env*`）
  - 在 POST /api/roots 时调用验证
  - 用户可通过配置扩展敏感路径列表

  **Must NOT do**:
  - 不要硬编码所有路径（使用配置 + 默认列表）
  - 不要阻止用户明确需要的路径（提供覆盖机制）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 安全验证逻辑，函数实现简单
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1-4, 6)
  - **Blocks**: Task 11 (设置面板需要展示)
  - **Blocked By**: Task 1 (DEFAULT_SENSITIVE_PATHS 常量)

  **References**:
  - `src/config.ts` - DEFAULT_SENSITIVE_PATHS 常量位置
  - `src/server/ignore.ts:169-206` - minimatch 匹配逻辑可参考

  **Acceptance Criteria**:
  - [ ] checkSensitivePath() 函数已实现
  - [ ] 默认敏感路径列表已定义
  - [ ] 支持 glob 模式匹配
  - [ ] POST /api/roots 调用验证并拒绝敏感路径

  **QA Scenarios**:

  ```
  Scenario: Block /etc path
    Tool: Bash (curl)
    Preconditions: Backend running
    Steps:
      1. curl -w "%{http_code}" -X POST http://localhost:5788/api/roots -H 'Content-Type: application/json' -d '{"path":"/etc"}'
    Expected Result: HTTP 400, error message contains "sensitive"
    Failure Indicators: Returns 200
    Evidence: .sisyphus/evidence/task-05-block-etc.txt

  Scenario: Block .env file
    Tool: Bash (curl)
    Preconditions: Backend running
    Steps:
      1. curl -w "%{http_code}" -X POST http://localhost:5788/api/roots -H 'Content-Type: application/json' -d '{"path":"/tmp/test/.env"}'
    Expected Result: HTTP 400, error about sensitive path
    Failure Indicators: Returns 200
    Evidence: .sisyphus/evidence/task-05-block-env.txt

  Scenario: Allow non-sensitive path
    Tool: Bash (curl)
    Preconditions: Backend running, valid directory
    Steps:
      1. mkdir -p /tmp/safe-path
      2. curl -w "%{http_code}" -X POST http://localhost:5788/api/roots -H 'Content-Type: application/json' -d '{"path":"/tmp/safe-path"}'
    Expected Result: HTTP 200, {success: true}
    Failure Indicators: Returns 400
    Evidence: .sisyphus/evidence/task-05-allow-safe.txt
  ```

  **Evidence to Capture**:
  - [ ] curl responses for block and allow scenarios

  **Commit**: YES (5)
  - Message: `feat(security): add sensitive path validation`
  - Files: `src/server/api.ts`, `src/config.ts`
  - Pre-commit: `npm run typecheck`

---

- [x] 6. **Nested Path Detection**

  **What to do**:
  - 在 `src/server/api.ts` 中添加嵌套路径检测函数
  - `checkNestedPath(newPath: string, existingRoots: RootConfig[]): { isNested: boolean, conflictWith?: string }`
  - 检测逻辑：
    - newPath 是 existingRoot 的子目录 → 拒绝
    - newPath 是 existingRoot 的父目录 → 拒绝（会包含其他 root）
    - newPath 与 existingRoot 完全相同 → 拒绝（重复）
  - 在 POST /api/roots 时调用检测
  - 返回具体冲突信息（与哪个 root 冲突）

  **Must NOT do**:
  - 不要静默处理嵌套冲突（必须明确拒绝）
  - 不要自动合并嵌套路径

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 路径关系检测逻辑，纯函数实现
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1-5)
  - **Blocks**: Task 2 (Root Management API 依赖)
  - **Blocked By**: Task 1 (RootConfig 结构)

  **References**:
  - `src/server/api.ts:21-24` - isAllowed() 使用 path.resolve，可参考路径处理

  **Acceptance Criteria**:
  - [ ] checkNestedPath() 函数已实现
  - [ ] 检测子目录嵌套
  - [ ] 检测父目录嵌套
  - [ ] 检测重复路径
  - [ ] POST /api/roots 调用检测并返回冲突信息

  **QA Scenarios**:

  ```
  Scenario: Reject subdirectory of existing root
    Tool: Bash (curl)
    Preconditions: Root /tmp/parent configured
    Steps:
      1. mkdir -p /tmp/parent/child
      2. curl -X POST http://localhost:5788/api/roots -H 'Content-Type: application/json' -d '{"path":"/tmp/parent"}'
      3. curl -s -X POST http://localhost:5788/api/roots -H 'Content-Type: application/json' -d '{"path":"/tmp/parent/child"}'
    Expected Result: Third request returns 400 with message about nested under "/tmp/parent"
    Failure Indicators: Returns 200
    Evidence: .sisyphus/evidence/task-06-subdir-nested.txt

  Scenario: Reject parent directory of existing root
    Tool: Bash (curl)
    Preconditions: Root /tmp/parent/child configured
    Steps:
      1. mkdir -p /tmp/parent/child
      2. curl -X POST http://localhost:5788/api/roots -H 'Content-Type: application/json' -d '{"path":"/tmp/parent/child"}'
      3. curl -s -X POST http://localhost:5788/api/roots -H 'Content-Type: application/json' -d '{"path":"/tmp/parent"}'
    Expected Result: Third request returns 400 with message about containing "/tmp/parent/child"
    Failure Indicators: Returns 200
    Evidence: .sisyphus/evidence/task-06-parent-nested.txt

  Scenario: Reject duplicate path
    Tool: Bash (curl)
    Preconditions: Root /tmp/duplicate already configured
    Steps:
      1. curl -X POST http://localhost:5788/api/roots -H 'Content-Type: application/json' -d '{"path":"/tmp/duplicate"}'
      2. curl -s -X POST http://localhost:5788/api/roots -H 'Content-Type: application/json' -d '{"path":"/tmp/duplicate"}'
    Expected Result: Second request returns 400 with message about duplicate
    Failure Indicators: Returns 200
    Evidence: .sisyphus/evidence/task-06-duplicate.txt
  ```

  **Evidence to Capture**:
  - [ ] Nested path rejection responses

  **Commit**: YES (6)
  - Message: `feat(security): add nested path detection`
  - Files: `src/server/api.ts`
  - Pre-commit: `npm run typecheck`

---

- [x] 7. **Multi-Path Watcher with Depth Limit**

  **What to do**:
  - 修改 `src/server/watcher.ts` 支持监视多个路径
  - 使用单个 chokidar 实例，通过 `.add()` 和 `.unwatch()` 动态管理路径
  - 设置 `depth: 3` 限制防止 macOS FD exhaustion
  - 监视配置的 roots 数组而非单一 root
  - 添加 root 变化时的动态监视更新：
    - 新增 root → watcher.add(path)
    - 移除 root → watcher.unwatch(path)
  - 文件变更事件包含 rootPath 标识

  **Must NOT do**:
  - 不要创建多个 chokidar 实例（使用单实例多路径）
  - 不要设置无限 depth（必须限制为 3）
  - 不要监视敏感路径

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: watcher 重构，需要处理动态路径管理
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 8-12)
  - **Blocks**: Task 8 (WebSocket 路由)
  - **Blocked By**: Task 1 (config), Task 2 (root management API)

  **References**:
  - `src/server/watcher.ts:10-54` - setupWatcher 函数
  - `src/server/index.ts:98-108` - watcher 使用位置
  - chokidar 文档：https://github.com/paulmillr/chokidar

  **Acceptance Criteria**:
  - [ ] watcher 监视多个 roots
  - [ ] depth 设置为 3
  - [ ] 动态添加/移除路径
  - [ ] 变更事件包含 rootPath

  **QA Scenarios**:

  ```
  Scenario: Watch multiple roots simultaneously
    Tool: Bash + interactive_bash (tmux)
    Preconditions: Two roots configured
    Steps:
      1. mkdir -p /tmp/watch-root1 /tmp/watch-root2
      2. Configure roots via API
      3. Start backend in tmux
      4. echo "test1" > /tmp/watch-root1/test1.md
      5. echo "test2" > /tmp/watch-root2/test2.md
      6. Check tmux output for WebSocket messages
    Expected Result: Both file changes trigger WebSocket notifications with correct rootPath
    Failure Indicators: Only one notification or missing rootPath
    Evidence: .sisyphus/evidence/task-07-multi-watch.txt

  Scenario: Dynamic add root updates watcher
    Tool: Bash + interactive_bash (tmux)
    Preconditions: Backend running with one root
    Steps:
      1. Start backend with root /tmp/existing
      2. mkdir -p /tmp/new-watched
      3. curl -X POST http://localhost:5788/api/roots -H 'Content-Type: application/json' -d '{"path":"/tmp/new-watched"}'
      4. echo "new" > /tmp/new-watched/new.md
      5. Check tmux output
    Expected Result: WebSocket notification for new.md in /tmp/new-watched
    Failure Indicators: No notification for new root
    Evidence: .sisyphus/evidence/task-07-dynamic-add.txt

  Scenario: Depth limit enforced
    Tool: Bash
    Preconditions: Root with deep nested structure
    Steps:
      1. mkdir -p /tmp/deep-watch/a/b/c/d/e
      2. Configure root /tmp/deep-watch
      3. echo "deep" > /tmp/deep-watch/a/b/c/d/e/deep.md
      4. Check if change is detected
    Expected Result: No notification for file deeper than 3 levels
    Failure Indicators: Notification received for deep file
    Evidence: .sisyphus/evidence/task-07-depth-limit.txt
  ```

  **Evidence to Capture**:
  - [ ] tmux output showing WebSocket messages

  **Commit**: YES (7)
  - Message: `feat(watcher): support multi-path with depth limit`
  - Files: `src/server/watcher.ts`, `src/server/index.ts`
  - Pre-commit: `npm run typecheck`

---

- [x] 8. **WebSocket Routing with Root Context**

  **What to do**:
  - 修改 WebSocket 文件变更消息格式
  - 消息结构：`{ type: 'file:change', event, path, rootPath }`
  - rootPath 标识变更发生在哪个 root
  - 前端可根据 rootPath 更新对应的文件树
  - 修改 `src/server/index.ts` 中的 WebSocket 处理逻辑

  **Must NOT do**:
  - 不要发送没有 rootPath 的消息
  - 不要合并多个 root 的消息

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: WebSocket 消息格式变更，需要前后端协调
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 7, 9-12)
  - **Blocks**: Task 12 (前端状态管理)
  - **Blocked By**: Task 7 (watcher 需要发送 rootPath)

  **References**:
  - `src/server/index.ts:98-108` - WebSocket 消息发送位置
  - `src/client/hooks/useWebSocket.ts` - 前端 WebSocket 处理

  **Acceptance Criteria**:
  - [ ] WebSocket 消息包含 rootPath
  - [ ] 消息格式正确（JSON 结构）
  - [ ] 前端可根据 rootPath 处理

  **QA Scenarios**:

  ```
  Scenario: WebSocket message includes rootPath
    Tool: Bash + interactive_bash (tmux)
    Preconditions: Two roots configured
    Steps:
      1. Configure roots /tmp/ws-root1 and /tmp/ws-root2
      2. Start backend in tmux
      3. Create file in first root: echo "test" > /tmp/ws-root1/test.md
      4. Check tmux output for JSON message
    Expected Result: Message contains { type: 'file:change', path: '/test.md', rootPath: '/tmp/ws-root1', ... }
    Failure Indicators: Message missing rootPath field
    Evidence: .sisyphus/evidence/task-08-ws-rootpath.txt

  Scenario: Different roots send different rootPath
    Tool: Bash + interactive_bash (tmux)
    Preconditions: Two roots configured
    Steps:
      1. Create file in root1
      2. Create file in root2
      3. Check both messages
    Expected Result: Two messages with different rootPath values
    Failure Indicators: Same rootPath for both or missing
    Evidence: .sisyphus/evidence/task-08-ws-different.txt
  ```

  **Evidence to Capture**:
  - [ ] WebSocket message output

  **Commit**: YES (8)
  - Message: `feat(ws): route messages with root context`
  - Files: `src/server/index.ts`, `src/server/watcher.ts`
  - Pre-commit: `npm run typecheck`

---

- [x] 9. **Path Input Component with Dropdown**

  **What to do**:
  - 创建 `src/client/components/PathInput.tsx` 组件
  - 输入框 + 模糊匹配下拉列表
  - 交互流程：
    1. 用户输入路径片段（如 "proj"）
    2. 调用 GET /api/roots/search?q=xxx 获取匹配
    3. 显示下拉列表（最多 20 个选项）
    4. 点击选项填充输入框
    5. Enter 确认添加
  - 添加按钮（+图标）触发输入框显示
  - 移动端适配：触摸友好下拉，可滚动
  - 使用 shadcn/ui 的 Input 和 Popover 组件

  **Must NOT do**:
  - 不要在输入时自动添加（必须 Enter 确认）
  - 不要显示文件（只显示目录）
  - 不要在移动端使用复杂的 hover 效果

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI 组件开发，下拉交互设计，移动端适配
  - **Skills**: [`shadcn-ui`, `frontend-ui-ux`]
    - `shadcn-ui`: 使用 Input、Popover、Command 组件
    - `frontend-ui-ux`: 移动端触摸交互设计

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 7-8, 10-12)
  - **Blocks**: Task 12 (App.tsx 需要集成)
  - **Blocked By**: Task 3 (Fuzzy Search API)

  **References**:
  - `src/client/components/ui/input.tsx` - Input 组件
  - `src/client/components/ui/popover.tsx` - Popover 组件
  - `src/client/components/ui/command.tsx` - Command 组件（下拉搜索）
  - `src/client/components/FileTree.tsx:303-370` - SidebarGroup 结构参考

  **Acceptance Criteria**:
  - [ ] 输入框触发模糊搜索
  - [ ] 下拉列表显示匹配目录
  - [ ] 点击选项填充输入框
  - [ ] Enter 确认添加
  - [ ] 移动端触摸友好

  **QA Scenarios**:

  ```
  Scenario: Input triggers fuzzy search dropdown
    Tool: Playwright
    Preconditions: Backend running, test directories exist
    Steps:
      1. await page.goto('http://localhost:5787')
      2. await page.locator('[data-testid="add-root-btn"]').click()
      3. await page.locator('[data-testid="path-input"]').fill('proj')
      4. await page.waitForSelector('[data-testid="path-dropdown"]')
    Expected Result: Dropdown appears with matching paths
    Failure Indicators: Dropdown not visible
    Evidence: .sisyphus/evidence/task-09-input-dropdown.png

  Scenario: Click dropdown item fills input
    Tool: Playwright
    Preconditions: Dropdown visible with matches
    Steps:
      1. await page.locator('[data-testid="path-input"]').fill('proj')
      2. await page.waitForSelector('[data-testid="path-dropdown-item"]')
      3. const firstItem = await page.locator('[data-testid="path-dropdown-item"]').first()
      4. const itemText = await firstItem.textContent()
      5. await firstItem.click()
      6. const inputValue = await page.locator('[data-testid="path-input"]').inputValue()
    Expected Result: inputValue equals itemText
    Failure Indicators: Input value unchanged
    Evidence: .sisyphus/evidence/task-09-click-fill.png

  Scenario: Enter confirms path addition
    Tool: Playwright
    Preconditions: Input filled with valid path
    Steps:
      1. await page.locator('[data-testid="path-input"]').fill('/tmp/test-enter')
      2. await page.keyboard.press('Enter')
      3. await page.waitForSelector('[data-testid="sidebar-group"]')
      4. const groupCount = await page.locator('[data-testid="sidebar-group"]').count()
    Expected Result: groupCount increases by 1
    Failure Indicators: No new group appears
    Evidence: .sisyphus/evidence/task-09-enter-confirm.png

  Scenario: Mobile touch-friendly dropdown
    Tool: Playwright (mobile viewport 375x667)
    Preconditions: Mobile viewport set
    Steps:
      1. await page.setViewportSize({ width: 375, height: 667 })
      2. await page.goto('http://localhost:5787')
      3. Open sidebar drawer (mobile)
      4. await page.locator('[data-testid="add-root-btn"]').click()
      5. await page.locator('[data-testid="path-input"]').fill('test')
      6. await page.waitForSelector('[data-testid="path-dropdown"]')
      7. Check dropdown scrollability
    Expected Result: Dropdown visible, scrollable, touch targets >= 44px
    Failure Indicators: Dropdown not visible or touch targets too small
    Evidence: .sisyphus/evidence/task-09-mobile-dropdown.png
  ```

  **Evidence to Capture**:
  - [ ] Screenshots of dropdown interaction
  - [ ] Mobile viewport screenshot

  **Commit**: YES (9)
  - Message: `feat(ui): add path input with fuzzy dropdown`
  - Files: `src/client/components/PathInput.tsx`
  - Pre-commit: `npm run typecheck`

---

- [x] 10. **FileTree Grouped Display**

  **What to do**:
  - 修改 `src/client/components/FileTree.tsx` 支持分组展示
  - 接收 `{ groups: [{ root: RootConfig, files: FileNode[] }] }` 数据
  - 每个 root 显示为独立的 SidebarGroup
  - SidebarGroupLabel 显示 root 路径（或路径别名）
  - 每个组有独立的展开状态（使用 `expandedPathsByRoot: Map<string, Set<string>>`）
  - 组头部添加移除按钮（Trash icon）
  - 组头部添加创建文件/文件夹按钮
  - 空组显示 "暂无文件" 状态

  **Must NOT do**:
  - 不要合并多个组的展开状态（各自独立）
  - 不要显示绝对路径（使用 root 名称或相对显示）

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 文件树 UI 重构，分组展示设计
  - **Skills**: [`shadcn-ui`, `frontend-ui-ux`]
    - `shadcn-ui`: SidebarGroup 组件使用
    - `frontend-ui-ux`: 分组布局设计

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 7-9, 11-12)
  - **Blocks**: Task 12 (App.tsx 需要使用), Task 16-17
  - **Blocked By**: Task 4 (Multi-Root File Tree API)

  **References**:
  - `src/client/components/FileTree.tsx:248-380` - 当前 FileTree 组件
  - `src/client/components/ui/sidebar.tsx:113-159` - SidebarGroup 组件
  - `src/client/components/FileTree.tsx:28-33` - FileNode 接口

  **Acceptance Criteria**:
  - [ ] 文件树接收分组数据
  - [ ] 每个 root 显示为 SidebarGroup
  - [ ] 组有独立展开状态
  - [ ] 移除按钮可删除 root
  - [ ] 空组显示提示

  **QA Scenarios**:

  ```
  Scenario: Multiple roots display as separate groups
    Tool: Playwright
    Preconditions: Two roots configured via API
    Steps:
      1. Configure roots /tmp/group1 and /tmp/group2
      2. await page.goto('http://localhost:5787')
      3. const groups = await page.locator('[data-testid="sidebar-group"]')
      4. const count = await groups.count()
    Expected Result: count === 2
    Failure Indicators: count !== 2
    Evidence: .sisyphus/evidence/task-10-grouped-display.png

  Scenario: Each group has independent expand state
    Tool: Playwright
    Preconditions: Two roots with subdirectories
    Steps:
      1. Create /tmp/expand1/sub1 and /tmp/expand2/sub2
      2. Configure both roots
      3. Expand sub1 in first group
      4. Expand sub2 in second group
      5. Collapse sub1 in first group
      6. Check sub2 still expanded in second group
    Expected Result: Second group's expand state unaffected by first group's collapse
    Failure Indicators: Second group also collapsed
    Evidence: .sisyphus/evidence/task-10-independent-expand.png

  Scenario: Remove root button works
    Tool: Playwright
    Preconditions: Multiple roots configured
    Steps:
      1. await page.goto('http://localhost:5787')
      2. const initialCount = await page.locator('[data-testid="sidebar-group"]').count()
      3. await page.locator('[data-testid="remove-root-btn"]').first().click()
      4. const newCount = await page.locator('[data-testid="sidebar-group"]').count()
    Expected Result: newCount = initialCount - 1
    Failure Indicators: Count unchanged
    Evidence: .sisyphus/evidence/task-10-remove-root.png

  Scenario: Empty group shows placeholder
    Tool: Playwright
    Preconditions: Root with no matching files
    Steps:
      1. mkdir -p /tmp/empty-root (no .md files)
      2. Configure root /tmp/empty-root
      3. await page.goto('http://localhost:5787')
      4. Check group shows "暂无文件" or similar
    Expected Result: Empty placeholder visible in the group
    Failure Indicators: Group shows nothing or error
    Evidence: .sisyphus/evidence/task-10-empty-placeholder.png
  ```

  **Evidence to Capture**:
  - [ ] Screenshots of grouped display
  - [ ] Expand/collapse state screenshots

  **Commit**: YES (10)
  - Message: `feat(ui): group file tree by root`
  - Files: `src/client/components/FileTree.tsx`
  - Pre-commit: `npm run typecheck`

---

- [x] 11. **Root Settings Panel**

  **What to do**:
  - 创建 `src/client/components/RootSettings.tsx` 组件
  - 设置面板展示：
    - 全局排除规则（敏感路径列表）
    - 各 root 的排除规则
  - 全局排除：
    - 显示默认敏感路径列表
    - 用户可添加自定义敏感路径
    - 用户可移除敏感路径（但保留硬编码的）
  - Root 级排除：
    - 每个 root 可配置独立的 exclude patterns
    - 显示 root 名称 + 排除规则列表
    - 添加/移除规则
  - 使用 Dialog 或 Sheet 组件作为面板容器
  - 移动端使用 Sheet（从底部滑出）

  **Must NOT do**:
  - 不要允许移除所有硬编码敏感路径（保留 `/etc`, `/root` 等核心）
  - 不要在移动端使用 Dialog（使用 Sheet）

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 设置 UI 设计，表单交互
  - **Skills**: [`shadcn-ui`, `frontend-ui-ux`]
    - `shadcn-ui`: Dialog、Sheet、Input、Button 组件
    - `frontend-ui-ux`: 移动端 Sheet 设计

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 7-10, 12)
  - **Blocks**: Task 12 (App.tsx 需要集成)
  - **Blocked By**: Task 5 (Sensitive path 数据)

  **References**:
  - `src/client/components/ui/dialog.tsx` - Dialog 组件
  - `src/client/components/ui/sheet.tsx` - Sheet 组件
  - `src/server/api.ts:78-84` - GET /api/files/config 返回排除配置
  - `src/server/api.ts:86-125` - PATCH /api/files/config 更新配置

  **Acceptance Criteria**:
  - [ ] 设置面板可打开（Header 设置按钮）
  - [ ] 显示全局敏感路径列表
  - [ ] 显示各 root 排除规则
  - [ ] 可添加/移除排除规则
  - [ ] 移动端使用 Sheet

  **QA Scenarios**:

  ```
  Scenario: Settings panel opens from header
    Tool: Playwright
    Preconditions: Backend running
    Steps:
      1. await page.goto('http://localhost:5787')
      2. await page.locator('[data-testid="settings-btn"]').click()
      3. await page.waitForSelector('[data-testid="root-settings-panel"]')
    Expected Result: Settings panel visible
    Failure Indicators: Panel not found
    Evidence: .sisyphus/evidence/task-11-settings-open.png

  Scenario: Global sensitive paths displayed
    Tool: Playwright
    Preconditions: Settings panel open
    Steps:
      1. Open settings panel
      2. Check [data-testid="global-sensitive-list"] contains items
      3. Verify /etc is in the list
    Expected Result: List contains default sensitive paths like /etc
    Failure Indicators: List empty or /etc missing
    Evidence: .sisyphus/evidence/task-11-sensitive-list.png

  Scenario: Add custom sensitive path
    Tool: Playwright
    Preconditions: Settings panel open
    Steps:
      1. Open settings panel
      2. await page.locator('[data-testid="add-sensitive-input"]').fill('/custom/block')
      3. await page.locator('[data-testid="add-sensitive-btn"]').click()
      4. Check list contains new path
    Expected Result: /custom/block appears in sensitive paths list
    Failure Indicators: New path not in list
    Evidence: .sisyphus/evidence/task-11-add-sensitive.png

  Scenario: Root-level exclude rules displayed
    Tool: Playwright
    Preconditions: Two roots with exclude rules
    Steps:
      1. Configure roots with exclude patterns via API
      2. Open settings panel
      3. Check each root shows its exclude rules
    Expected Result: Each root section shows its patterns
    Failure Indicators: Root sections empty or wrong patterns
    Evidence: .sisyphus/evidence/task-11-root-exclude.png

  Scenario: Mobile uses Sheet not Dialog
    Tool: Playwright (mobile viewport 375x667)
    Preconditions: Mobile viewport
    Steps:
      1. await page.setViewportSize({ width: 375, height: 667 })
      2. await page.goto('http://localhost:5787')
      3. await page.locator('[data-testid="settings-btn"]').click()
      4. Check Sheet component visible (bottom slide-up)
    Expected Result: Sheet visible, not Dialog modal
    Failure Indicators: Dialog modal or nothing visible
    Evidence: .sisyphus/evidence/task-11-mobile-sheet.png
  ```

  **Evidence to Capture**:
  - [ ] Settings panel screenshots
  - [ ] Mobile Sheet screenshot

  **Commit**: YES (11)
  - Message: `feat(ui): add root settings panel`
  - Files: `src/client/components/RootSettings.tsx`
  - Pre-commit: `npm run typecheck`

---

- [x] 12. **App.tsx State Management Refactor**

  **What to do**:
  - 重构 `src/client/App.tsx` 支持多 root 状态
  - 新增状态：
    - `roots: RootConfig[]` - 所有 root 配置
    - `fileGroups: { root: RootConfig, files: FileNode[] }[]` - 分组文件树
    - `expandedByRoot: Map<string, Set<string>>` - 各 root 独立展开状态
  - 修改文件加载逻辑：
    - 当前文件需要知道属于哪个 root
    - 使用 `rootPath + relativePath` 完整标识文件
  - 修改文件操作逻辑：
    - 创建/删除/重命名需要指定 rootPath
    - 移动仅允许同 root 内操作
    - 复制可跨 root
  - WebSocket 处理：
    - 根据 rootPath 更新对应组的文件树
  - 集成 PathInput 和 RootSettings 组件

  **Must NOT do**:
  - 不要破坏现有单 root 的文件操作逻辑
  - 不要在跨 root 移动时静默失败（需明确错误提示）

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 主组件重构，状态管理复杂度高
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 7-11)
  - **Blocks**: Tasks 13-15
  - **Blocked By**: Tasks 9, 10, 11 (需要集成组件)

  **References**:
  - `src/client/App.tsx` - 当前主组件
  - `src/client/hooks/useFile.ts` - 文件 hook
  - `src/client/hooks/useWebSocket.ts` - WebSocket hook

  **Acceptance Criteria**:
  - [ ] roots 状态正确管理
  - [ ] fileGroups 正确加载
  - [ ] 展开状态独立
  - [ ] 文件操作指定 rootPath
  - [ ] WebSocket 更新正确 root 的文件树
  - [ ] PathInput 和 RootSettings 集成

  **QA Scenarios**:

  ```
  Scenario: App loads and displays multiple roots
    Tool: Playwright
    Preconditions: Two roots configured
    Steps:
      1. Configure roots /tmp/app-root1 and /tmp/app-root2
      2. await page.goto('http://localhost:5787')
      3. Check sidebar shows two groups
    Expected Result: Two sidebar groups visible
    Failure Indicators: Only one group or error
    Evidence: .sisyphus/evidence/task-12-app-multi-root.png

  Scenario: File operations use rootPath
    Tool: Playwright
    Preconditions: Root with test file
    Steps:
      1. Configure root /tmp/op-root
      2. Create file test.md in that root
      3. Click file to open in editor
      4. Edit content
      5. Check save works
    Expected Result: File saved successfully in correct root
    Failure Indicators: Save error or wrong location
    Evidence: .sisyphus/evidence/task-12-file-ops.png

  Scenario: WebSocket updates correct root group
    Tool: Playwright + interactive_bash
    Preconditions: Two roots, backend running
    Steps:
      1. Configure two roots
      2. await page.goto('http://localhost:5787')
      3. In tmux, create new file in first root
      4. Check first root's group updates in UI
      5. Create file in second root
      6. Check second root's group updates
    Expected Result: Each root's group updates independently
    Failure Indicators: Wrong group updates or no update
    Evidence: .sisyphus/evidence/task-12-ws-update.png

  Scenario: PathInput integrated in sidebar
    Tool: Playwright
    Preconditions: App loaded
    Steps:
      1. await page.goto('http://localhost:5787')
      2. Check [data-testid="add-root-btn"] visible
      3. Click to show PathInput
    Expected Result: PathInput component visible
    Failure Indicators: Button or input not found
    Evidence: .sisyphus/evidence/task-12-pathinput.png

  Scenario: RootSettings integrated in header
    Tool: Playwright
    Preconditions: App loaded
    Steps:
      1. await page.goto('http://localhost:5787')
      2. Check settings button visible
      3. Click to open RootSettings panel
    Expected Result: Settings panel visible
    Failure Indicators: Button or panel not found
    Evidence: .sisyphus/evidence/task-12-settings.png
  ```

  **Evidence to Capture**:
  - [ ] App state screenshots
  - [ ] WebSocket update demonstration

  **Commit**: YES (12)
  - Message: `feat(state): refactor App.tsx for multi-root`
  - Files: `src/client/App.tsx`
  - Pre-commit: `npm run typecheck`

---

- [x] 13. **Cross-Root Copy Operation**

  **What to do**:
  - 在后端 API 中添加跨 root 复制功能
  - `POST /api/files/copy`: `{ sourceRoot, sourcePath, targetRoot, targetPath }`
  - 复制逻辑：
    - 文件复制：直接复制内容
    - 目录复制：递归复制所有内容
  - 名称冲突处理：自动添加 `(copy)` 或 `(1)` 后缀
  - 前端 UI：在 FileItemMenu 中添加 "复制到..." 选项
  - 显示 root 选择对话框让用户选择目标 root

  **Must NOT do**:
  - 不要实现跨 root 移动（仅复制）
  - 不要覆盖已存在的文件（自动重命名）

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 跨 root 操作逻辑，需要前后端配合
  - **Skills**: [`shadcn-ui`]
    - `shadcn-ui`: 选择对话框组件

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 14-17)
  - **Blocks**: None
  - **Blocked By**: Task 12 (App.tsx 状态管理)

  **References**:
  - `src/server/api.ts:196-242` - POST 文件创建逻辑可参考
  - `src/client/components/FileItemMenu.tsx` - 文件操作菜单
  - `src/client/components/ui/dialog.tsx` - Dialog 组件

  **Acceptance Criteria**:
  - [ ] POST /api/files/copy API 已实现
  - [ ] 文件复制正常工作
  - [ ] 目录复制正常工作（递归）
  - [ ] 名称冲突自动处理
  - [ ] 前端菜单有 "复制到" 选项
  - [ ] root 选择对话框正常

  **QA Scenarios**:

  ```
  Scenario: Copy file to another root
    Tool: Bash (curl)
    Preconditions: Two roots with test file
    Steps:
      1. Configure roots /tmp/copy-src and /tmp/copy-target
      2. echo "original" > /tmp/copy-src/original.md
      3. curl -X POST http://localhost:5788/api/files/copy -H 'Content-Type: application/json' -d '{"sourceRoot":"/tmp/copy-src","sourcePath":"/original.md","targetRoot":"/tmp/copy-target","targetPath":"/copied.md"}'
      4. cat /tmp/copy-target/copied.md
    Expected Result: File content matches "original"
    Failure Indicators: Copy fails or content mismatch
    Evidence: .sisyphus/evidence/task-13-copy-file.txt

  Scenario: Copy directory recursively
    Tool: Bash (curl)
    Preconditions: Source root with nested directory
    Steps:
      1. mkdir -p /tmp/copy-dir-src/sub/nested
      2. echo "nested" > /tmp/copy-dir-src/sub/nested/file.md
      3. curl -X POST http://localhost:5788/api/files/copy -H 'Content-Type: application/json' -d '{"sourceRoot":"/tmp/copy-dir-src","sourcePath":"/sub","targetRoot":"/tmp/copy-dir-target","targetPath":"/copied-sub"}'
      4. cat /tmp/copy-dir-target/copied-sub/nested/file.md
    Expected Result: Nested file content preserved
    Failure Indicators: Missing nested structure
    Evidence: .sisyphus/evidence/task-13-copy-dir.txt

  Scenario: Name conflict auto-renamed
    Tool: Bash (curl)
    Preconditions: Target has existing file with same name
    Steps:
      1. echo "existing" > /tmp/conflict-target/existing.md
      2. echo "new" > /tmp/conflict-src/existing.md
      3. curl -X POST http://localhost:5788/api/files/copy -H 'Content-Type: application/json' -d '{"sourceRoot":"/tmp/conflict-src","sourcePath":"/existing.md","targetRoot":"/tmp/conflict-target","targetPath":"/existing.md"}'
      4. ls /tmp/conflict-target/
    Expected Result: Contains existing.md and existing (1).md or similar
    Failure Indicators: Overwrites existing file
    Evidence: .sisyphus/evidence/task-13-conflict.txt

  Scenario: UI shows copy option
    Tool: Playwright
    Preconditions: File exists in a root
    Steps:
      1. await page.goto('http://localhost:5787')
      2. Click file menu (MoreHorizontal icon)
      3. Check "复制到..." option visible
    Expected Result: Copy option in menu
    Failure Indicators: Option not visible
    Evidence: .sisyphus/evidence/task-13-ui-copy.png

  Scenario: Root selection dialog works
    Tool: Playwright
    Preconditions: Multiple roots, copy option clicked
    Steps:
      1. Click copy option on file
      2. await page.waitForSelector('[data-testid="root-select-dialog"]')
      3. Select target root
      4. Confirm copy
      5. Check target root's file tree updates
    Expected Result: File appears in target root
    Failure Indicators: Dialog not shown or copy fails
    Evidence: .sisyphus/evidence/task-13-root-select.png
  ```

  **Evidence to Capture**:
  - [ ] curl copy responses
  - [ ] UI copy flow screenshots

  **Commit**: YES (13)
  - Message: `feat(api): add cross-root copy operation`
  - Files: `src/server/api.ts`, `src/client/components/FileItemMenu.tsx`
  - Pre-commit: `npm run typecheck`

---

- [x] 14. **Error Handling for Inaccessible Roots**

  **What to do**:
  - 处理 root 目录无法访问的情况
  - 场景：目录不存在、权限不足、网络驱动离线
  - 后端检测：
    - 在 walkDirectory 时捕获错误
    - 返回 `{ error: 'inaccessible', reason: string }`
  - 前端显示：
    - 在 SidebarGroup 显示错误图标和状态
    - 提供 "重新连接" 或 "移除" 选项
  - 定期重试检测（可选）

  **Must NOT do**:
  - 不要静默跳过错误 root（必须显示错误状态）
  - 不要自动移除用户配置的 root

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 错误处理逻辑，前后端状态同步
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 13, 15-17)
  - **Blocks**: None
  - **Blocked By**: Task 12 (App.tsx 需要展示错误状态)

  **References**:
  - `src/server/api.ts:62-64` - walkDirectory catch 错误处理
  - `src/client/components/FileTree.tsx:241-246` - EMPTY_STATE 可参考

  **Acceptance Criteria**:
  - [ ] 后端检测并报告 inaccessible root
  - [ ] 前端显示错误状态图标
  - [ ] 提供重新连接选项
  - [ ] 提供移除选项

  **QA Scenarios**:

  ```
  Scenario: Root directory deleted externally
    Tool: Bash
    Preconditions: Root configured, then deleted
    Steps:
      1. Configure root /tmp/missing-root
      2. rm -rf /tmp/missing-root
      3. curl -s http://localhost:5788/api/files | jq '.groups[] | select(.root.path == "/tmp/missing-root")'
    Expected Result: Group shows error status or empty files with error flag
    Failure Indicators: Returns error 500 or crashes
    Evidence: .sisyphus/evidence/task-14-deleted-root.txt

  Scenario: Permission denied root
    Tool: Bash
    Preconditions: Root with no read permission
    Steps:
      1. mkdir -p /tmp/no-perm-root
      2. chmod 000 /tmp/no-perm-root
      3. Configure root /tmp/no-perm-root
      4. curl -s http://localhost:5788/api/files | jq '.groups[] | select(.root.path == "/tmp/no-perm-root")'
    Expected Result: Group shows permission error status
    Failure Indicators: Returns 500 error
    Evidence: .sisyphus/evidence/task-14-perm-denied.txt

  Scenario: UI shows error icon
    Tool: Playwright
    Preconditions: Inaccessible root configured
    Steps:
      1. Configure inaccessible root
      2. await page.goto('http://localhost:5787')
      3. Check group shows error icon/warning
    Expected Result: Error indicator visible in the group
    Failure Indicators: No error shown
    Evidence: .sisyphus/evidence/task-14-ui-error.png

  Scenario: Remove option for error root
    Tool: Playwright
    Preconditions: Error root displayed
    Steps:
      1. Click error root's remove button
      2. Confirm removal
      3. Check root removed from list
    Expected Result: Root removed after confirmation
    Failure Indicators: Remove fails or root persists
    Evidence: .sisyphus/evidence/task-14-remove-error.png
  ```

  **Evidence to Capture**:
  - [ ] Error state screenshots
  - [ ] curl responses showing error handling

  **Commit**: YES (14)
  - Message: `feat(error): handle inaccessible roots`
  - Files: `src/server/api.ts`, `src/client/components/FileTree.tsx`
  - Pre-commit: `npm run typecheck`

---

- [x] 15. **Mobile UI Verification**

  **What to do**:
  - 验证所有 UI 在移动端正常工作
  - 测试 viewport: 375x667（iPhone 标准）
  - 检查项目：
    - 侧边栏 Drawer 正常打开/关闭
    - 路径输入下拉触摸友好
    - 文件树分组滚动正常
    - 设置面板 Sheet 正常
    - 文件编辑器正常
    - 所有触摸目标 >= 44px
  - 修复发现的问题

  **Must NOT do**:
  - 不要使用固定宽度（必须响应式）
  - 不要使用 hover 效果（移动端无效）

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 移动端 UI 验证和修复
  - **Skills**: [`frontend-ui-ux`, `playwright`]
    - `frontend-ui-ux`: 移动端设计模式
    - `playwright`: 移动端测试

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 13-14, 16-17)
  - **Blocks**: None
  - **Blocked By**: Task 12 (完整 UI 实现)

  **References**:
  - AGENTS.md - "移动端优先设计" 规范
  - `src/client/App.tsx` - isMobile 状态处理
  - `src/client/components/ui/sheet.tsx` - Sheet 组件

  **Acceptance Criteria**:
  - [ ] 所有 UI 在 375x667 viewport 正常
  - [ ] 触摸目标 >= 44px
  - [ ] Drawer/Sheet 正常工作
  - [ ] 无 hover 依赖

  **QA Scenarios**:

  ```
  Scenario: Full mobile flow verification
    Tool: Playwright (viewport 375x667)
    Preconditions: Mobile viewport, multiple roots configured
    Steps:
      1. await page.setViewportSize({ width: 375, height: 667 })
      2. await page.goto('http://localhost:5787')
      3. Open sidebar drawer
      4. Check grouped file tree scrollable
      5. Add new root via PathInput
      6. Open settings Sheet
      7. Edit exclusion rules
      8. Close and open file
      9. Edit content
    Expected Result: All actions work on mobile
    Failure Indicators: Any action fails or UI breaks
    Evidence: .sisyphus/evidence/task-15-mobile-full.png

  Scenario: Touch targets meet 44px minimum
    Tool: Playwright (viewport 375x667)
    Preconditions: Mobile viewport
    Steps:
      1. await page.setViewportSize({ width: 375, height: 667 })
      2. await page.goto('http://localhost:5787')
      3. Measure button sizes
      4. Check all touch targets >= 44px
    Expected Result: All touch targets meet minimum size
    Failure Indicators: Any target < 44px
    Evidence: .sisyphus/evidence/task-15-touch-size.png

  Scenario: Drawer closes on file selection
    Tool: Playwright (viewport 375x667)
    Preconditions: Mobile viewport, drawer open
    Steps:
      1. Open sidebar drawer on mobile
      2. Click a file to select
      3. Check drawer auto-closes
    Expected Result: Drawer closes after file selection
    Failure Indicators: Drawer stays open
    Evidence: .sisyphus/evidence/task-15-drawer-close.png

  Scenario: Path dropdown scrollable on mobile
    Tool: Playwright (viewport 375x667)
    Preconditions: Mobile viewport, many search results
    Steps:
      1. await page.setViewportSize({ width: 375, height: 667 })
      2. Open PathInput
      3. Enter search term with many results
      4. Check dropdown scrollable
    Expected Result: Dropdown scrollable, not cut off
    Failure Indicators: Dropdown not scrollable or overflow hidden
    Evidence: .sisyphus/evidence/task-15-dropdown-scroll.png
  ```

  **Evidence to Capture**:
  - [ ] Full mobile flow screenshots
  - [ ] Touch target measurements

  **Commit**: YES (15)
  - Message: `feat(mobile): verify mobile UI`
  - Files: 相关 UI 组件
  - Pre-commit: `npm run typecheck`

---

- [x] 16. **Empty Root State Handling**

  **What to do**:
  - 优化空 root 的显示状态
  - 当 root 目录为空或无匹配文件时：
    - 显示友好提示："此目录暂无 Markdown 文件"
    - 提供快速创建选项："创建第一个文件"
  - 视觉设计：使用图标 + 文字，类似当前 EMPTY_STATE

  **Must NOT do**:
  - 不要隐藏空 root（必须显示）
  - 不要使用错误样式（使用 neutral/placeholder 样式）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 状态提示 UI，简单实现
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: 空状态设计

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 13-15, 17)
  - **Blocks**: None
  - **Blocked By**: Task 10 (FileTree 分组)

  **References**:
  - `src/client/components/FileTree.tsx:241-246` - EMPTY_STATE 参考样式

  **Acceptance Criteria**:
  - [ ] 空 root 显示提示文字
  - [ ] 提供快速创建按钮
  - [ ] 样式友好（不似错误）

  **QA Scenarios**:

  ```
  Scenario: Empty root shows placeholder
    Tool: Playwright
    Preconditions: Empty root configured
    Steps:
      1. mkdir -p /tmp/empty-placeholder (no files)
      2. Configure root /tmp/empty-placeholder
      3. await page.goto('http://localhost:5787')
      4. Check group shows "暂无文件" or similar
    Expected Result: Placeholder visible in empty group
    Failure Indicators: Group empty or error
    Evidence: .sisyphus/evidence/task-16-empty-placeholder.png

  Scenario: Quick create button works
    Tool: Playwright
    Preconditions: Empty root displayed
    Steps:
      1. Locate empty root group
      2. Click "创建第一个文件" button
      3. Enter filename
      4. Submit
      5. Check file appears in group
    Expected Result: New file created and displayed
    Failure Indicators: Create fails or file not shown
    Evidence: .sisyphus/evidence/task-16-quick-create.png
  ```

  **Evidence to Capture**:
  - [ ] Empty state screenshots
  - [ ] Quick create flow screenshots

  **Commit**: YES (16)
  - Message: `feat(ui): handle empty root state`
  - Files: `src/client/components/FileTree.tsx`
  - Pre-commit: `npm run typecheck`

---

- [x] 17. **Long Path Truncation UI**

  **What to do**:
  - 处理超长 root 路径的显示
  - SidebarGroupLabel 中路径过长时截断
  - 截断策略：显示开头 + ... + 结尾
  - 例如：`/home/user/very/long/deeply/nested/path` → `/home/...nested/path`
  - Tooltip 显示完整路径（hover 或点击）
  - 移动端适配：更短的截断长度

  **Must NOT do**:
  - 不要显示完整超长路径（破坏布局）
  - 不要使用固定截断位置（智能截断）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 文本截断和 Tooltip 实现
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 13-16)
  - **Blocks**: None
  - **Blocked By**: Task 10 (FileTree 分组)

  **References**:
  - `src/client/components/ui/tooltip.tsx` - Tooltip 组件
  - `src/client/components/FileTree.tsx:305` - SidebarGroupLabel

  **Acceptance Criteria**:
  - [ ] 超长路径截断显示
  - [ ] Tooltip 显示完整路径
  - [ ] 移动端更短截断

  **QA Scenarios**:

  ```
  Scenario: Long path truncated in sidebar
    Tool: Playwright
    Preconditions: Root with very long path
    Steps:
      1. Configure root /home/user/very/long/deeply/nested/directory/path
      2. await page.goto('http://localhost:5787')
      3. Check SidebarGroupLabel text
    Expected Result: Label shows truncated version like "/home/...path"
    Failure Indicators: Shows full path or no truncation
    Evidence: .sisyphus/evidence/task-17-long-path.png

  Scenario: Tooltip shows full path
    Tool: Playwright
    Preconditions: Long truncated path visible
    Steps:
      1. Hover over truncated path label (desktop)
      2. Check Tooltip appears with full path
      3. Or click label on mobile to show full path
    Expected Result: Tooltip contains complete path
    Failure Indicators: Tooltip missing or shows truncated path
    Evidence: .sisyphus/evidence/task-17-tooltip.png

  Scenario: Mobile shorter truncation
    Tool: Playwright (viewport 375x667)
    Preconditions: Mobile viewport, long path
    Steps:
      1. await page.setViewportSize({ width: 375, height: 667 })
      2. await page.goto('http://localhost:5787')
      3. Check label truncation length
    Expected Result: Truncation shorter than desktop (more aggressive)
    Failure Indicators: Same truncation as desktop
    Evidence: .sisyphus/evidence/task-17-mobile-trunc.png
  ```

  **Evidence to Capture**:
  - [ ] Long path screenshots
  - [ ] Tooltip screenshots

  **Commit**: YES (17)
  - Message: `feat(ui): truncate long root paths`
  - Files: `src/client/components/FileTree.tsx`
  - Pre-commit: `npm run typecheck`

---

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists. For each "Must NOT Have": search codebase for forbidden patterns. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Run `tsc --noEmit`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, unused imports. Check AI slop: excessive comments, over-abstraction.
  Output: `Build [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high` (+ playwright)
  Start from clean state. Execute EVERY QA scenario from EVERY task. Test cross-task integration. Test edge cases. Save evidence to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff. Verify 1:1 — everything in spec was built, nothing beyond spec was built. Check "Must NOT do" compliance.
  Output: `Tasks [N/N compliant] | VERDICT`

---

## Commit Strategy

- **1**: `feat(config): add roots array and RootConfig interface`
- **2**: `feat(api): add root management endpoints (POST/DELETE/GET /api/roots)`
- **3**: `feat(api): add fuzzy path search endpoint`
- **4**: `feat(api): extend file tree for multi-root groups`
- **5**: `feat(security): add sensitive path validation`
- **6**: `feat(security): add nested path detection`
- **7**: `feat(watcher): support multi-path with depth limit`
- **8**: `feat(ws): route messages with root context`
- **9**: `feat(ui): add path input with fuzzy dropdown`
- **10**: `feat(ui): group file tree by root`
- **11**: `feat(ui): add root settings panel`
- **12**: `feat(state): refactor App.tsx for multi-root`
- **13**: `feat(api): add cross-root copy operation`
- **14**: `feat(error): handle inaccessible roots`
- **15**: `feat(mobile): verify mobile UI`
- **16**: `feat(ui): handle empty root state`
- **17**: `feat(ui): truncate long root paths`

---

## Success Criteria

### Verification Commands

```bash
# 1. Config loads roots
curl -s http://localhost:5788/api/files/config | jq '.roots'

# 2. File tree returns grouped structure
curl -s http://localhost:5788/api/files | jq '.groups | length'

# 3. Root management works
curl -X POST http://localhost:5788/api/roots -H 'Content-Type: application/json' -d '{"path":"/tmp/test-root"}'
curl -X DELETE http://localhost:5788/api/roots?path=/tmp/test-root

# 4. Fuzzy search returns matches
curl -s "http://localhost:5788/api/roots/search?q=proj" | jq '.matches'

# 5. Sensitive path blocked
curl -X POST http://localhost:5788/api/roots -H 'Content-Type: application/json' -d '{"path":"/etc"}'
# Expected: 400 error

# 6. TypeScript passes
npm run typecheck
# Expected: no errors
```

### Final Checklist

- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All QA scenarios pass
- [ ] Mobile UI works
- [ ] WebSocket notifications work for all roots