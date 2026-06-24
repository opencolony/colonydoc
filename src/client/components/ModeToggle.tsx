import { BookOpen, Pencil, Code } from 'lucide-react'
import { cn } from '../lib/utils'

export type EditorMode = 'wysiwyg' | 'source' | 'read'

interface ModeToggleCompactProps {
  mode: EditorMode
  onChange: (mode: EditorMode) => void
  /** 紧凑尺寸，移动端用 md，桌面端用 sm */
  size?: 'sm' | 'md'
}

/**
 * 模式切换紧凑按钮组：编辑/阅读 + 源码
 * - 主按钮在阅读/编辑之间切换（最常用场景）
 * - 源码作为独立次级按钮
 */
export function ModeToggleCompact({ mode, onChange, size = 'md' }: ModeToggleCompactProps) {
  const isRead = mode === 'read'
  const containerSize = size === 'md' ? 'rounded-md p-0.5' : 'rounded p-0.5'
  const btnSize = size === 'md' ? 'size-8' : 'size-6'
  const iconSize = size === 'md' ? 'size-4' : 'size-3.5'

  return (
    <div
      className={cn(
        'inline-flex items-center bg-muted border border-border shrink-0',
        containerSize
      )}
      role="group"
      aria-label="编辑器模式"
    >
      <button
        type="button"
        onClick={() => onChange(isRead ? 'wysiwyg' : 'read')}
        title={isRead ? '切换到编辑模式' : '切换到阅读模式'}
        aria-pressed={isRead}
        className={cn(
          'flex items-center justify-center rounded transition-all duration-150',
          btnSize,
          isRead
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        {isRead ? <BookOpen className={iconSize} /> : <Pencil className={iconSize} />}
      </button>
      <button
        type="button"
        onClick={() => onChange(mode === 'source' ? 'wysiwyg' : 'source')}
        title="源码模式"
        aria-pressed={mode === 'source'}
        className={cn(
          'flex items-center justify-center rounded transition-all duration-150',
          btnSize,
          mode === 'source'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Code className={iconSize} />
      </button>
    </div>
  )
}
