# 修复忽略设置对搜索不生效的问题

## TL;DR

> **Quick Summary**: 修复"打开项目"搜索功能不遵守全局忽略模式的问题。在 `/dirs/search` 端点的 traverse 函数中添加 minimatch 模式匹配，使 `node_modules/` 等全局忽略模式生效。同时简化设置 UI，移除 .colonynoteignore 和 .gitignore 支持。
> 
> **Deliverables**:
> - 修改 `src/server/api.ts` traverse 函数，添加忽略模式检查
> - 简化 `SettingsDialog.tsx`，移除 ignore 文件名设置
> - 更新配置类型定义
> 
> **Estimated Effort**: Quick
> **Parallel Execution**: NO - 顺序依赖
> **Critical Path**: 后端搜索修改 → 前端 UI 简化 → 验证

---

## Context

### Original Request
用户设置了 `node_modules/` 全局忽略模式，但在"打开项目"搜索中仍然显示 `node_modules` 目录。

### Root Cause
`/dirs/search` 端点的 `traverse()` 函数完全没有使用忽略系统，只过滤了隐藏文件和敏感路径。

### User Decisions
- **仅支持全局忽略模式**（移除 .colonynoteignore 和 .gitignore 支持）
- **完整路径匹配**（检查完整路径是否匹配模式）

### 忽略规则应用状态（探索结果）

| 位置 | 状态 | 说明 |
|------|------|------|
| 侧边栏 (walkDirectory) | ✅ 已正常 | `matcher.isIgnored()` 在遍历时过滤 |
| 添加项目搜索 (/dirs/search) | ❌ 需要修复 | traverse 函数未应用忽略规则 |
| 全局内容搜索 | ✅ 间接正常 | 索引基于已过滤的文件树 |

---

## Work Objectives

### Core Objective
使全局忽略模式在"打开项目"搜索中生效。

### Concrete Deliverables
- `src/server/api.ts` - traverse 函数添加 minimatch 检查
- `src/client/components/SettingsDialog.tsx` - 简化忽略设置 UI
- `src/config.ts` - 更新配置类型（如需要）

### Definition of Done
- [ ] 设置 `node_modules/` 后，搜索不再显示 `node_modules` 目录
- [ ] 设置 `*.log` 后，搜索不再显示 `.log` 文件/目录
- [ ] 设置 UI 简化，只显示全局忽略模式
- [ ] 类型检查通过

### Must Have
- 全局忽略模式在搜索中生效
- 完整路径匹配
- 向后兼容（不影响现有功能）

### Must NOT Have (Guardrails)
- **不添加** .colonynoteignore 或 .gitignore 支持
- **不修改** walkDirectory 函数（已正确工作）
- **不修改** 全局内容搜索（已间接正常工作）
- **不改变** 敏感路径过滤逻辑

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (Vitest)
- **Automated tests**: YES (TDD)
- **Framework**: Vitest

### QA Policy
每个任务包含 agent-executed QA 场景。

---

## Execution Strategy

### Sequential Execution

```
Wave 1 (后端修改):
├── Task 1: 修改 traverse 函数添加忽略检查 [quick]
└── Task 2: 编写 traverse 忽略逻辑测试 [quick]

Wave 2 (前端简化):
├── Task 3: 简化 SettingsDialog 忽略设置 UI [quick]
└── Task 4: 更新配置类型定义 [quick]

Wave 3 (验证):
└── Task 5: 端到端验证 [quick]
```

---

## TODOs

### Wave 1: 后端修改

- [x] 1. 修改 traverse 函数添加忽略检查

  **What to do**:
  - 在 `src/server/api.ts` 的 `traverse()` 函数中添加忽略检查
  - 使用 `minimatch` 库检查路径是否匹配全局忽略模式
  - 修改位置：第 307-328 行
  
  **Implementation**:
  ```typescript
  // 在 traverse 函数内部，添加目录到 candidates 之前：
  const isIgnored = config.ignore?.patterns?.some(pattern => 
    minimatch(fullPath, pattern, { dot: true })
  )
  if (isIgnored) continue
  ```

  **Must NOT do**:
  - 不修改 walkDirectory 函数
  - 不添加 .gitignore 或 .colonynoteignore 支持

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Task 2, Task 3

  **References**:
  - `src/server/api.ts:307-328` - traverse 函数
  - `src/server/api.ts:9` - minimatch import (已存在)
  - `src/config.ts:25-29` - ignore.patterns 配置

  **Acceptance Criteria**:
  - [ ] 设置 `node_modules/` 后，搜索不返回 node_modules 目录
  - [ ] 设置 `*.log` 后，搜索不返回 .log 文件

  **QA Scenarios**:
  ```
  Scenario: node_modules 被正确过滤
    Tool: Bash (curl)
    Steps:
      1. 设置全局忽略模式为 ["node_modules/"]
      2. curl "http://localhost:5787/api/files/dirs/search?q=axios&root=~&mode=fuzzy"
      3. 验证结果中不包含 node_modules 路径
    Expected Result: 搜索结果不包含 node_modules 目录
    Evidence: .sisyphus/evidence/task-1-node-modules-filtered.json

  Scenario: *.log 模式被正确过滤
    Tool: Bash (curl)
    Steps:
      1. 设置全局忽略模式为 ["*.log"]
      2. curl "http://localhost:5787/api/files/dirs/search?q=log&root=~&mode=fuzzy"
      3. 验证结果中不包含 .log 文件
    Expected Result: 搜索结果不包含 .log 文件
    Evidence: .sisyphus/evidence/task-1-log-filtered.json
  ```

  **Commit**: YES
  - Message: `fix: apply global ignore patterns to directory search`
  - Files: `src/server/api.ts`

---

- [x] 2. 编写 traverse 忽略逻辑测试

  **What to do**:
  - 创建 `src/server/search-ignore.test.ts` 测试文件
  - 测试各种忽略模式：
    - `node_modules/` 过滤目录
    - `*.log` 过滤文件
    - `**/test/**` 过滤嵌套路径
    - 空模式不过滤

  **Must NOT do**:
  - 不测试整个 API 路由，只测试忽略逻辑

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Task 1

  **Acceptance Criteria**:
  - [ ] `bun test src/server/search-ignore.test.ts` → 通过

  **QA Scenarios**:
  ```
  Scenario: 忽略逻辑单元测试
    Tool: Bash
    Steps:
      1. bun test src/server/search-ignore.test.ts --run
    Expected Result: 所有测试通过
    Evidence: .sisyphus/evidence/task-2-unit-tests.log
  ```

  **Commit**: YES (可与 Task 1 合并)
  - Message: `test: add tests for search ignore patterns`
  - Files: `src/server/search-ignore.test.ts`

---

### Wave 2: 前端简化

- [ ] 3. 简化 SettingsDialog 忽略设置 UI

  **What to do**:
  - 修改 `src/client/components/SettingsDialog.tsx`
  - 移除"启用忽略文件"开关
  - 移除"忽略文件名"输入框
  - 保留"全局忽略模式"文本域
  - 更新相关标签和说明文字

  **Must NOT do**:
  - 不修改其他设置项
  - 不改变设置保存逻辑

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Task 1

  **References**:
  - `src/client/components/SettingsDialog.tsx` - 忽略设置部分

  **Acceptance Criteria**:
  - [ ] 设置对话框只显示"全局忽略模式"
  - [ ] 设置保存功能正常

  **QA Scenarios**:
  ```
  Scenario: 设置 UI 简化验证
    Tool: chrome-devtools
    Preconditions: 前端运行在 localhost:5787
    Steps:
      1. 打开设置对话框
      2. 验证只显示"全局忽略模式"文本域
      3. 输入 "node_modules/" 并保存
      4. 刷新页面，验证设置保留
    Expected Result: UI 简化，设置正常保存
    Evidence: .sisyphus/evidence/task-3-settings-ui.png
  ```

  **Commit**: YES
  - Message: `feat: simplify ignore settings UI`
  - Files: `src/client/components/SettingsDialog.tsx`

---

- [ ] 4. 更新配置类型定义

  **What to do**:
  - 检查 `src/config.ts` 中的配置类型
  - 移除 `ignore.files` 相关字段（如存在）
  - 确保 `ignore.patterns` 类型正确

  **Must NOT do**:
  - 不破坏现有配置兼容性

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Task 3

  **References**:
  - `src/config.ts:25-29` - ignore 配置定义

  **Acceptance Criteria**:
  - [ ] `npm run typecheck` 无错误
  - [ ] 配置类型与 UI 一致

  **QA Scenarios**:
  ```
  Scenario: 类型检查通过
    Tool: Bash
    Steps:
      1. npm run typecheck
    Expected Result: 0 errors
    Evidence: .sisyphus/evidence/task-4-typecheck.log
  ```

  **Commit**: YES (可与 Task 3 合并)
  - Message: `chore: update ignore config types`
  - Files: `src/config.ts`

---

### Wave 3: 验证

- [ ] 5. 端到端验证

  **What to do**:
  - 运行 `npm run typecheck`
  - 使用 Chrome DevTools 测试完整流程：
    1. 打开设置，输入 `node_modules/`
    2. 保存设置
    3. 打开"添加项目"对话框
    4. 搜索 `axios`
    5. 验证结果中不包含 `node_modules`
  - 测试其他模式：`*.log`, `**/test/**`

  **Must NOT do**:
  - 不添加新功能

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Task 2, Task 4

  **Acceptance Criteria**:
  - [ ] 类型检查通过
  - [ ] 忽略模式在搜索中生效
  - [ ] UI 显示正确

  **QA Scenarios**:
  ```
  Scenario: 完整流程验证
    Tool: chrome-devtools
    Steps:
      1. 打开设置，输入 "node_modules/" 到全局忽略模式
      2. 保存并关闭设置
      3. 打开"添加项目"对话框
      4. 搜索 "axios"
      5. 验证结果中不包含 node_modules 路径
      6. 截图保存
    Expected Result: node_modules 被正确过滤
    Evidence: .sisyphus/evidence/task-5-e2e.png

  Scenario: 多种模式验证
    Tool: chrome-devtools
    Steps:
      1. 设置忽略模式为 ["node_modules/", "*.log", "**/test/**"]
      2. 搜索各种关键词
      3. 验证所有模式都生效
    Expected Result: 所有忽略模式生效
    Evidence: .sisyphus/evidence/task-5-multiple-patterns.png
  ```

  **Commit**: YES
  - Message: `chore: verify ignore patterns in search`

---

## Final Verification Wave

> **所有实现任务完成后执行**

- [ ] F1. **计划合规审计** — `oracle`
  验证所有交付物存在且符合规范。

- [ ] F2. **代码质量审查** — `unspecified-high`
  运行 `npm run typecheck` 和 `bun test`。

- [ ] F3. **真实手动 QA** — `unspecified-high` + `chrome-devtools` skill
  执行所有 QA 场景，保存证据。

- [ ] F4. **范围保真检查** — `deep`
  对比计划规范和实际实现。

---

## Commit Strategy

```
fix: apply global ignore patterns to directory search
test: add tests for search ignore patterns
feat: simplify ignore settings UI
chore: update ignore config types
chore: verify ignore patterns in search
```

---

## Success Criteria

### Verification Commands
```bash
# 类型检查
npm run typecheck

# 单元测试
bun test --run

# 端到端验证
# 使用 chrome-devtools 测试忽略模式
```

### Final Checklist
- [ ] 设置 `node_modules/` 后，搜索不返回 node_modules 目录
- [ ] 设置 `*.log` 后，搜索不返回 .log 文件
- [ ] 设置 UI 只显示全局忽略模式
- [ ] `npm run typecheck` 无错误
- [ ] `bun test` 所有测试通过
