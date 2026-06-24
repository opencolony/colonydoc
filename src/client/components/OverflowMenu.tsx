import { useEffect, useRef, useState } from 'react'
import { cn } from '../lib/utils'

interface OverflowMenuProps {
  /** 触发按钮内容（图标等） */
  trigger: React.ReactNode
  /** Popover 弹层内容 */
  children: React.ReactNode
  /** 触发按钮的额外 className */
  triggerClassName?: string
  /** 弹层对齐方向，默认 end（右对齐） */
  align?: 'start' | 'end'
  /** 弹层宽度（Tailwind 类，如 w-56） */
  contentClassName?: string
  /** 触发按钮的 aria-label */
  title?: string
}

/**
 * 轻量级下拉菜单组件（不引入 Radix Popover）
 * - 点击触发器切换 open
 * - 点击外部或按 Esc 关闭
 * - 移动端和桌面端共用，移动端额外增加 safe-area inset
 */
export function OverflowMenu({
  trigger,
  children,
  triggerClassName,
  align = 'end',
  contentClassName,
  title,
}: OverflowMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    // 使用 mousedown 早于 onClick，避免快速点击外部时内容已被渲染
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        title={title}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'inline-flex items-center justify-center transition-colors',
          triggerClassName
        )}
      >
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            'absolute top-full mt-1 z-50 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg p-1 text-sm min-w-[12rem]',
            'animate-fade-in',
            align === 'end' ? 'right-0' : 'left-0',
            contentClassName
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}

interface OverflowMenuItemProps {
  onSelect?: () => void
  icon?: React.ReactNode
  label: React.ReactNode
  shortcut?: string
  active?: boolean
  destructive?: boolean
  disabled?: boolean
}

/** OverflowMenu 的标准菜单项 */
export function OverflowMenuItem({
  onSelect,
  icon,
  label,
  shortcut,
  active,
  destructive,
  disabled,
}: OverflowMenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={() => {
        if (disabled) return
        onSelect?.()
      }}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-left',
        'focus:outline-none focus:bg-muted',
        active && 'bg-muted text-foreground',
        !active && !destructive && 'text-foreground hover:bg-muted',
        destructive && 'text-destructive hover:bg-destructive/10',
        disabled && 'opacity-50 pointer-events-none'
      )}
    >
      {icon && <span className={cn('shrink-0', active ? 'text-foreground' : 'text-muted-foreground')}>{icon}</span>}
      <span className="flex-1 truncate">{label}</span>
      {shortcut && (
        <span className="ml-auto text-[10px] text-muted-foreground font-mono shrink-0">
          {shortcut}
        </span>
      )}
    </button>
  )
}

/** OverflowMenu 分隔线 */
export function OverflowMenuSeparator() {
  return <div className="my-1 h-px bg-border mx-1" />
}
