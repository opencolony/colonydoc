import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import type { Editor } from '@tiptap/react'
import { List, X } from 'lucide-react'
import { cn } from '../lib/utils'

/**
 * 大纲条目：在编辑器文档中的标题节点快照
 */
interface OutlineItem {
  /** 在文档中的位置（编辑器模式），或在原文中的字符偏移（源码模式） */
  pos: number
  /** 标题级别 1-6 */
  level: number
  /** 标题文本（已 trim） */
  text: string
  /** 源码模式下的行号（从 0 开始） */
  line?: number
  /** 用于 React key 与 scroll spy 的稳定 ID */
  id: string
}

interface OutlinePanelProps {
  /** TipTap 编辑器实例（wysiwyg / read 模式） */
  editor: Editor | null
  /** 当前编辑模式 */
  mode: 'wysiwyg' | 'source' | 'read'
  /** 原始 markdown 文本（source 模式使用） */
  content: string
  /** 是否在移动端 sheet 中渲染（影响样式） */
  variant?: 'desktop' | 'mobile'
  /** 移动端 sheet 的关闭回调 */
  onClose?: () => void
}

/**
 * 找到文档位置 pos 对应的真实标题 DOM 元素
 *
 * 注意：pos 是 ProseMirror 文档中 heading 节点的开头位置（`state.doc.descendants` 回调给出），
 * 该位置处于父节点边界，`domAtPos(pos)` 会直接返回父节点（root），无法向上找到 heading。
 * 改用 `pos + 1` 即可进入 heading 节点内部，命中 h1-h6 元素。
 */
function getHeadingElement(editor: Editor, pos: number): HTMLElement | null {
  try {
    const domAtPos = editor.view.domAtPos(pos + 1)
    const node: Node | null = domAtPos.node
    if (node && node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement
      if (el.matches('h1, h2, h3, h4, h5, h6')) {
        return el
      }
      // 容错：可能 pos+1 落在文本节点，向上找最近的 h1-h6 祖先
      let parent: Node | null = el.parentElement
      while (parent && parent !== editor.view.dom) {
        if (parent.nodeType === Node.ELEMENT_NODE && (parent as HTMLElement).matches('h1, h2, h3, h4, h5, h6')) {
          return parent as HTMLElement
        }
        parent = parent.parentNode
      }
    }
  } catch {
    return null
  }
  return null
}

/**
 * 从 TipTap 文档中提取所有标题
 */
function extractHeadingsFromEditor(editor: Editor): OutlineItem[] {
  const items: OutlineItem[] = []
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      const level = (node.attrs.level as number) || 1
      const text = node.textContent.trim() || '(无标题)'
      items.push({
        pos,
        level,
        text,
        id: `outline-editor-${pos}-${level}`,
      })
    }
  })
  return items
}

/**
 * 从 markdown 文本中提取所有标题
 * 支持 ATX 风格 (# Heading) 与 Setext 风格 (=== / ---)
 * 自动跳过围栏代码块内的内容
 */
function extractHeadingsFromMarkdown(markdown: string): OutlineItem[] {
  const items: OutlineItem[] = []
  if (!markdown) return items

  const lines = markdown.split('\n')
  let inFence = false
  let fenceMarker = ''
  let charPos = 0
  const lineStartPositions: number[] = []

  for (let i = 0; i < lines.length; i++) {
    lineStartPositions.push(charPos)
    charPos += lines[i].length + 1 // +1 for \n
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // 围栏代码块跟踪：整行必须只由围栏字符 + 可选 info string + 前后空白组成
    // info string 是不含围栏字符的非空白序列（CommonMark：开始围栏后可跟语言标识符）
    if (!inFence) {
      const fenceMatch = trimmed.match(/^(`{3,}|~{3,})(?:\s*([^`~\s][^`~]*)?\s*)?$/)
      if (fenceMatch) {
        inFence = true
        fenceMarker = fenceMatch[1][0]
        continue
      }
    } else {
      // 关闭围栏同样必须整行只有 fenceMarker 且长度 ≥ 3
      const closingMatch = trimmed.match(new RegExp(`^\\${fenceMarker}{3,}\\s*$`))
      if (closingMatch) {
        inFence = false
        fenceMarker = ''
      }
      continue
    }

    // 缩进代码块（CommonMark）：前后必须空行 + 至少一段连续行首 4 空格或 tab
    // 简单策略：仅当上一行是空行且下一行也是 4 空格缩进时，才视为代码块
    if (/^( {4,}|\t)/.test(line)) {
      const prevLine = i > 0 ? lines[i - 1].trim() : ''
      const nextLine = i + 1 < lines.length ? lines[i + 1] : ''
      if (prevLine === '' && /^( {4,}|\t)/.test(nextLine)) {
        continue
      }
      // 否则视为段落/列表续行，落到下方 ATX/Setext 规则处理
    }

    // ATX 风格：# ~ ###### 后跟空格
    const atx = line.match(/^(#{1,6})\s+(.+?)(?:\s+#+\s*)?$/)
    if (atx) {
      const level = atx[1].length
      const text = atx[2].trim() || '(无标题)'
      const matchStart = lineStartPositions[i] + atx.index!
      items.push({
        pos: matchStart,
        level,
        text,
        line: i,
        id: `outline-src-${i}-${level}`,
      })
      continue
    }

    // Setext 风格：上一行是文本，本行是 === 或 ---
    if (i > 0 && trimmed.length > 0 && /^=+\s*$/.test(trimmed)) {
      const prev = lines[i - 1].trimEnd()
      if (prev && !/^#{1,6}\s+/.test(prev) && !prev.startsWith('```') && !prev.startsWith('~~~')) {
        items.push({
          pos: lineStartPositions[i - 1],
          level: 1,
          text: prev.trim() || '(无标题)',
          line: i - 1,
          id: `outline-src-${i - 1}-1`,
        })
      }
      continue
    }
    if (i > 0 && trimmed.length > 0 && /^-+\s*$/.test(trimmed) && trimmed !== '---') {
      // 仅排除恰好 3 个 '-' 的情况（YAML frontmatter 分隔符），≥4 个视为 setext underline
      const prev = lines[i - 1].trimEnd()
      if (prev && !/^#{1,6}\s+/.test(prev) && !prev.startsWith('```') && !prev.startsWith('~~~')) {
        items.push({
          pos: lineStartPositions[i - 1],
          level: 2,
          text: prev.trim() || '(无标题)',
          line: i - 1,
          id: `outline-src-${i - 1}-2`,
        })
      }
    }
  }

  return items
}

/**
 * 计算 textarea 的实际行高（处理 normal / 数字 / 长度三种情况）
 */
function getTextareaLineHeight(textarea: HTMLTextAreaElement): number {
  const computed = getComputedStyle(textarea)
  const lh = parseFloat(computed.lineHeight)
  if (!isNaN(lh) && lh > 0) return lh
  const fs = parseFloat(computed.fontSize) || 16
  return fs * 1.5
}

export function OutlinePanel({ editor, mode, content, variant = 'desktop', onClose }: OutlinePanelProps) {
  const [items, setItems] = useState<OutlineItem[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const activeItemRef = useRef<HTMLButtonElement>(null)

  // —— 提取标题 ——
  useEffect(() => {
    if (mode === 'source') {
      setItems(extractHeadingsFromMarkdown(content))
    } else if (editor) {
      setItems(extractHeadingsFromEditor(editor))
    } else {
      setItems([])
    }
  }, [editor, mode, content])

  // —— 订阅编辑器更新：wysiwyg / read 模式实时刷新 ——
  useEffect(() => {
    if (!editor || mode === 'source') return
    const handler = () => {
      setItems(extractHeadingsFromEditor(editor))
    }
    editor.on('update', handler)
    editor.on('selectionUpdate', handler)
    return () => {
      editor.off('update', handler)
      editor.off('selectionUpdate', handler)
    }
  }, [editor, mode])

  // —— 点击跳转：编辑器模式 ——
  const handleEditorClick = useCallback(
    (item: OutlineItem) => {
      if (!editor) return

      const container = document.querySelector('.tiptap-editor-scroll-area') as HTMLElement | null

      // 手动控制滚动容器：避免 el.scrollIntoView 与 ProseMirror selection 触发的
      // 内部 scrollIntoView({block:'nearest'}) 互相冲突。
      // 元素未渲染时（ProseMirror DOM 异步挂载）重试 2 次，最后 fallback 到 commands.scrollIntoView。
      const tryScroll = (attempts: number) => {
        const el = getHeadingElement(editor, item.pos)
        if (el && container) {
          const offset = 16
          const targetTop =
            el.getBoundingClientRect().top -
            container.getBoundingClientRect().top +
            container.scrollTop
          container.scrollTo({
            top: Math.max(0, targetTop - offset),
            behavior: 'smooth',
          })
          return
        }
        if (attempts > 0) {
          setTimeout(() => tryScroll(attempts - 1), 50)
          return
        }
        // 最终 fallback：ProseMirror 自带命令
        try {
          editor.commands.scrollIntoView()
        } catch {
          // ignore
        }
      }
      tryScroll(2)

      // 同步 ProseMirror 选区：单独调用 commands（不走 chain），避免 read 模式下
      // focus() 触发 TipTapEditor 的 focusin 监听导致 chain 中断。
      // 由于我们已经在视口顶部 16px 位置，ProseMirror nearest 不会再次滚动。
      try {
        editor.commands.setTextSelection(item.pos + 1)
      } catch {
        // ignore
      }

      setActiveId(item.id)
    },
    [editor]
  )

  // —— 点击跳转：源码模式 ——
  const handleSourceClick = useCallback((item: OutlineItem) => {
    const textarea = document.querySelector('.editor-textarea') as HTMLTextAreaElement | null
    if (!textarea) return
    textarea.focus()
    const start = item.pos
    const end = start + item.text.length
    try {
      textarea.setSelectionRange(start, end)
    } catch {
      // ignore
    }
    const lineHeight = getTextareaLineHeight(textarea)
    const targetLine = item.line ?? 0
    const visibleLines = Math.floor(textarea.clientHeight / lineHeight)
    const desiredLine = Math.max(0, targetLine - Math.floor(visibleLines * 0.15))
    textarea.scrollTo({
      top: desiredLine * lineHeight,
      behavior: 'smooth',
    })
    setActiveId(item.id)
  }, [])

  const handleClick = useCallback(
    (item: OutlineItem) => {
      if (mode === 'source') {
        handleSourceClick(item)
      } else {
        handleEditorClick(item)
      }
    },
    [mode, handleSourceClick, handleEditorClick]
  )

  // —— Scroll Spy：编辑器模式（IntersectionObserver） ——
  useEffect(() => {
    if (mode === 'source' || !editor || items.length === 0) return

    const elementMap = new Map<string, HTMLElement>()
    items.forEach((item) => {
      const el = getHeadingElement(editor, item.pos)
      if (el) {
        el.setAttribute('data-outline-id', item.id)
        elementMap.set(item.id, el)
      }
    })

    const visibleSet = new Set<string>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).getAttribute('data-outline-id')
          if (!id) continue
          if (entry.isIntersecting) {
            visibleSet.add(id)
          } else {
            visibleSet.delete(id)
          }
        }
        if (visibleSet.size > 0) {
          let topmost: { id: string; top: number } | null = null
          for (const id of visibleSet) {
            const el = elementMap.get(id)
            if (!el) continue
            const top = el.getBoundingClientRect().top
            if (!topmost || top < topmost.top) {
              topmost = { id, top }
            }
          }
          if (topmost) setActiveId(topmost.id)
        }
      },
      {
        rootMargin: '-72px 0px -60% 0px',
        threshold: [0, 1.0],
      }
    )

    elementMap.forEach((el) => observer.observe(el))

    return () => {
      observer.disconnect()
      elementMap.forEach((el) => el.removeAttribute('data-outline-id'))
    }
  }, [editor, mode, items])

  // —— Scroll Spy：源码模式（根据 scrollTop 推算当前行） ——
  useEffect(() => {
    if (mode !== 'source' || items.length === 0) return
    const textarea = document.querySelector('.editor-textarea') as HTMLTextAreaElement | null
    if (!textarea) return

    const update = () => {
      const lineHeight = getTextareaLineHeight(textarea)
      const topLine = Math.max(0, Math.floor(textarea.scrollTop / lineHeight))
      let active: OutlineItem | null = null
      for (const item of items) {
        if ((item.line ?? 0) <= topLine) {
          active = item
        } else {
          break
        }
      }
      if (active) setActiveId(active.id)
    }

    update()
    textarea.addEventListener('scroll', update)
    return () => textarea.removeEventListener('scroll', update)
  }, [mode, items])

  // —— 当 active 变化时，自动滚动大纲列表使活动项可见 ——
  useEffect(() => {
    if (!activeId || !activeItemRef.current || !listRef.current) return
    const el = activeItemRef.current
    const list = listRef.current
    const elTop = el.offsetTop
    const elBottom = elTop + el.offsetHeight
    const viewTop = list.scrollTop
    const viewBottom = viewTop + list.clientHeight
    if (elTop < viewTop) {
      list.scrollTop = elTop - 8
    } else if (elBottom > viewBottom) {
      list.scrollTop = elBottom - list.clientHeight + 8
    }
  }, [activeId])

  const isEmpty = items.length === 0

  // 决定最小层级（用于缩进计算），保证最深标题不溢出
  const minLevel = useMemo(() => {
    if (items.length === 0) return 1
    return Math.min(...items.map((i) => i.level))
  }, [items])

  return (
    <div className={`outline-panel outline-panel-${variant}`}>
      <div className="outline-panel-header">
        <div className="flex items-center gap-1.5">
          <List className="size-3.5" />
          <span>大纲</span>
          {!isEmpty && <span className="outline-panel-count">{items.length}</span>}
        </div>
        {variant === 'mobile' && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="outline-panel-close"
            aria-label="关闭大纲"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {isEmpty ? (
        <div className="outline-panel-empty">
          <span>暂无标题</span>
          <span className="outline-panel-empty-hint">
            {mode === 'source' ? '在源码中添加 # 标题' : '使用 # 创建标题'}
          </span>
        </div>
      ) : (
        <div className="outline-panel-list" ref={listRef}>
          {items.map((item) => {
            const indent = Math.min(item.level - minLevel, 5)
            return (
              <button
                key={item.id}
                ref={item.id === activeId ? activeItemRef : null}
                type="button"
                className={`outline-item outline-item-level-${item.level} outline-item-indent-${indent}${item.id === activeId ? ' outline-item-active' : ''}`}
                onClick={() => handleClick(item)}
                title={item.text}
              >
                <span className="outline-item-marker">
                  {item.level === 1 ? 'H1' : item.level === 2 ? 'H2' : `H${item.level}`}
                </span>
                <span className="outline-item-text">{item.text}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default OutlinePanel
