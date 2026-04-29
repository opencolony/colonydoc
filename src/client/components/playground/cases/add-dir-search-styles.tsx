import { useState } from 'react'
import {
  Search,
  Folder,
  FolderOpen,
  X,
  Clock,
  ArrowRight,
  Sparkles,
  Zap,
  Target,
  Command,
  Navigation,
} from 'lucide-react'
import { cn } from '@/client/lib/utils'
import type { PlaygroundCase } from '../types'

// 模拟数据
const mockRecentDirs = [
  '/home/yuexiaoliang/projects/brain',
  '/home/yuexiaoliang/projects/note',
]

const mockSearchResults = [
  { path: '~/projects/docs/colonychat', matches: [21, 22, 23, 24] },
  { path: '~/projects/note/workspace/dev/colonyco', matches: [33, 34, 35, 36] },
  { path: '~/projects/docs/colonycode', matches: [21, 22, 23, 24] },
  { path: '~/projects/docs/colonynote', matches: [21, 22, 23, 24] },
  { path: '~/projects/docs/colonybrain', matches: [21, 22, 23, 24] },
]

const searchQuery = 'colo'

// 通用容器：模拟移动端 Sheet 的内容区域
function SheetContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'w-full max-w-[360px] mx-auto bg-background rounded-t-2xl border border-border shadow-lg overflow-hidden flex flex-col',
        className
      )}
    >
      {/* 拖拽指示条 */}
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
      </div>
      {/* 头部 */}
      <div className="px-5 pb-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">打开项目</h2>
          <button className="size-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <X className="size-4" />
          </button>
        </div>
      </div>
      {/* 内容 */}
      <div className="px-5 pb-6 pt-2 flex-1 overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  )
}

// 高亮匹配文字的组件
function HighlightPath({ path, query }: { path: string; query: string }) {
  const parts: (string | { highlight: true; text: string })[] = []
  const lowerPath = path.toLowerCase()
  const lowerQuery = query.toLowerCase()
  let lastIndex = 0

  // 找到所有匹配位置
  const matchIndices: number[] = []
  let idx = lowerPath.indexOf(lowerQuery)
  while (idx !== -1) {
    for (let i = idx; i < idx + lowerQuery.length; i++) {
      matchIndices.push(i)
    }
    lastIndex = idx + lowerQuery.length
    idx = lowerPath.indexOf(lowerQuery, lastIndex)
  }

  // 如果没有匹配，直接返回
  if (matchIndices.length === 0) {
    return <span className="truncate">{path}</span>
  }

  // 构建高亮结果
  const result: React.ReactNode[] = []
  let currentText = ''
  let isHighlight = false

  for (let i = 0; i < path.length; i++) {
    const shouldHighlight = matchIndices.includes(i)
    if (shouldHighlight !== isHighlight) {
      if (currentText) {
        result.push(
          isHighlight
            ? <mark key={i} className="bg-transparent font-semibold text-primary">{currentText}</mark>
            : <span key={i}>{currentText}</span>
        )
      }
      currentText = path[i]
      isHighlight = shouldHighlight
    } else {
      currentText += path[i]
    }
  }
  if (currentText) {
    result.push(
      isHighlight
        ? <mark key="last" className="bg-transparent font-semibold text-primary">{currentText}</mark>
        : <span key="last">{currentText}</span>
    )
  }

  return <span className="truncate">{result}</span>
}

// 方案 A：胶囊搜索框 — 搜索框为深色胶囊，底部阴影突出，结果项圆角卡片
function StyleCapsuleSearch() {
  return (
    <SheetContainer>
      {/* 胶囊搜索框 */}
      <div className="relative">
        <div className="flex items-center gap-2 h-12 px-4 rounded-full bg-muted/80 border border-border/50 shadow-sm">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-foreground flex-1 truncate">{searchQuery}</span>
          <button className="size-6 rounded-full bg-muted-foreground/10 flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0">
            <X className="size-3" />
          </button>
        </div>
      </div>

      {/* 结果区域 */}
      <div className="mt-4 flex-1 overflow-y-auto space-y-4">
        {/* 最近项目 */}
        <div>
          <div className="flex items-center gap-1.5 px-1 mb-2">
            <Clock className="size-3.5 text-muted-foreground/50" />
            <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">最近项目</span>
          </div>
          <div className="space-y-1.5">
            {mockRecentDirs.map((dir) => (
              <button
                key={dir}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl bg-muted/40 hover:bg-muted/70 active:scale-[0.98] transition-all text-left"
              >
                <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <FolderOpen className="size-4 text-primary/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{dir.split('/').pop()}</p>
                  <p className="text-[11px] text-muted-foreground/50 truncate">{dir}</p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground/20" />
              </button>
            ))}
          </div>
        </div>

        {/* 搜索结果 */}
        <div>
          <div className="flex items-center gap-1.5 px-1 mb-2">
            <Sparkles className="size-3.5 text-muted-foreground/50" />
            <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">搜索结果</span>
          </div>
          <div className="space-y-1.5">
            {mockSearchResults.map((item) => (
              <button
                key={item.path}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl bg-muted/30 hover:bg-muted/60 active:scale-[0.98] transition-all text-left"
              >
                <div className="size-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Folder className="size-4 text-muted-foreground/50" />
                </div>
                <div className="flex-1 min-w-0 text-sm">
                  <HighlightPath path={item.path} query={searchQuery} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </SheetContainer>
  )
}

// 方案 B：底部沉浸搜索 — 搜索框固定在底部类似输入栏，结果区域全屏展开
function StyleBottomImmersive() {
  return (
    <SheetContainer className="relative">
      {/* 结果区域 */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {/* 搜索提示 */}
        <div className="flex items-center gap-2 px-1">
          <Target className="size-3.5 text-primary/60" />
          <span className="text-xs text-muted-foreground">
            找到 <span className="font-semibold text-foreground">{mockSearchResults.length}</span> 个匹配 "<span className="font-medium text-primary">{searchQuery}</span>" 的目录
          </span>
        </div>

        {/* 最近项目 */}
        <div>
          <div className="px-2 mb-1.5 text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">最近项目</div>
          <div className="rounded-2xl bg-muted/20 border border-border/30 overflow-hidden">
            {mockRecentDirs.map((dir, idx) => (
              <button
                key={dir}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors',
                  idx !== mockRecentDirs.length - 1 && 'border-b border-border/20'
                )}
              >
                <FolderOpen className="size-4 shrink-0 text-primary/60" />
                <span className="text-sm text-foreground truncate flex-1">{dir}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 搜索结果 */}
        <div>
          <div className="px-2 mb-1.5 text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">搜索结果</div>
          <div className="rounded-2xl bg-muted/20 border border-border/30 overflow-hidden">
            {mockSearchResults.map((item, idx) => (
              <button
                key={item.path}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors',
                  idx !== mockSearchResults.length - 1 && 'border-b border-border/20'
                )}
              >
                <Folder className="size-4 shrink-0 text-muted-foreground/40" />
                <div className="flex-1 min-w-0 text-sm">
                  <HighlightPath path={item.path} query={searchQuery} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 底部固定搜索框 */}
      <div className="shrink-0 pt-2 pb-1 border-t border-border/30">
        <div className="flex items-center gap-2 h-11 px-4 rounded-xl bg-primary/5 border border-primary/20">
          <Search className="size-4 text-primary/60 shrink-0" />
          <span className="text-sm text-foreground flex-1">{searchQuery}</span>
          <button className="p-1 text-muted-foreground hover:text-foreground">
            <X className="size-3.5" />
          </button>
        </div>
      </div>
    </SheetContainer>
  )
}

// 方案 C：芯片式搜索 — 搜索词以芯片标签展示，结果项有路径面包屑
function StyleChipSearch() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const filters = ['全部', 'projects', 'docs', 'note']

  return (
    <SheetContainer>
      {/* 搜索框 + 芯片 */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <div className="flex h-11 w-full rounded-xl border border-input bg-background pl-9 pr-3 py-2 items-center gap-2">
            <span className="text-sm text-foreground">{searchQuery}</span>
          </div>
        </div>
        {/* 过滤芯片 */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(activeFilter === f ? null : f)}
              className={cn(
                'shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors',
                activeFilter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* 结果区域 */}
      <div className="mt-2 flex-1 overflow-y-auto space-y-3">
        {/* 最近项目 */}
        <div>
          <div className="flex items-center gap-1.5 px-1 mb-1.5">
            <Clock className="size-3 text-muted-foreground/50" />
            <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">最近项目</span>
          </div>
          <div className="space-y-0.5">
            {mockRecentDirs.map((dir) => {
              const parts = dir.split('/')
              const name = parts.pop() || dir
              return (
                <button
                  key={dir}
                  className="w-full flex items-center gap-2 px-2 py-2.5 rounded-lg hover:bg-accent text-left transition-colors"
                >
                  <FolderOpen className="size-4 shrink-0 text-primary/60" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{name}</p>
                    <p className="text-[10px] text-muted-foreground/50 truncate">{parts.join('/')}/</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 搜索结果 */}
        <div>
          <div className="flex items-center gap-1.5 px-1 mb-1.5">
            <Zap className="size-3 text-muted-foreground/50" />
            <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">搜索结果</span>
          </div>
          <div className="space-y-0.5">
            {mockSearchResults.map((item) => {
              const parts = item.path.split('/')
              const name = parts.pop() || item.path
              return (
                <button
                  key={item.path}
                  className="w-full flex items-center gap-2 px-2 py-2.5 rounded-lg hover:bg-accent text-left transition-colors"
                >
                  <Folder className="size-4 shrink-0 text-muted-foreground/40" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      <HighlightPath path={name} query={searchQuery} />
                    </p>
                    <p className="text-[10px] text-muted-foreground/50 truncate">{parts.join('/')}/</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </SheetContainer>
  )
}

// 方案 D：大搜索框聚焦 — 搜索框占主导，带发光效果，结果项大号展示
function StyleFocusedSearch() {
  return (
    <SheetContainer>
      {/* 大搜索框 */}
      <div className="relative">
        <div className="flex items-center gap-3 h-14 px-5 rounded-2xl bg-muted/60 border-2 border-primary/30 shadow-[0_0_20px_rgba(var(--primary),0.08)]">
          <Search className="size-5 text-primary/70 shrink-0" />
          <span className="text-base text-foreground flex-1 font-medium">{searchQuery}</span>
          <button className="size-7 rounded-full bg-muted-foreground/10 flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0">
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      {/* 结果区域 */}
      <div className="mt-5 flex-1 overflow-y-auto space-y-5">
        {/* 最近项目 */}
        {mockRecentDirs.length > 0 && (
          <div>
            <div className="flex items-center gap-2 px-1 mb-3">
              <Clock className="size-3.5 text-muted-foreground/40" />
              <span className="text-xs font-medium text-muted-foreground/60">最近项目</span>
            </div>
            <div className="space-y-2">
              {mockRecentDirs.map((dir) => (
                <button
                  key={dir}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl bg-gradient-to-r from-muted/50 to-muted/20 hover:from-muted/70 hover:to-muted/40 active:scale-[0.98] transition-all text-left"
                >
                  <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <FolderOpen className="size-5 text-primary/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{dir.split('/').pop()}</p>
                    <p className="text-[11px] text-muted-foreground/50 truncate mt-0.5">{dir}</p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground/20" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 搜索结果 */}
        <div>
          <div className="flex items-center gap-2 px-1 mb-3">
            <Command className="size-3.5 text-muted-foreground/40" />
            <span className="text-xs font-medium text-muted-foreground/60">搜索结果</span>
          </div>
          <div className="space-y-2">
            {mockSearchResults.map((item) => (
              <button
                key={item.path}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl bg-muted/30 hover:bg-muted/50 active:scale-[0.98] transition-all text-left"
              >
                <div className="size-11 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Folder className="size-5 text-muted-foreground/40" />
                </div>
                <div className="flex-1 min-w-0 text-sm">
                  <HighlightPath path={item.path} query={searchQuery} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </SheetContainer>
  )
}

// 方案 E：路径导航式 — 搜索框上方显示面包屑路径，结果项展开显示完整路径
function StyleBreadcrumbSearch() {
  const breadcrumbs = ['~', 'projects', 'docs']

  return (
    <SheetContainer>
      {/* 面包屑 + 搜索框 */}
      <div className="space-y-2">
        {/* 面包屑 */}
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground/50 overflow-hidden">
          {breadcrumbs.map((crumb, idx) => (
            <span key={crumb} className="flex items-center gap-1 shrink-0">
              {idx > 0 && <span className="text-muted-foreground/30">/</span>}
              <span className={cn(
                'px-1.5 py-0.5 rounded hover:bg-muted transition-colors cursor-pointer',
                idx === breadcrumbs.length - 1 && 'text-primary font-medium'
              )}>
                {crumb}
              </span>
            </span>
          ))}
        </div>
        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-primary/60 pointer-events-none" />
          <div className="flex h-10 w-full rounded-lg border border-primary/20 bg-primary/5 pl-9 pr-8 py-2 items-center">
            <span className="text-sm text-foreground font-medium">{searchQuery}</span>
          </div>
          <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground">
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      {/* 结果区域 */}
      <div className="mt-3 flex-1 overflow-y-auto space-y-4">
        {/* 最近项目 */}
        <div>
          <div className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-wider mb-2">最近项目</div>
          <div className="space-y-0">
            {mockRecentDirs.map((dir) => (
              <button
                key={dir}
                className="w-full flex items-start gap-2 px-2 py-2.5 rounded-lg hover:bg-accent text-left transition-colors group"
              >
                <FolderOpen className="size-4 shrink-0 text-primary/50 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground/40 mb-0.5">
                    <Navigation className="size-2.5" />
                    <span className="truncate">{dir.split('/').slice(0, -1).join('/')}</span>
                  </div>
                  <p className="text-sm text-foreground truncate">{dir.split('/').pop()}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 搜索结果 */}
        <div>
          <div className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-wider mb-2">搜索结果</div>
          <div className="space-y-0">
            {mockSearchResults.map((item) => {
              const parts = item.path.split('/')
              const name = parts.pop() || item.path
              return (
                <button
                  key={item.path}
                  className="w-full flex items-start gap-2 px-2 py-2.5 rounded-lg hover:bg-accent text-left transition-colors group"
                >
                  <Folder className="size-4 shrink-0 text-muted-foreground/30 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground/40 mb-0.5">
                      <Navigation className="size-2.5" />
                      <span className="truncate">{parts.join('/')}</span>
                    </div>
                    <p className="text-sm truncate">
                      <HighlightPath path={name} query={searchQuery} />
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </SheetContainer>
  )
}

// 方案 F：命令面板式 — 类似 VS Code/Cursor 命令面板，紧凑高效
function StyleCommandPalette() {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const allItems = [
    ...mockRecentDirs.map(d => ({ type: 'recent' as const, path: d })),
    ...mockSearchResults.map(r => ({ type: 'search' as const, path: r.path })),
  ]

  return (
    <SheetContainer>
      {/* 命令面板式搜索框 */}
      <div className="relative">
        <div className="flex items-center gap-2 h-10 px-3 rounded-lg bg-muted/50 border border-border/50">
          <Search className="size-4 text-muted-foreground/50 shrink-0" />
          <span className="text-sm text-foreground flex-1">{searchQuery}</span>
          <span className="text-[10px] text-muted-foreground/40 bg-muted px-1.5 py-0.5 rounded">ESC</span>
        </div>
      </div>

      {/* 紧凑结果列表 */}
      <div className="mt-2 flex-1 overflow-y-auto">
        {/* 分组标题 */}
        <div className="sticky top-0 bg-background z-10 px-2 py-1.5 text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-widest border-b border-border/20">
          最近项目
        </div>
        <div className="space-y-0">
          {mockRecentDirs.map((dir, idx) => (
            <button
              key={dir}
              onMouseEnter={() => setSelectedIdx(idx)}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors',
                selectedIdx === idx ? 'bg-primary/10' : 'hover:bg-muted/30'
              )}
            >
              <FolderOpen className={cn(
                'size-4 shrink-0',
                selectedIdx === idx ? 'text-primary/70' : 'text-muted-foreground/30'
              )} />
              <span className="text-sm truncate flex-1">{dir}</span>
              {selectedIdx === idx && (
                <span className="text-[10px] text-primary/60 shrink-0">Enter</span>
              )}
            </button>
          ))}
        </div>

        {/* 搜索结果 */}
        <div className="sticky top-0 bg-background z-10 px-2 py-1.5 text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-widest border-b border-border/20 mt-2">
          搜索结果
        </div>
        <div className="space-y-0">
          {mockSearchResults.map((item, idx) => (
            <button
              key={item.path}
              onMouseEnter={() => setSelectedIdx(idx + mockRecentDirs.length)}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors',
                selectedIdx === idx + mockRecentDirs.length ? 'bg-primary/10' : 'hover:bg-muted/30'
              )}
            >
              <Folder className={cn(
                'size-4 shrink-0',
                selectedIdx === idx + mockRecentDirs.length ? 'text-primary/70' : 'text-muted-foreground/30'
              )} />
              <div className="flex-1 min-w-0 text-sm">
                <HighlightPath path={item.path} query={searchQuery} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 底部快捷键提示 */}
      <div className="shrink-0 pt-2 mt-1 border-t border-border/20 flex items-center justify-between text-[10px] text-muted-foreground/30">
        <span>↑↓ 选择</span>
        <span>Enter 打开</span>
      </div>
    </SheetContainer>
  )
}

export const addDirSearchStylesCase: PlaygroundCase = {
  id: 'add-dir-search-styles',
  name: '打开项目搜索样式设计',
  description: '重新设计 AddDirDialog 中搜索框和搜索结果的视觉风格，包含匹配文字高亮',
  variants: [
    {
      name: '方案 A：胶囊搜索框',
      description: '搜索框为深色圆角胶囊，底部有阴影突出；结果项为独立圆角卡片，视觉冲击力强',
      component: <StyleCapsuleSearch />,
    },
    {
      name: '方案 B：底部沉浸搜索',
      description: '搜索框固定在底部类似聊天输入栏；结果区域全屏展开，顶部显示匹配统计',
      component: <StyleBottomImmersive />,
    },
    {
      name: '方案 C：芯片过滤式',
      description: '搜索框下方有过滤芯片（全部/projects/docs），结果项显示路径面包屑和文件夹名分离',
      component: <StyleChipSearch />,
    },
    {
      name: '方案 D：大搜索框聚焦',
      description: '搜索框占主导视觉，带发光边框效果；结果项为大号圆角卡片，图标更大',
      component: <StyleFocusedSearch />,
    },
    {
      name: '方案 E：路径导航式',
      description: '搜索框上方有面包屑路径导航，结果项展开显示父路径和文件夹名',
      component: <StyleBreadcrumbSearch />,
    },
    {
      name: '方案 F：命令面板式',
      description: '类似 VS Code 命令面板的紧凑风格，支持键盘导航高亮，底部有快捷键提示',
      component: <StyleCommandPalette />,
    },
  ],
}
