# 添加 H3-H6 标题按钮

## TL;DR

> **Quick Summary**: 在 EditorToolbar 中添加 H3、H4、H5、H6 标题按钮，使工具栏支持完整的 H1-H6 标题层级。
> 
> **Deliverables**: 
> - 修改 `EditorToolbar.tsx`（添加 Heading3-Heading6 图标和按钮）
> - `npm run typecheck` 通过
> 
> **Estimated Effort**: Trivial
> **Parallel Execution**: NO
> **Critical Path**: T1 → T2

---

## Context

### Original Request
用户反馈"h1-h6都需要"

### Current State
- EditorToolbar 仅有 H1、H2 按钮
- lucide-react 已提供 Heading3-Heading6 图标
- TipTap 支持 toggleHeading({ level: 3-6 })

---

## Work Objectives

### Core Objective
工具栏支持完整的 H1-H6 标题按钮

### Concrete Deliverables
- `src/client/components/EditorToolbar.tsx` — 添加 4 个新按钮

### Definition of Done
- [ ] 工具栏显示 H1-H6 共 6 个标题按钮
- [ ] `npm run typecheck` 无类型错误

### Must Have
- Heading3, Heading4, Heading5, Heading6 按钮
- isActive 高亮反馈
- 按钮顺序：H1 → H6

### Must NOT Have (Guardrails)
- 不改变其他按钮
- 不改变按钮样式
- 不引入新依赖

---

## TODOs

- [x] 1. 添加 H3-H6 按钮到 EditorToolbar

  **What to do**:
  - 在 import 中添加 `Heading3, Heading4, Heading5, Heading6`
  - 在 `toolbarButtons` 数组中 H2 之后添加 4 个按钮配置
  - 每个按钮格式与现有标题按钮一致

  **Acceptance Criteria**:
  - [ ] import 包含 Heading3-Heading6
  - [ ] toolbarButtons 包含 12 个按钮（原 8 个 + 4 个新标题）
  - [ ] `npm run typecheck` 通过

  **Commit**: YES
  - Message: `feat(editor): 工具栏添加 H3-H6 标题按钮`

---

## Commit Strategy

- **1**: `feat(editor): 工具栏添加 H3-H6 标题按钮` - EditorToolbar.tsx

---

## Success Criteria

### Verification Commands
```bash
npm run typecheck  # Expected: 0 errors
```
