# 修复移动端下拉菜单不可见

## TL;DR

> **问题**: 移动端工具栏在底部，下拉菜单 `top-full` 定位会跑到屏幕外面
> **修复**: 移动端改为 `bottom-full` 向上展开
> 
> **Deliverables**: 修改 `globals.css` 中 `.editor-toolbar-dropdown-menu` 移动端样式

---

## TODOs

- [x] 1. 修复移动端下拉菜单定位

  **What to do**:
  - 在 `globals.css` 中添加 `@media (max-width: 767px)` 覆盖
  - 移动端：`top: auto; bottom: 100%;` 让菜单向上展开
  - 桌面端保持 `top: 100%` 向下展开

  **Acceptance Criteria**:
  - [ ] 移动端点击标题按钮，菜单向上弹出
  - [ ] 桌面端点击标题按钮，菜单向下弹出
  - [ ] `npm run typecheck` 通过

  **Commit**: YES
  - Message: `fix(editor): 移动端下拉菜单改为向上展开`

---

## Commit Strategy

- **1**: `fix(editor): 移动端下拉菜单改为向上展开` - globals.css
