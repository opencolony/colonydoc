import { useState } from 'react'
import {
  List,
  Search,
  BookOpen,
  Pencil,
  Code,
  History,
  MoreHorizontal,
  MoreVertical,
  Settings,
  Sun,
  Moon,
  Monitor,
  ChevronDown,
  X,
  Layers,
  PanelRight,
} from 'lucide-react'
import { cn } from '../../../lib/utils'
import type { PlaygroundCase } from '../types'

type EditorMode = 'wysiwyg' | 'source' | 'read'
type ThemeMode = 'light' | 'dark' | 'system'

/** 移动端 375px 视口模拟 */
function MobileViewport({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background">
      <div className="bg-muted/40 px-3 py-1.5 text-[10px] text-muted-foreground font-mono border-b border-border">
        {label} — 375px 视口
      </div>
      <div className="w-[375px] max-w-full">{children}</div>
    </div>
  )
}

/** 桌面端 1100px 视口模拟 */
function DesktopViewport({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background">
      <div className="bg-muted/40 px-3 py-1.5 text-[10px] text-muted-foreground font-mono border-b border-border">
        {label} — 1100px 视口
      </div>
      <div className="w-[1100px] max-w-full">{children}</div>
    </div>
  )
}

/** 演示用底色 */
function MockBody() {
  return (
    <div className="px-4 py-8 text-xs text-muted-foreground">
      <div className="space-y-2 opacity-60">
        <div className="h-2 bg-muted rounded w-3/4" />
        <div className="h-2 bg-muted rounded w-full" />
        <div className="h-2 bg-muted rounded w-5/6" />
        <div className="h-2 bg-muted rounded w-4/5" />
      </div>
    </div>
  )
}

/** 共享的模式切换按钮组（方案 C 风格，双态 + 源码） */
function ModeToggleCompact({ mode, onChange }: { mode: EditorMode; onChange: (m: EditorMode) => void }) {
  const isRead = mode === 'read'
  return (
    <div className="inline-flex items-center rounded-md bg-muted p-0.5 border border-border">
      <button
        onClick={() => onChange(isRead ? 'wysiwyg' : 'read')}
        title={isRead ? '切换到编辑' : '切换到阅读'}
        className={cn(
          'flex items-center justify-center size-7 rounded transition-all duration-150',
          isRead
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        {isRead ? <BookOpen className="size-3.5" /> : <Pencil className="size-3.5" />}
      </button>
      <button
        onClick={() => onChange('source')}
        title="源码模式"
        className={cn(
          'flex items-center justify-center size-7 rounded transition-all duration-150',
          mode === 'source'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Code className="size-3.5" />
      </button>
    </div>
  )
}

/** 主题按钮（演示用） */
function ThemeIcon({ mode }: { mode: ThemeMode }) {
  if (mode === 'dark') return <Sun className="size-4" />
  if (mode === 'system') return <Monitor className="size-4" />
  return <Moon className="size-4" />
}

// ───────────────────────────────────────────────
// 方案 A：极简顶栏 + 溢出菜单（⋮ Overflow Menu）
// ───────────────────────────────────────────────
function SolutionA_Mobile() {
  const [mode, setMode] = useState<EditorMode>('wysiwyg')
  const [menuOpen, setMenuOpen] = useState(false)
  const [theme, setTheme] = useState<ThemeMode>('system')

  return (
    <MobileViewport label="方案 A · 移动端：菜单 + 标题 + 模式组 + ⋯ 溢出">
      <header className="relative flex items-center px-2 py-2 border-b border-border bg-background">
        <button className="flex items-center justify-center size-9 rounded-md text-muted-foreground hover:bg-muted" title="菜单">
          <List className="size-5" />
        </button>
        <div className="flex-1 px-2 text-sm font-semibold truncate text-center">
          README.md
        </div>
        <ModeToggleCompact mode={mode} onChange={setMode} />
        <button
          onClick={() => setMenuOpen(o => !o)}
          className={cn(
            'flex items-center justify-center size-9 rounded-md ml-0.5',
            menuOpen ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted'
          )}
          title="更多"
        >
          <MoreVertical className="size-5" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-1 top-full mt-1 z-40 w-56 rounded-lg border border-border bg-popover shadow-lg p-1 text-sm">
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-foreground">
                <Search className="size-4 text-muted-foreground" />
                <span>搜索</span>
                <span className="ml-auto text-[10px] text-muted-foreground font-mono">⌘K</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-foreground">
                <PanelRight className="size-4 text-muted-foreground" />
                <span>大纲</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-foreground">
                <History className="size-4 text-muted-foreground" />
                <span>历史版本</span>
              </button>
              <div className="my-1 border-t border-border" />
              <button
                onClick={() => setTheme(t => t === 'light' ? 'dark' : t === 'dark' ? 'system' : 'light')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-foreground"
              >
                <ThemeIcon mode={theme} />
                <span>主题：{theme === 'light' ? '浅色' : theme === 'dark' ? '深色' : '跟随系统'}</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-foreground">
                <Settings className="size-4 text-muted-foreground" />
                <span>设置</span>
              </button>
            </div>
          </>
        )}
      </header>
      <MockBody />
    </MobileViewport>
  )
}

function SolutionA_Desktop() {
  const [mode, setMode] = useState<EditorMode>('wysiwyg')
  const [menuOpen, setMenuOpen] = useState(false)
  const [theme, setTheme] = useState<ThemeMode>('system')

  return (
    <DesktopViewport label="方案 A · 桌面端 TabBar 右侧：状态 + 大纲 + 搜索 + 模式 + ⋯ 溢出">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-background">
        <div className="flex items-center gap-1">
          <span className="px-2 py-0.5 text-[10px] rounded bg-primary/10 text-primary font-medium">已保存</span>
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">project-overview.md</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="flex items-center justify-center size-7 rounded text-muted-foreground hover:bg-muted" title="大纲">
            <PanelRight className="size-4" />
          </button>
          <button className="flex items-center justify-center size-7 rounded text-muted-foreground hover:bg-muted" title="搜索">
            <Search className="size-4" />
          </button>
          <ModeToggleCompact mode={mode} onChange={setMode} />
          <button className="flex items-center justify-center size-7 rounded text-muted-foreground hover:bg-muted" title="历史版本">
            <History className="size-4" />
          </button>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(o => !o)}
              className={cn(
                'flex items-center justify-center size-7 rounded',
                menuOpen ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted'
              )}
              title="更多"
            >
              <MoreHorizontal className="size-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-40 w-52 rounded-lg border border-border bg-popover shadow-lg p-1 text-sm">
                  <button
                    onClick={() => setTheme(t => t === 'light' ? 'dark' : t === 'dark' ? 'system' : 'light')}
                    className="w-full flex items-center gap-3 px-3 py-1.5 rounded-md hover:bg-muted text-foreground"
                  >
                    <ThemeIcon mode={theme} />
                    <span>主题：{theme === 'light' ? '浅色' : theme === 'dark' ? '深色' : '跟随系统'}</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-1.5 rounded-md hover:bg-muted text-foreground">
                    <Settings className="size-4 text-muted-foreground" />
                    <span>设置</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <MockBody />
    </DesktopViewport>
  )
}

// ───────────────────────────────────────────────
// 方案 B：双层顶栏（核心行 + 搜索行）
// ───────────────────────────────────────────────
function SolutionB_Mobile() {
  const [mode, setMode] = useState<EditorMode>('wysiwyg')

  return (
    <MobileViewport label="方案 B · 移动端：第一行精简 + 第二行可滚动工具条">
      <header className="flex flex-col border-b border-border bg-background">
        <div className="flex items-center px-2 py-1.5">
          <button className="flex items-center justify-center size-9 rounded-md text-muted-foreground hover:bg-muted" title="菜单">
            <List className="size-5" />
          </button>
          <div className="flex-1 px-2 text-sm font-semibold truncate">README.md</div>
          <ModeToggleCompact mode={mode} onChange={setMode} />
          <button className="flex items-center justify-center size-9 rounded-md ml-0.5 text-muted-foreground hover:bg-muted" title="搜索">
            <Search className="size-5" />
          </button>
        </div>
        <div className="flex items-center gap-1 px-2 pb-2 overflow-x-auto">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-muted text-muted-foreground border border-border shrink-0">
            <PanelRight className="size-3.5" />
            <span>大纲</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-muted text-muted-foreground border border-border shrink-0">
            <History className="size-3.5" />
            <span>历史</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-muted text-muted-foreground border border-border shrink-0">
            <Moon className="size-3.5" />
            <span>主题</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-muted text-muted-foreground border border-border shrink-0">
            <Settings className="size-3.5" />
            <span>设置</span>
          </button>
          <span className="text-[10px] text-muted-foreground/50 shrink-0 px-2">← 可滑动 →</span>
        </div>
      </header>
      <MockBody />
    </MobileViewport>
  )
}

function SolutionB_Desktop() {
  const [mode, setMode] = useState<EditorMode>('wysiwyg')

  return (
    <DesktopViewport label="方案 B · 桌面端：保留 TabBar 右侧布局，但收纳工具按钮到分段组">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-background">
        <div className="flex items-center gap-1">
          <span className="px-2 py-0.5 text-[10px] rounded bg-primary/10 text-primary font-medium">已保存</span>
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">project-overview.md</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-md bg-muted/50 border border-border p-0.5">
            <button className="flex items-center justify-center size-6 rounded text-muted-foreground hover:bg-background hover:text-foreground" title="大纲">
              <PanelRight className="size-3.5" />
            </button>
            <button className="flex items-center justify-center size-6 rounded text-muted-foreground hover:bg-background hover:text-foreground" title="搜索">
              <Search className="size-3.5" />
            </button>
            <button className="flex items-center justify-center size-6 rounded text-muted-foreground hover:bg-background hover:text-foreground" title="历史">
              <History className="size-3.5" />
            </button>
          </div>
          <ModeToggleCompact mode={mode} onChange={setMode} />
        </div>
      </div>
      <MockBody />
    </DesktopViewport>
  )
}

// ───────────────────────────────────────────────
// 方案 C：滑动抽屉式（长按标题/下拉触发底部 Sheet）
// ───────────────────────────────────────────────
function SolutionC_Mobile() {
  const [mode, setMode] = useState<EditorMode>('wysiwyg')
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <MobileViewport label="方案 C · 移动端：标题可点击下拉 + 顶栏底部 Sheet 收纳次要功能">
      <header className="flex flex-col border-b border-border bg-background">
        <div className="flex items-center px-2 py-1.5">
          <button className="flex items-center justify-center size-9 rounded-md text-muted-foreground hover:bg-muted" title="菜单">
            <List className="size-5" />
          </button>
          <button
            onClick={() => setSheetOpen(true)}
            className="flex-1 flex items-center justify-center gap-1 px-2 text-sm font-semibold text-foreground"
          >
            <span className="truncate max-w-[180px]">README.md</span>
            <ChevronDown className="size-4 text-muted-foreground shrink-0" />
          </button>
          <button className="flex items-center justify-center size-9 rounded-md text-muted-foreground hover:bg-muted" title="搜索">
            <Search className="size-5" />
          </button>
          <ModeToggleCompact mode={mode} onChange={setMode} />
        </div>

        {sheetOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/60 animate-fade-in" onClick={() => setSheetOpen(false)} />
            <div className="fixed inset-x-0 top-0 z-50 bg-popover border-b border-border rounded-b-2xl shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="text-sm font-medium">文档工具</span>
                <button onClick={() => setSheetOpen(false)} className="size-7 rounded-md hover:bg-muted flex items-center justify-center">
                  <X className="size-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 p-4">
                {[
                  { icon: PanelRight, label: '大纲' },
                  { icon: History, label: '历史' },
                  { icon: Moon, label: '主题' },
                  { icon: Settings, label: '设置' },
                  { icon: Layers, label: '文件树' },
                  { icon: Code, label: '源码' },
                ].map((item) => (
                  <button
                    key={item.label}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-lg hover:bg-muted text-foreground"
                  >
                    <item.icon className="size-5 text-muted-foreground" />
                    <span className="text-xs">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </header>
      <MockBody />
    </MobileViewport>
  )
}

function SolutionC_Desktop() {
  const [mode, setMode] = useState<EditorMode>('wysiwyg')
  const [popoverOpen, setPopoverOpen] = useState(false)

  return (
    <DesktopViewport label="方案 C · 桌面端：标题下拉 + Popover 收纳设置/主题">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-background">
        <div className="flex items-center gap-1">
          <span className="px-2 py-0.5 text-[10px] rounded bg-primary/10 text-primary font-medium">已保存</span>
          <div className="relative">
            <button
              onClick={() => setPopoverOpen(o => !o)}
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-muted text-xs"
            >
              <span className="truncate max-w-[260px]">project-overview.md</span>
              <ChevronDown className="size-3 text-muted-foreground" />
            </button>
            {popoverOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setPopoverOpen(false)} />
                <div className="absolute left-0 top-full mt-1 z-40 w-64 rounded-lg border border-border bg-popover shadow-lg p-1 text-sm">
                  <div className="px-3 py-1.5 text-[10px] text-muted-foreground uppercase tracking-wider">文档</div>
                  <button className="w-full flex items-center gap-3 px-3 py-1.5 rounded-md hover:bg-muted">
                    <PanelRight className="size-4 text-muted-foreground" />
                    <span>大纲</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-1.5 rounded-md hover:bg-muted">
                    <History className="size-4 text-muted-foreground" />
                    <span>历史版本</span>
                  </button>
                  <div className="my-1 border-t border-border" />
                  <div className="px-3 py-1.5 text-[10px] text-muted-foreground uppercase tracking-wider">偏好</div>
                  <button className="w-full flex items-center gap-3 px-3 py-1.5 rounded-md hover:bg-muted">
                    <Moon className="size-4 text-muted-foreground" />
                    <span>切换主题</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-1.5 rounded-md hover:bg-muted">
                    <Settings className="size-4 text-muted-foreground" />
                    <span>设置</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="flex items-center justify-center size-7 rounded text-muted-foreground hover:bg-muted" title="大纲">
            <PanelRight className="size-4" />
          </button>
          <button className="flex items-center justify-center size-7 rounded text-muted-foreground hover:bg-muted" title="搜索">
            <Search className="size-4" />
          </button>
          <ModeToggleCompact mode={mode} onChange={setMode} />
          <button className="flex items-center justify-center size-7 rounded text-muted-foreground hover:bg-muted" title="历史">
            <History className="size-4" />
          </button>
        </div>
      </div>
      <MockBody />
    </DesktopViewport>
  )
}

// ───────────────────────────────────────────────
// 方案 D：FAB 浮动操作按钮（顶栏极简 + 右下浮动 ⋯）
// ───────────────────────────────────────────────
function SolutionD_Mobile() {
  const [mode, setMode] = useState<EditorMode>('wysiwyg')
  const [fabOpen, setFabOpen] = useState(false)

  return (
    <MobileViewport label="方案 D · 移动端：顶栏极简 4 项 + 右下 FAB 浮动按钮收纳次要功能">
      <div className="relative">
        <header className="flex items-center px-2 py-2 border-b border-border bg-background">
          <button className="flex items-center justify-center size-9 rounded-md text-muted-foreground hover:bg-muted" title="菜单">
            <List className="size-5" />
          </button>
          <div className="flex-1 px-2 text-sm font-semibold truncate">README.md</div>
          <button className="flex items-center justify-center size-9 rounded-md text-muted-foreground hover:bg-muted" title="搜索">
            <Search className="size-5" />
          </button>
          <ModeToggleCompact mode={mode} onChange={setMode} />
        </header>
        <MockBody />

        {/* FAB */}
        <div className="absolute bottom-4 right-4 z-30">
          {fabOpen && (
            <div className="absolute bottom-14 right-0 flex flex-col gap-2 items-end">
              {[
                { icon: PanelRight, label: '大纲' },
                { icon: History, label: '历史' },
                { icon: Moon, label: '主题' },
                { icon: Settings, label: '设置' },
              ].map((item) => (
                <button
                  key={item.label}
                  className="flex items-center gap-2 pl-3 pr-4 py-2 rounded-full bg-popover border border-border shadow-lg hover:bg-muted text-sm"
                >
                  <item.icon className="size-4 text-muted-foreground" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setFabOpen(o => !o)}
            className={cn(
              'flex items-center justify-center size-12 rounded-full shadow-lg border border-border transition-all',
              fabOpen ? 'bg-foreground text-background rotate-45' : 'bg-primary text-primary-foreground'
            )}
          >
            <MoreHorizontal className="size-5" />
          </button>
        </div>

        {fabOpen && <div className="fixed inset-0 z-20 bg-black/30" onClick={() => setFabOpen(false)} />}
      </div>
    </MobileViewport>
  )
}

function SolutionD_Desktop() {
  const [mode, setMode] = useState<EditorMode>('wysiwyg')

  return (
    <DesktopViewport label="方案 D · 桌面端：保持现状略调，去掉视觉冗余">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-background">
        <div className="flex items-center gap-1">
          <span className="px-2 py-0.5 text-[10px] rounded bg-primary/10 text-primary font-medium">已保存</span>
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">project-overview.md</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="flex items-center justify-center size-7 rounded text-muted-foreground hover:bg-muted" title="大纲">
            <PanelRight className="size-4" />
          </button>
          <button className="flex items-center justify-center size-7 rounded text-muted-foreground hover:bg-muted" title="搜索">
            <Search className="size-4" />
          </button>
          <ModeToggleCompact mode={mode} onChange={setMode} />
          <button className="flex items-center justify-center size-7 rounded text-muted-foreground hover:bg-muted" title="历史">
            <History className="size-4" />
          </button>
        </div>
      </div>
      <MockBody />
    </DesktopViewport>
  )
}

// ───────────────────────────────────────────────
// 案例导出
// ───────────────────────────────────────────────
export const topbarRedesignCase: PlaygroundCase = {
  id: 'topbar-redesign',
  name: '顶栏按钮重新设计',
  description: '解决移动端 5+ 图标按钮溢出、桌面端按钮组密集问题。功能保留：菜单/搜索/大纲/历史/模式切换/设置/主题',
  variants: [
    {
      name: '方案 A：极简顶栏 + ⋯ 溢出菜单',
      description: '顶栏只保留 4 个最常用元素（菜单 / 标题 / 模式组 / ⋯），其它功能收纳到 ⋯ 弹出的下拉菜单。移动端和桌面端共用模式，状态文字/历史/大纲/搜索按场景保留',
      component: (
        <div className="flex flex-col gap-4">
          <SolutionA_Mobile />
          <SolutionA_Desktop />
        </div>
      ),
    },
    {
      name: '方案 B：双层顶栏（核心行 + 工具行）',
      description: '第一行：菜单/标题/模式/搜索；第二行：横向可滑动的 chip 工具按钮组（大纲/历史/主题/设置）。桌面端把按钮收纳到分段组',
      component: (
        <div className="flex flex-col gap-4">
          <SolutionB_Mobile />
          <SolutionB_Desktop />
        </div>
      ),
    },
    {
      name: '方案 C：标题下拉 + 顶部抽屉',
      description: '标题可点击下拉，弹出从顶部下沉的抽屉式 Sheet（含网格图标按钮）。桌面端改为文件名前的 Popover',
      component: (
        <div className="flex flex-col gap-4">
          <SolutionC_Mobile />
          <SolutionC_Desktop />
        </div>
      ),
    },
    {
      name: '方案 D：FAB 浮动操作按钮',
      description: '顶栏极致精简（4 项），右下角放浮动操作按钮（FAB），点击展开大纲/历史/主题/设置的功能列',
      component: (
        <div className="flex flex-col gap-4">
          <SolutionD_Mobile />
          <SolutionD_Desktop />
        </div>
      ),
    },
  ],
}
