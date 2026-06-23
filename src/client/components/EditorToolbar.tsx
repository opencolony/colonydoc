import { type Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  ChevronDown,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Code,
  Copy,
  Undo2,
  Redo2,
  BookmarkPlus,
  Check,
  Loader2,
} from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'

interface EditorToolbarProps {
  editor: Editor | null
  variant?: 'desktop' | 'mobile'
  path?: string | null
  rootPath?: string | null
}

interface ToolbarButtonConfig {
  icon: React.ComponentType<{ className?: string }>
  label: string
  isActive: (editor: Editor) => boolean
  action: (editor: Editor) => void
}

const HEADING_LEVELS = [
  { level: 0, label: '正文' },
  { level: 1, label: 'H1' },
  { level: 2, label: 'H2' },
  { level: 3, label: 'H3' },
  { level: 4, label: 'H4' },
  { level: 5, label: 'H5' },
  { level: 6, label: 'H6' },
] as const

interface HeadingDropdownProps {
  editor: Editor
  variant?: 'desktop' | 'mobile'
}

function HeadingDropdown({ editor, variant = 'desktop' }: HeadingDropdownProps) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentLevel = (() => {
    for (let i = 1; i <= 6; i++) {
      if (editor.isActive('heading', { level: i })) return i
    }
    return 0
  })()

  const currentLabel = HEADING_LEVELS.find(h => h.level === currentLevel)?.label || '正文'

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const selectHeading = (level: number) => {
    if (level === 0) {
      editor.chain().focus().setParagraph().run()
    } else {
      editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run()
    }
    setOpen(false)
  }

  return (
    <div className="editor-toolbar-heading" ref={dropdownRef}>
      <button
        type="button"
        contentEditable={false}
        className={`editor-toolbar-btn editor-toolbar-btn-heading ${open ? 'open' : ''} ${currentLevel > 0 ? 'active' : ''}`}
        onClick={() => setOpen(!open)}
        title="标题"
        aria-expanded={open}
      >
        <span className="editor-toolbar-btn-heading-label">{currentLabel}</span>
        <ChevronDown className="size-3" />
      </button>
      {open && (
        <div className={`editor-toolbar-dropdown-menu ${variant === 'mobile' ? 'editor-toolbar-dropdown-menu-mobile' : ''}`}>
          {HEADING_LEVELS.map(h => {
            const isActive = h.level === currentLevel
            return (
              <button
                key={h.level}
                type="button"
                contentEditable={false}
                className={`editor-toolbar-dropdown-item ${isActive ? 'active' : ''}`}
                onClick={() => selectHeading(h.level)}
              >
                <span className={`heading-label heading-${h.level}`}>{h.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

const toolbarButtons: ToolbarButtonConfig[] = [
  {
    icon: Bold,
    label: '粗体',
    isActive: (editor) => editor.isActive('bold'),
    action: (editor) => editor.chain().focus().toggleBold().run(),
  },
  {
    icon: Italic,
    label: '斜体',
    isActive: (editor) => editor.isActive('italic'),
    action: (editor) => editor.chain().focus().toggleItalic().run(),
  },
  {
    icon: List,
    label: '无序列表',
    isActive: (editor) => editor.isActive('bulletList'),
    action: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    icon: ListOrdered,
    label: '有序列表',
    isActive: (editor) => editor.isActive('orderedList'),
    action: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    icon: ListTodo,
    label: '任务列表',
    isActive: (editor) => editor.isActive('taskList'),
    action: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    icon: Quote,
    label: '引用',
    isActive: (editor) => editor.isActive('blockquote'),
    action: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    icon: Code,
    label: '代码块',
    isActive: (editor) => editor.isActive('codeBlock'),
    action: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
]

export function EditorToolbar({ editor, variant = 'mobile', path, rootPath }: EditorToolbarProps) {
  if (!editor) {
    return null
  }

  // 强制工具栏在每次 editor transaction 后重新渲染，确保 undo/redo 可用状态及时更新
  const [, forceUpdate] = useState({})
  useEffect(() => {
    const handler = () => forceUpdate({})
    editor.on('transaction', handler)
    return () => {
      editor.off('transaction', handler)
    }
  }, [editor])

  const [copied, setCopied] = useState(false)
  const [savingVersion, setSavingVersion] = useState(false)
  const [versionSaved, setVersionSaved] = useState(false)

  const handleSaveVersion = useCallback(async () => {
    if (!path || savingVersion) return
    setSavingVersion(true)
    setVersionSaved(false)
    try {
      const queryParams = new URLSearchParams()
      if (rootPath) queryParams.set('root', rootPath)
      queryParams.set('path', path)
      const res = await fetch(`/api/files/history/snapshot?${queryParams.toString()}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok || data.error) {
        console.error('Failed to save version:', data.error || res.statusText)
        return
      }
      setVersionSaved(true)
      setTimeout(() => setVersionSaved(false), 1500)
      // 通知其他组件（如历史版本弹窗）刷新
      window.dispatchEvent(new CustomEvent('colonynote:file-saved', {
        detail: { path, rootPath: rootPath ?? null },
      }))
    } catch (e) {
      console.error('Failed to save version:', e)
    } finally {
      setSavingVersion(false)
    }
  }, [path, rootPath, savingVersion])

  const handleCopyPlainText = useCallback(async () => {
    const { from, to } = editor.state.selection
    const text = from === to
      ? editor.getText()
      : editor.state.doc.textBetween(from, to, '\n')

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [editor])

  return (
    <div className={`editor-toolbar editor-toolbar-${variant}`}>
      <button
        type="button"
        contentEditable={false}
        className="editor-toolbar-btn disabled:opacity-40 disabled:cursor-not-allowed"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.isEditable || !editor.can().undo()}
        title="撤销"
        aria-label="撤销"
      >
        <Undo2 className="size-5" />
      </button>
      <button
        type="button"
        contentEditable={false}
        className="editor-toolbar-btn disabled:opacity-40 disabled:cursor-not-allowed"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.isEditable || !editor.can().redo()}
        title="恢复"
        aria-label="恢复"
      >
        <Redo2 className="size-5" />
      </button>
      <div className="editor-toolbar-separator" />
      <HeadingDropdown editor={editor} variant={variant} />
      {toolbarButtons.map((btn) => {
        const Icon = btn.icon
        const active = btn.isActive(editor)
        return (
          <button
            key={btn.label}
            type="button"
            contentEditable={false}
            className={`editor-toolbar-btn ${active ? 'active' : ''}`}
            onClick={() => btn.action(editor)}
            title={btn.label}
            aria-label={btn.label}
            aria-pressed={active}
          >
            <Icon className="size-5" />
          </button>
        )
      })}
      <div className="editor-toolbar-separator" />
      <button
        type="button"
        contentEditable={false}
        className={`editor-toolbar-btn ${copied ? 'active' : ''}`}
        onClick={handleCopyPlainText}
        title="复制纯文本"
        aria-label="复制纯文本"
      >
        <Copy className="size-5" />
      </button>
      <div className="editor-toolbar-separator" />
      <button
        type="button"
        contentEditable={false}
        className={`editor-toolbar-btn ${versionSaved ? 'active' : ''}`}
        onClick={handleSaveVersion}
        disabled={!path || savingVersion}
        title="保存版本"
        aria-label="保存版本"
      >
        {savingVersion ? (
          <Loader2 className="size-5 animate-spin" />
        ) : versionSaved ? (
          <Check className="size-5" />
        ) : (
          <BookmarkPlus className="size-5" />
        )}
      </button>
    </div>
  )
}
