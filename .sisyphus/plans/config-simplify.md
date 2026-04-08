# 简化配置系统

## TL;DR

> **目标**: 将多来源配置简化为单一文件 `~/.colonynote/config.json`
> 
> **核心改动**: 删除项目级配置，统一用户配置，使用 commander 处理 CLI 参数
>
> **不保存的字段**: `port`、`host`（仅通过 CLI 参数或默认值）

**Deliverables**:
- 新配置文件格式 `~/.colonynote/config.json`
- commander CLI 参数处理
- 删除项目级配置支持
- 配置文件自动修复机制

**Estimated Effort**: Medium
**Parallel Execution**: YES - 2 waves
**Critical Path**: Types → Config → CLI → Consumers → Cleanup

---

## Context

### Original Request
简化配置系统，只使用 `~/.colonynote/config.json` 一个配置文件。`port` 和 `host` 不保存到配置文件，通过 CLI 参数传递。

### User Decisions
- **迁移策略**: 忽略旧配置文件（不自动迁移）
- **项目级配置**: 删除支持
- **CLI 解析**: 使用 commander 库
- **错误处理**: 自动修复配置错误并启动

### Metis Review Findings
- 当前有 bug: `bin/colonynote.js` 使用 `config.root`（单数）而非 `config.roots`
- `src/dev.ts` 硬编码覆盖用户配置（第 17-18 行）
- 优先级必须保持: CLI args > Config file > Code defaults

---

## Work Objectives

### Core Objective
简化配置系统，减少配置来源，提高可维护性。

### Concrete Deliverables
- `~/.colonynote/config.json` 作为唯一配置文件
- commander CLI 参数处理
- 配置自动修复机制
- 删除项目级配置和旧用户配置支持

### Definition of Done
- [ ] `npm run dev` 使用用户配置启动
- [ ] `npm run start --port 3000` 临时使用端口 3000
- [ ] 配置文件错误时自动修复并启动
- [ ] `npm run typecheck` 无错误

### Must Have
- CLI args > Config file > Code defaults 优先级
- 多 root 支持（roots 数组）
- legacy `root` → `roots` 兼容
- 配置文件自动修复

### Must NOT Have
- 项目级配置文件支持
- port/host 保存到配置文件
- Schema 验证库（zod/joi）
- 配置热更新

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: NO（手动验证）
- **Agent-Executed QA**: YES（每个任务包含 QA 场景）

### QA Policy
每个任务包含 Agent-Executed QA Scenarios：
- **CLI**: 使用 Bash 运行命令，检查输出
- **API**: 使用 curl 发送请求，验证响应
- **Config**: 使用 Bash 检查文件内容

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation - Types & Config core):
├── Task 1: 定义新配置接口和默认值 [quick]
├── Task 2: 实现 loadConfig 函数 [quick]
├── Task 3: 实现 saveConfig 函数 [quick]
├── Task 4: 实现配置自动修复机制 [quick]
└── Task 5: 添加 commander CLI 处理 [quick]

Wave 2 (Consumers & Cleanup):
├── Task 6: 更新 bin/colonynote.js [quick]
├── Task 7: 更新 src/server/index.ts [quick]
├── Task 8: 修复 src/dev.ts 硬编码问题 [quick]
├── Task 9: 更新 src/server/api.ts [quick]
├── Task 10: 删除旧配置支持代码 [quick]
└── Task 11: 清理无用代码和文件 [quick]

Wave FINAL (Verification):
├── Task F1: Plan compliance audit [oracle]
├── Task F2: Code quality review [unspecified-high]
├── Task F3: Real manual QA [unspecified-high]
└── Task F4: Scope fidelity check [deep]
```

### Critical Path
Task 1 → Task 2 → Task 6 → Task 7 → Task 8 → F1-F4

---

## TODOs

- [ ] 1. **定义新配置接口和默认值**

  **What to do**:
  - 修改 `src/config.ts` 中的 `ColonynoteConfig` 接口
  - 从接口中删除 `port` 和 `host` 字段
  - 定义默认值常量（port: 5787, host: '0.0.0.0'）
  - 配置文件结构：roots, showHiddenFiles, allowedExtensions, theme, editor, ignore

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO（基础类型定义）
  - **Blocks**: Task 2, 3, 4, 5
  - **Blocked By**: None

  **Acceptance Criteria**:
  - [ ] ColonynoteConfig 接口不包含 port/host
  - [ ] defaultConfig 包含所有必需字段
  - [ ] npm run typecheck 通过

  **QA Scenarios**:
  ```
  Scenario: 类型定义正确
    Tool: Bash
    Steps:
      1. npm run typecheck
    Expected Result: 无类型错误
    Evidence: .sisyphus/evidence/task-01-typecheck.log
  ```

  **Commit**: YES (单独)
  - Message: `refactor(config): remove port/host from config interface`
  - Files: `src/config.ts`

- [ ] 2. **实现 loadConfig 函数**

  **What to do**:
  - 简化 `loadConfig` 函数，只读取 `~/.colonynote/config.json`
  - 删除项目级配置文件加载逻辑
  - 删除旧用户配置文件加载逻辑
  - 实现 legacy `root` → `roots` 兼容
  - 缺失字段使用默认值补齐

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO（依赖 Task 1）
  - **Blocks**: Task 6, 7, 8, 9
  - **Blocked By**: Task 1

  **References**:
  - `src/config.ts:loadConfig` - 当前实现（需要简化）

  **Acceptance Criteria**:
  - [ ] 只读取 ~/.colonynote/config.json
  - [ ] 不读取项目级配置
  - [ ] legacy root 兼容
  - [ ] 缺失字段补齐

  **QA Scenarios**:
  ```
  Scenario: 加载配置文件
    Tool: Bash
    Preconditions: ~/.colonynote/config.json 存在
    Steps:
      1. 创建测试配置: mkdir -p ~/.colonynote && echo '{"roots":[{"path":"/tmp/test"}]}' > ~/.colonynote/config.json
      2. npm run dev:backend &
      3. sleep 2
      4. curl http://localhost:5788/api/roots
      5. pkill -f "tsx src/server"
    Expected Result: roots 返回 [{"path":"/tmp/test"}]
    Evidence: .sisyphus/evidence/task-02-load.json

  Scenario: 缺失配置文件
    Tool: Bash
    Preconditions: ~/.colonynote/config.json 不存在
    Steps:
      1. rm -rf ~/.colonynote/config.json
      2. npm run dev:backend &
      3. sleep 2
      4. curl http://localhost:5788/api/roots
      5. pkill -f "tsx src/server"
    Expected Result: roots 返回默认值 [{"path":"<cwd>"}]
    Evidence: .sisyphus/evidence/task-02-default.json

  Scenario: legacy root 兼容
    Tool: Bash
    Steps:
      1. echo '{"root":"/tmp/legacy"}' > ~/.colonynote/config.json
      2. npm run dev:backend &
      3. sleep 2
      4. curl http://localhost:5788/api/roots
      5. pkill -f "tsx src/server"
    Expected Result: roots 返回 [{"path":"/tmp/legacy"}]
    Evidence: .sisyphus/evidence/task-02-legacy.json
  ```

  **Commit**: NO (与 Task 3, 4 组合)

- [ ] 3. **实现 saveConfig 函数**

  **What to do**:
  - 重命名 `saveUserConfig` 为 `saveConfig`
  - 删除 port/host 保存逻辑
  - 只保存用户关心的字段：roots, showHiddenFiles, allowedExtensions, theme, editor, ignore
  - 合并现有配置，不覆盖未修改字段

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 4)
  - **Blocks**: Task 9
  - **Blocked By**: Task 1

  **References**:
  - `src/config.ts:saveUserConfig` - 当前实现（需要简化）

  **Acceptance Criteria**:
  - [ ] 不保存 port/host
  - [ ] 合并现有配置
  - [ ] 创建目录如果不存在

  **QA Scenarios**:
  ```
  Scenario: 保存配置
    Tool: Bash
    Steps:
      1. rm -rf ~/.colonynote/config.json
      2. npm run dev:backend &
      3. sleep 2
      4. curl -X POST http://localhost:5788/api/roots -H 'Content-Type: application/json' -d '{"path":"/tmp/newroot"}'
      5. cat ~/.colonynote/config.json
      6. pkill -f "tsx src/server"
    Expected Result: config.json 包含 {"roots":[{"path":"/tmp/newroot"}]}
    Evidence: .sisyphus/evidence/task-03-save.json
  ```

  **Commit**: NO (与 Task 2, 4 组合)

- [ ] 4. **实现配置自动修复机制**

  **What to do**:
  - 在 loadConfig 中检测配置文件格式错误
  - 尝试解析 JSON，失败时使用默认值
  - 补齐缺失字段
  - 删除无效字段（如 port, host）
  - 记录警告日志
  - 保存修复后的配置

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 3)
  - **Blocks**: None
  - **Blocked By**: Task 1

  **Acceptance Criteria**:
  - [ ] 无效 JSON 时使用默认值
  - [ ] 缺失字段补齐
  - [ ] 无效字段删除
  - [ ] 服务器继续启动

  **QA Scenarios**:
  ```
  Scenario: 无效 JSON
    Tool: Bash
    Steps:
      1. echo '{invalid json}' > ~/.colonynote/config.json
      2. npm run dev:backend &
      3. sleep 2
      4. curl http://localhost:5788/api/roots
      5. cat ~/.colonynote/config.json
      6. pkill -f "tsx src/server"
    Expected Result: 服务器启动，config.json 被修复为有效 JSON
    Evidence: .sisyphus/evidence/task-04-invalid.json

  Scenario: 无效字段
    Tool: Bash
    Steps:
      1. echo '{"roots":[{"path":"/tmp/test"}],"port":3000,"host":"localhost","invalidField":"value"}' > ~/.colonynote/config.json
      2. npm run dev:backend &
      3. sleep 2
      4. cat ~/.colonynote/config.json
      5. pkill -f "tsx src/server"
    Expected Result: config.json 不包含 port/host/invalidField
    Evidence: .sisyphus/evidence/task-04-cleanup.json
  ```

  **Commit**: YES (与 Task 2, 3 组合)
  - Message: `refactor(config): simplify load/save with auto-fix`
  - Files: `src/config.ts`

- [ ] 5. **添加 commander CLI 处理**

  **What to do**:
  - 安装 commander: `npm install commander`
  - 修改 `bin/colonynote.js` 使用 commander
  - 定义参数: --port, --host, --root, --help, --version
  - --root 添加到 config.roots（临时，不保存）
  - 修复 config.root → config.roots bug

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 3, 4)
  - **Blocks**: Task 6
  - **Blocked By**: None

  **References**:
  - `bin/colonynote.js` - 当前 CLI 实现
  - Commander docs: https://commander.js.org/

  **Acceptance Criteria**:
  - [ ] commander 正确解析参数
  - [ ] --port, --host 临时覆盖
  - [ ] --root 添加到 roots
  - [ ] --help 显示帮助
  - [ ] config.roots bug 修复

  **QA Scenarios**:
  ```
  Scenario: CLI 参数解析
    Tool: Bash
    Steps:
      1. node bin/colonynote.js --help
    Expected Result: 显示帮助文本，包含 --port, --host, --root
    Evidence: .sisyphus/evidence/task-05-help.txt

  Scenario: 端口参数覆盖
    Tool: Bash
    Steps:
      1. node bin/colonynote.js --port 3000 &
      2. sleep 2
      3. curl http://localhost:3000/api/files
      4. pkill -f colonynote
    Expected Result: 服务器在端口 3000 启动
    Evidence: .sisyphus/evidence/task-05-port.log

  Scenario: root 参数添加
    Tool: Bash
    Steps:
      1. node bin/colonynote.js --root /tmp/cliroot &
      2. sleep 2
      3. curl http://localhost:5787/api/roots
      4. pkill -f colonynote
    Expected Result: roots 包含 /tmp/cliroot
    Evidence: .sisyphus/evidence/task-05-root.json
  ```

  **Commit**: YES (单独)
  - Message: `feat(cli): use commander for argument parsing`
  - Files: `bin/colonynote.js`, `package.json`

- [ ] 6. **更新 bin/colonynote.js**

  **What to do**:
  - 使用新的 loadConfig 函数
  - 使用 commander 参数覆盖 port/host
  - 传递配置到服务器

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 7, 8, 9)
  - **Blocked By**: Task 2, 5

  **References**:
  - `bin/colonynote.js` - 当前实现

  **Acceptance Criteria**:
  - [ ] 使用新 loadConfig
  - [ ] CLI 参数正确覆盖

  **QA Scenarios**:
  ```
  Scenario: 启动服务器
    Tool: Bash
    Steps:
      1. node bin/colonynote.js &
      2. sleep 2
      3. curl http://localhost:5787/api/files
      4. pkill -f colonynote
    Expected Result: 服务器正常启动
    Evidence: .sisyphus/evidence/task-06-start.log
  ```

  **Commit**: NO (Wave 2 组合)

- [ ] 7. **更新 src/server/index.ts**

  **What to do**:
  - 使用新 loadConfig 函数
  - port/host 从配置对象中移除，改为参数传递或默认值
  - 删除 findRootForPath 函数（已在 api.ts 中）

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 6, 8, 9)
  - **Blocked By**: Task 2

  **References**:
  - `src/server/index.ts` - 当前实现

  **Acceptance Criteria**:
  - [ ] 使用新 loadConfig
  - [ ] port/host 使用默认值 5787/0.0.0.0
  - [ ] npm run typecheck 通过

  **QA Scenarios**:
  ```
  Scenario: dev:backend 启动
    Tool: Bash
    Steps:
      1. npm run dev:backend &
      2. sleep 2
      3. curl http://localhost:5788/api/files
      4. pkill -f "tsx src/server"
    Expected Result: 服务器正常启动
    Evidence: .sisyphus/evidence/task-07-backend.log
  ```

  **Commit**: NO (Wave 2 组合)

- [ ] 8. **修复 src/dev.ts 硬编码问题**

  **What to do**:
  - 删除第 17-44 行硬编码覆盖 roots 的代码
  - 使用 loadConfig 的配置
  - matcher 使用 config.roots[0]?.path

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 6, 7, 9)
  - **Blocked By**: Task 2

  **References**:
  - `src/dev.ts:17-44` - 需要删除的代码
  - `.sisyphus/drafts/config-fix.md` - 问题分析

  **Acceptance Criteria**:
  - [ ] 使用用户配置
  - [ ] 不硬编码 roots
  - [ ] npm run dev 使用用户配置

  **QA Scenarios**:
  ```
  Scenario: dev 模式使用用户配置
    Tool: Bash
    Preconditions: ~/.colonynote/config.json 有自定义 roots
    Steps:
      1. echo '{"roots":[{"path":"/tmp/usertest"}]}' > ~/.colonynote/config.json
      2. npm run dev &
      3. sleep 3
      4. curl http://localhost:5787/api/roots
      5. pkill -f "tsx src"
    Expected Result: roots 返回 [{"path":"/tmp/usertest"}]
    Evidence: .sisyphus/evidence/task-08-dev.json
  ```

  **Commit**: NO (Wave 2 组合)

- [ ] 9. **更新 src/server/api.ts**

  **What to do**:
  - 使用新的 saveConfig 函数（重命名）
  - 删除 port/host 相关保存逻辑
  - 更新所有 saveUserConfig 调用为 saveConfig

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 6, 7, 8)
  - **Blocked By**: Task 3

  **References**:
  - `src/server/api.ts` - API 路由
  - `src/config.ts:saveConfig` - 新函数名

  **Acceptance Criteria**:
  - [ ] 使用 saveConfig
  - [ ] 不保存 port/host
  - [ ] npm run typecheck 通过

  **QA Scenarios**:
  ```
  Scenario: API 保存配置
    Tool: Bash
    Steps:
      1. npm run dev:backend &
      2. sleep 2
      3. curl -X POST http://localhost:5788/api/roots -H 'Content-Type: application/json' -d '{"path":"/tmp/apitest"}'
      4. cat ~/.colonynote/config.json
      5. pkill -f "tsx src/server"
    Expected Result: config.json 正确保存，不包含 port/host
    Evidence: .sisyphus/evidence/task-09-api.json
  ```

  **Commit**: YES (Wave 2)
  - Message: `refactor(config): update consumers to use new config system`
  - Files: `bin/colonynote.js`, `src/server/index.ts`, `src/dev.ts`, `src/server/api.ts`

- [ ] 10. **删除旧配置支持代码**

  **What to do**:
  - 删除项目级配置文件加载逻辑（已在 Task 2）
  - 删除 colonynote.user.json 加载逻辑（已在 Task 2）
  - 删除 DEFAULT_SENSITIVE_PATHS（如果不再使用）
  - 清理无用导入

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 11)
  - **Blocked By**: Task 2

  **Acceptance Criteria**:
  - [ ] 无项目级配置代码
  - [ ] 无旧用户配置代码
  - [ ] npm run typecheck 通过

  **QA Scenarios**:
  ```
  Scenario: 配置加载简化验证
    Tool: Bash
    Steps:
      1. grep -n "colonynote.config.js" src/config.ts || echo "已删除"
      2. grep -n "colonynote.user.json" src/config.ts || echo "已删除"
    Expected Result: 无相关代码
    Evidence: .sisyphus/evidence/task-10-cleanup.log
  ```

  **Commit**: NO (清理组合)

- [ ] 11. **清理无用代码和文件**

  **What to do**:
  - 删除 colonydoc.config.js（项目级配置示例）
  - 清理 src/dev.ts 无用导入
  - 检查是否有其他无用代码
  - 更新 README 配置文档

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 10)
  - **Blocked By**: Task 10

  **Acceptance Criteria**:
  - [ ] 无旧配置文件
  - [ ] README 更新
  - [ ] npm run typecheck 通过

  **QA Scenarios**:
  ```
  Scenario: 文件清理验证
    Tool: Bash
    Steps:
      1. ls colonydoc.config.js 2>&1 || echo "已删除"
      2. npm run typecheck
    Expected Result: 无旧文件，typecheck 通过
    Evidence: .sisyphus/evidence/task-11-final.log
  ```

  **Commit**: YES (清理)
  - Message: `chore(config): remove old config files and update docs`
  - Files: `colonydoc.config.js`, `README.md`, `README.zh.md`

---

## Final Verification Wave

- [ ] F1. **Plan Compliance Audit** — `oracle`
  检查所有 Must Have 是否实现，所有 Must NOT Have 是否未添加。

- [ ] F2. **Code Quality Review** — `unspecified-high`
  运行 `npm run typecheck`，检查无 AI slop patterns。

- [ ] F3. **Real Manual QA** — `unspecified-high`
  测试所有 QA 场景，验证配置加载、CLI 参数、自动修复。

- [ ] F4. **Scope Fidelity Check** — `deep`
  检查是否有未预期的改动。

---

## Commit Strategy

每个 Wave 完成后提交：
- Wave 1: `refactor(config): simplify to single config file with commander CLI`
- Wave 2: `refactor(config): update consumers and remove old config support`

---

## Success Criteria

### Verification Commands
```bash
npm run typecheck
npm run dev
curl http://localhost:5787/api/files
node bin/colonynote.js --port 3000 --help
```

### Final Checklist
- [ ] 配置文件路径: ~/.colonynote/config.json
- [ ] port/host 不在配置文件中
- [ ] CLI 参数正确解析
- [ ] 配置错误自动修复
- [ ] dev 模式使用用户配置