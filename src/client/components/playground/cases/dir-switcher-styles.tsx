import { useState } from 'react'
import { Plus, FolderOpen, AlertCircle } from 'lucide-react'
import { cn } from '@/client/lib/utils'
import type { PlaygroundCase } from '../types'

// 模拟数据
interface MockProject {
  path: string
  name: string
  color: string
  error?: string
}

const mockProjects: MockProject[] = [
  { path: '/home/user/workspace', name: 'workspace', color: '#2563eb' },
  { path: '/home/user/brain', name: 'brain', color: '#059669' },
  { path: '/home/user/notes', name: 'notes', color: '#d97706' },
]

const mockProjectsWithError: MockProject[] = [
  { path: '/home/user/workspace', name: 'workspace', color: '#2563eb' },
  { path: '/home/user/brain', name: 'brain', color: '#059669', error: '目录不存在' },
]

// 通用容器
function SwitcherContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border shrink-0 overflow-x-auto scrollbar-none"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {children}
      </div>
    </div>
  )
}

// 通用 tooltip
function Tooltip({ text }: { text: string }) {
  return (
    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
      {text}
    </span>
  )
}

// 方案 A：圆角胶囊式
function StylePill() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [projects] = useState(mockProjects)

  return (
    <SwitcherContainer>
      {projects.map((project, idx) => (
        <button
          key={project.path}
          onClick={() => setActiveIndex(idx)}
          className={cn(
            'relative group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 shrink-0',
            activeIndex === idx
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
          title={project.path}
        >
          <span
            className={cn('size-1.5 rounded-full shrink-0', activeIndex === idx ? 'bg-primary-foreground/70' : 'bg-muted-foreground/40')}
            style={{ backgroundColor: activeIndex === idx ? undefined : project.color }}
          />
          <span className="truncate max-w-[80px]">{project.name}</span>
          <Tooltip text={project.path} />
        </button>
      ))}
      <button
        className="flex items-center justify-center size-7 rounded-full border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors shrink-0"
        title="添加目录"
      >
        <Plus className="size-3.5" />
      </button>
    </SwitcherContainer>
  )
}

// 方案 B：下划线指示器式
function StyleUnderline() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [projects] = useState(mockProjects)

  return (
    <SwitcherContainer>
      {projects.map((project, idx) => (
        <button
          key={project.path}
          onClick={() => setActiveIndex(idx)}
          className={cn(
            'relative group flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium transition-colors shrink-0',
            activeIndex === idx
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground/80'
          )}
        >
          <span className="truncate max-w-[80px]">{project.name}</span>
          <span
            className={cn(
              'absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all duration-200',
              activeIndex === idx ? 'w-4/5' : 'w-0'
            )}
            style={{ backgroundColor: activeIndex === idx ? project.color : undefined }}
          />
          <Tooltip text={project.path} />
        </button>
      ))}
      <button
        className="flex items-center gap-1 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
        title="添加目录"
      >
        <Plus className="size-3" />
        <span className="hidden sm:inline">添加</span>
      </button>
    </SwitcherContainer>
  )
}

// 方案 C：Segmented Control 式
function StyleSegmented() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [projects] = useState(mockProjectsWithError)

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-muted/50 overflow-x-auto scrollbar-none"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {projects.map((project, idx) => (
            <button
              key={project.path}
              onClick={() => setActiveIndex(idx)}
              className={cn(
                'relative group flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150 shrink-0',
                activeIndex === idx
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground/80',
                project.error && activeIndex !== idx && 'text-destructive/70'
              )}
              title={project.error || project.path}
            >
              {project.error && (
                <AlertCircle className="size-3 text-destructive shrink-0" />
              )}
              <span className="truncate max-w-[80px]">{project.name}</span>
            </button>
          ))}
        </div>
        <button
          className="flex items-center justify-center size-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
          title="添加目录"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

// 方案 D：文件夹图标式
function StyleFolder() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [projects] = useState(mockProjects)

  return (
    <SwitcherContainer>
      {projects.map((project, idx) => (
        <button
          key={project.path}
          onClick={() => setActiveIndex(idx)}
          className={cn(
            'relative group flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs transition-all duration-150 shrink-0',
            activeIndex === idx
              ? 'text-primary font-medium bg-primary/5'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
          )}
        >
          <FolderOpen
            className={cn('size-3.5 shrink-0', activeIndex === idx ? 'text-primary' : 'text-muted-foreground/60')}
          />
          <span className="truncate max-w-[80px]">{project.name}</span>
          <Tooltip text={project.path} />
        </button>
      ))}
      <button
        className="flex items-center gap-1 px-2 py-1 rounded-md border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors text-xs shrink-0"
        title="添加目录"
      >
        <Plus className="size-3" />
        <span>添加</span>
      </button>
    </SwitcherContainer>
  )
}

// 方案 E：彩色标签式
function StyleColorTag() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [projects] = useState(mockProjects)

  return (
    <SwitcherContainer>
      {projects.map((project, idx) => (
        <button
          key={project.path}
          onClick={() => setActiveIndex(idx)}
          className={cn(
            'relative group flex items-center gap-2 pl-3 pr-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 border shrink-0',
            activeIndex === idx
              ? 'bg-background shadow-sm'
              : 'bg-transparent hover:bg-muted/20'
          )}
          style={{
            borderColor: activeIndex === idx ? project.color + '40' : 'transparent',
            color: activeIndex === idx ? project.color : undefined,
          }}
          title={project.path}
        >
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full"
            style={{ backgroundColor: project.color }}
          />
          <span className="truncate max-w-[80px]">{project.name}</span>
          <Tooltip text={project.path} />
        </button>
      ))}
      <button
        className="flex items-center justify-center px-2 py-1.5 rounded-md border border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors text-xs shrink-0"
        title="添加目录"
      >
        <Plus className="size-3.5 mr-1" />
        添加
      </button>
    </SwitcherContainer>
  )
}

// 方案 F：极简文字式
function StyleMinimal() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [projects] = useState(mockProjects)

  return (
    <SwitcherContainer>
      {projects.map((project, idx) => (
        <div key={project.path} className="flex items-center shrink-0">
          {idx > 0 && (
            <span className="text-muted-foreground/30 mx-1 text-xs select-none">·</span>
          )}
          <button
            onClick={() => setActiveIndex(idx)}
            className={cn(
              'relative group px-1 py-1.5 text-xs transition-colors shrink-0',
              activeIndex === idx
                ? 'text-foreground font-semibold'
                : 'text-muted-foreground/70 hover:text-muted-foreground'
            )}
            title={project.path}
          >
            {project.name}
            <Tooltip text={project.path} />
          </button>
        </div>
      ))}
      <span className="text-muted-foreground/30 mx-1 text-xs select-none">·</span>
      <button
        className="px-1 py-1.5 text-xs text-muted-foreground/60 hover:text-foreground transition-colors shrink-0"
        title="添加目录"
      >
        + 添加
      </button>
    </SwitcherContainer>
  )
}

export const dirSwitcherStylesCase: PlaygroundCase = {
  id: 'dir-switcher-styles',
  name: '目录切换器样式设计',
  description: '重新设计侧边栏项目列表（目录切换器）的视觉风格，点击项目可切换激活态',
  variants: [
    {
      name: '方案 A：圆角胶囊式',
      description: '圆角胶囊标签，激活态实心填充，每个项目有彩色小圆点标识',
      component: <StylePill />,
    },
    {
      name: '方案 B：下划线指示器式',
      description: '无背景色平铺文字，激活态底部有彩色下划线滑动动画',
      component: <StyleUnderline />,
    },
    {
      name: '方案 C：Segmented Control 式',
      description: '整体包裹在灰色背景容器中，激活项像浮起的白色卡片，带错误状态',
      component: <StyleSegmented />,
    },
    {
      name: '方案 D：文件夹图标式',
      description: '每个项目前有文件夹图标，激活态图标和文字变为 primary 色',
      component: <StyleFolder />,
    },
    {
      name: '方案 E：彩色标签式',
      description: '每个项目左侧有彩色竖条标识，激活态边框带对应颜色',
      component: <StyleColorTag />,
    },
    {
      name: '方案 F：极简文字式',
      description: '纯文字列表无背景，用 · 分隔，激活态加粗，最简洁克制',
      component: <StyleMinimal />,
    },
  ],
}
