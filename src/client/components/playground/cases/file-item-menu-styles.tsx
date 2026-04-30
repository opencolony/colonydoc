import { useState } from 'react'
import {
  Folder,
  FileText,
  Pencil,
  FolderInput,
  Copy,
  Trash2,
  Plus,
  FilePlus,
  FolderPlus,
  X,
  GripHorizontal,
} from 'lucide-react'
import { cn } from '@/client/lib/utils'
import type { PlaygroundCase } from '../types'

// 模拟数据
const mockItem = { name: 'system', type: 'directory' as const }

// 通用手机容器：模拟移动端底部 Sheet
function PhoneSheet({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="relative w-[280px] h-[420px] rounded-2xl border border-border bg-background overflow-hidden shadow-lg mx-auto">
      {/* 模拟文件树背景 */}
      <div className="absolute inset-0 p-3 space-y-2 opacity-30">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Folder className="size-4" />
          <span>.agents</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Folder className="size-4" />
          <span>abc</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Folder className="size-4" />
          <span>dev</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Folder className="size-4" />
          <span className="font-medium text-foreground">system</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FileText className="size-4" />
          <span>index.md</span>
        </div>
      </div>
      {/* Sheet 内容 */}
      <div className={cn("absolute bottom-0 left-0 right-0", className)}>
        {children}
      </div>
    </div>
  )
}

// 通用 Grab Handle
function GrabHandle() {
  return (
    <div className="flex justify-center pt-2 pb-1">
      <div className="w-10 h-1 rounded-full bg-muted-foreground/25" />
    </div>
  )
}

// 方案 A：图标分组式 — 顶部大图标 + 分组操作列表，左侧图标带色块背景
function StyleGrouped() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const actionGroups = [
    {
      items: [
        { icon: Pencil, label: '重命名', color: 'text-foreground', bg: 'bg-muted' },
        { icon: FolderInput, label: '移动到', color: 'text-foreground', bg: 'bg-muted' },
        { icon: Copy, label: '复制到', color: 'text-foreground', bg: 'bg-muted' },
      ],
    },
    {
      items: [
        { icon: Trash2, label: '删除', color: 'text-destructive', bg: 'bg-destructive/10' },
      ],
    },
  ]

  return (
    <PhoneSheet>
      <div className="bg-background rounded-t-2xl border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <GrabHandle />
        {/* 头部 */}
        <div className="flex flex-col items-center px-4 pt-1 pb-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
            <Folder className="size-5 text-primary" />
          </div>
          <span className="text-sm font-medium">{mockItem.name}</span>
        </div>

        {/* 新建操作 - 双列卡片 */}
        <div className="px-3 pb-2">
          <div className="grid grid-cols-2 gap-2">
            <button className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary/5 border border-primary/10 text-xs font-medium text-primary hover:bg-primary/10 transition-colors">
              <FilePlus className="size-4" />
              新建文件
            </button>
            <button className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary/5 border border-primary/10 text-xs font-medium text-primary hover:bg-primary/10 transition-colors">
              <FolderPlus className="size-4" />
              新建文件夹
            </button>
          </div>
        </div>

        {/* 操作分组 */}
        <div className="px-3 pb-4 space-y-1">
          {actionGroups.map((group, gi) => (
            <div key={gi} className={cn("rounded-xl overflow-hidden", gi < actionGroups.length - 1 && "mb-1")}>
              {group.items.map((item, i) => {
                const globalIndex = gi * 10 + i
                return (
                  <button
                    key={i}
                    onMouseEnter={() => setHoveredIndex(globalIndex)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2.5 text-sm transition-colors",
                      hoveredIndex === globalIndex ? 'bg-muted' : 'bg-transparent',
                      item.color
                    )}
                  >
                    <div className={cn("size-7 rounded-lg flex items-center justify-center shrink-0", item.bg)}>
                      <item.icon className="size-4" />
                    </div>
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </PhoneSheet>
  )
}

// 方案 B：紧凑 iOS 风格 — 顶部标题 + 紧凑列表 + 底部取消
function StyleCompact() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const topActions = [
    { icon: FilePlus, label: '新建文件' },
    { icon: FolderPlus, label: '新建文件夹' },
  ]

  const actions = [
    { icon: Pencil, label: '重命名' },
    { icon: FolderInput, label: '移动到' },
    { icon: Copy, label: '复制到' },
  ]

  return (
    <PhoneSheet>
      <div className="bg-background/95 backdrop-blur-sm rounded-t-2xl border-t border-border">
        <GrabHandle />

        {/* 标题 */}
        <div className="px-4 pt-1 pb-3 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Folder className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">{mockItem.name}</span>
          </div>
          <span className="text-[11px] text-muted-foreground">选择一个操作</span>
        </div>

        {/* 新建操作 - 紧凑行 */}
        <div className="mx-3 rounded-xl bg-muted/60 overflow-hidden mb-1.5">
          {topActions.map((action, i) => (
            <button
              key={i}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 text-sm transition-colors",
                hoveredIndex === i ? 'bg-muted' : 'bg-transparent'
              )}
            >
              <action.icon className="size-4 text-primary" />
              <span className="text-primary font-medium">{action.label}</span>
            </button>
          ))}
        </div>

        {/* 操作列表 */}
        <div className="mx-3 rounded-xl bg-muted/60 overflow-hidden mb-1.5">
          {actions.map((action, i) => (
            <button
              key={i}
              onMouseEnter={() => setHoveredIndex(10 + i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 text-sm transition-colors",
                hoveredIndex === 10 + i ? 'bg-muted' : 'bg-transparent'
              )}
            >
              <action.icon className="size-4 text-muted-foreground" />
              <span>{action.label}</span>
            </button>
          ))}
        </div>

        {/* 删除 */}
        <div className="mx-3 rounded-xl bg-muted/60 overflow-hidden mb-2">
          <button className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors">
            <Trash2 className="size-4" />
            <span>删除</span>
          </button>
        </div>

        {/* 取消 */}
        <div className="px-3 pb-3">
          <button className="w-full py-2.5 rounded-xl bg-muted/60 text-sm font-medium text-foreground hover:bg-muted transition-colors">
            取消
          </button>
        </div>
      </div>
    </PhoneSheet>
  )
}

// 方案 C：现代卡片式 — 顶部渐变色条 + 每项独立卡片带阴影
function StyleCard() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const actions = [
    { icon: Pencil, label: '重命名', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    { icon: FolderInput, label: '移动到', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    { icon: Copy, label: '复制到', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  ]

  return (
    <PhoneSheet>
      <div className="bg-background rounded-t-2xl border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <GrabHandle />

        {/* 顶部彩色条 */}
        <div className="relative px-4 pt-1 pb-3">
          <div className="absolute top-0 left-4 right-4 h-0.5 rounded-full bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
          <div className="flex items-center gap-3 pt-3">
            <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Folder className="size-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium">{mockItem.name}</span>
              <p className="text-[11px] text-muted-foreground">文件夹 · 5 个项目</p>
            </div>
            <button className="size-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
              <X className="size-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* 快捷新建 */}
        <div className="px-3 pb-2 flex gap-2">
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shadow-sm">
            <Plus className="size-3.5" />
            新建文件
          </button>
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/80 transition-colors border border-border">
            <Plus className="size-3.5" />
            新建文件夹
          </button>
        </div>

        {/* 操作卡片列表 */}
        <div className="px-3 pb-2 space-y-1.5">
          {actions.map((action, i) => (
            <button
              key={i}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-all",
                hoveredIndex === i
                  ? 'bg-muted shadow-sm scale-[1.01]'
                  : 'bg-card border border-border/60'
              )}
            >
              <div className={cn("size-7 rounded-lg flex items-center justify-center shrink-0", action.color)}>
                <action.icon className="size-4" />
              </div>
              <span>{action.label}</span>
            </button>
          ))}
        </div>

        {/* 删除卡片 */}
        <div className="px-3 pb-4">
          <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-destructive bg-destructive/5 border border-destructive/10 hover:bg-destructive/10 transition-colors">
            <div className="size-7 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
              <Trash2 className="size-4" />
            </div>
            <span>删除此文件夹</span>
          </button>
        </div>
      </div>
    </PhoneSheet>
  )
}

// 方案 D：暗色头部 + 浅色列表 — 顶部深色区域突出文件名，下方操作在浅色背景
function StyleDarkHeader() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const actions = [
    { icon: Pencil, label: '重命名' },
    { icon: FolderInput, label: '移动到' },
    { icon: Copy, label: '复制到' },
    { icon: Trash2, label: '删除', destructive: true },
  ]

  return (
    <PhoneSheet>
      <div className="rounded-t-2xl overflow-hidden shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <GrabHandle />

        {/* 深色头部 */}
        <div className="bg-muted px-4 pt-1 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-background flex items-center justify-center shadow-sm">
                <Folder className="size-5 text-primary" />
              </div>
              <div>
                <span className="text-sm font-medium">{mockItem.name}</span>
                <p className="text-[11px] text-muted-foreground">文件夹</p>
              </div>
            </div>
            <button className="size-8 rounded-full bg-background/50 flex items-center justify-center hover:bg-background transition-colors">
              <X className="size-3.5" />
            </button>
          </div>

          {/* 新建快捷 */}
          <div className="flex gap-2 mt-3">
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-background text-xs font-medium hover:bg-background/80 transition-colors shadow-sm">
              <FilePlus className="size-3.5 text-primary" />
              新建文件
            </button>
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-background text-xs font-medium hover:bg-background/80 transition-colors shadow-sm">
              <FolderPlus className="size-3.5 text-primary" />
              新建文件夹
            </button>
          </div>
        </div>

        {/* 操作列表 - 浅色背景 */}
        <div className="bg-background px-3 py-2">
          {actions.map((action, i) => (
            <button
              key={i}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-3 text-sm transition-colors rounded-lg",
                hoveredIndex === i && !action.destructive && 'bg-muted',
                hoveredIndex === i && action.destructive && 'bg-destructive/5',
                action.destructive ? 'text-destructive' : 'text-foreground'
              )}
            >
              <action.icon className={cn("size-4 shrink-0", action.destructive ? 'text-destructive' : 'text-muted-foreground')} />
              <span>{action.label}</span>
              {action.destructive && <span className="ml-auto text-[10px] text-destructive/60">不可恢复</span>}
            </button>
          ))}
        </div>
      </div>
    </PhoneSheet>
  )
}

export const fileItemMenuStylesCase: PlaygroundCase = {
  id: 'file-item-menu-styles',
  name: '文件操作菜单样式设计',
  description: '重新设计点击文件/目录「三个点」后弹出的操作菜单（移动端底部 Sheet）的视觉风格',
  variants: [
    {
      name: '方案 A：图标分组式',
      description: '顶部大图标 + 文件名居中，新建操作双列卡片，操作按组分隔，左侧图标带色块背景',
      component: <StyleGrouped />,
    },
    {
      name: '方案 B：紧凑 iOS 风格',
      description: '紧凑列表布局，操作项放在圆角灰色容器内，底部有取消按钮，接近原生 iOS Action Sheet',
      component: <StyleCompact />,
    },
    {
      name: '方案 C：现代卡片式',
      description: '顶部彩色渐变条 + 关闭按钮，操作项每项独立卡片带阴影和彩色图标背景',
      component: <StyleCard />,
    },
    {
      name: '方案 D：暗色头部式',
      description: '顶部深色区域突出文件名，下方操作在浅色背景上，删除项带不可恢复提示',
      component: <StyleDarkHeader />,
    },
  ],
}
