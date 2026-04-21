# 标题按钮改为下拉菜单

## TL;DR

> **Quick Summary**: 将工具栏中平铺的 H1-H6 按钮合并为一个"标题"下拉按钮，点击后展开 H1-H6 选项，节省工具栏空间。
> 
> **Deliverables**: 
> - 修改 `EditorToolbar.tsx`（标题下拉菜单）
> - 更新 `globals.css`（下拉菜单样式）
> 
> **Estimated Effort**: Short

---

## TODOs

- [x] 1. 标题按钮改为下拉菜单

  **What to do**:
  - 将 H1-H6 按钮替换为单个 `HeadingDropdown` 组件
  - 显示当前标题层级（如 "H1"、"H2"、"正文"）+ 向下箭头
  - 点击展开下拉菜单，显示 H1-H6 + 正文 选项
  - 点击选项应用对应标题层级，选择"正文"则切换为段落
  - 点击外部自动关闭下拉菜单
  - 使用 `contentEditable={false}` 防止 TipTap 干扰

  **Acceptance Criteria**:
  - [ ] 工具栏标题区域仅占 1 个按钮宽度
  - [ ] 点击显示 H1-H6 + 正文选项
  - [ ] 当前标题层级高亮显示
  - [ ] `npm run typecheck` 通过

  **Commit**: YES
  - Message: `refactor(editor): 标题按钮改为下拉菜单，节省工具栏空间`

---

## Commit Strategy

- **1**: `refactor(editor): 标题按钮改为下拉菜单，节省工具栏空间` - EditorToolbar.tsx, globals.css

---

## Success Criteria

### Verification Commands
```bash
npm run typecheck  # Expected: 0 errors
```
