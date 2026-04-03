import { useEffect, useRef, useCallback } from 'react'
import { Crepe, type CrepeConfig } from '@milkdown/crepe'
import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'
import 'katex/dist/katex.min.css'
import mermaid from 'mermaid'

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  suppressErrorRendering: true,
})


interface MilkdownEditorProps {
  value: string
  onChange: (value: string) => void
  mode: 'wysiwyg' | 'source'
  placeholder?: string
  readOnly?: boolean
}

export function MilkdownEditor({ value, onChange, mode, placeholder, readOnly }: MilkdownEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const crepeRef = useRef<Crepe | null>(null)
  const isInternalChange = useRef(false)

  const initCrepe = useCallback(async () => {
    if (!containerRef.current) return

    if (crepeRef.current) {
      await crepeRef.current.destroy()
      crepeRef.current = null
    }

    const config: CrepeConfig = {
      root: containerRef.current,
      defaultValue: value,
      features: {
        [Crepe.Feature.CodeMirror]: true,
        [Crepe.Feature.ListItem]: true,
        [Crepe.Feature.LinkTooltip]: true,
        [Crepe.Feature.Cursor]: true,
        [Crepe.Feature.ImageBlock]: false,
        [Crepe.Feature.BlockEdit]: true,
        [Crepe.Feature.Placeholder]: true,
        [Crepe.Feature.Toolbar]: true,
        [Crepe.Feature.Table]: true,
        [Crepe.Feature.Latex]: true,
      },
      featureConfigs: {
        [Crepe.Feature.Placeholder]: {
          text: placeholder || '在这里输入 Markdown...',
        },
        [Crepe.Feature.CodeMirror]: {
          renderPreview: (language, content, applyPreview) => {
            if (language === 'mermaid' && content) {
              const container = document.createElement('div')
              container.className = 'mermaid'
              container.style.cssText = 'position:absolute;visibility:hidden;width:800px;height:600px;'
              container.textContent = content
              document.body.appendChild(container)
              
              mermaid.run({ nodes: [container] }).then(() => {
                const svg = container.querySelector('svg')
                if (svg) {
                  svg.removeAttribute('style')
                  svg.style.maxWidth = '100%'
                  svg.style.height = 'auto'
                  applyPreview(svg.outerHTML)
                } else {
                  applyPreview(container.innerHTML)
                }
                document.body.removeChild(container)
              }).catch((err) => {
                document.body.removeChild(container)
                applyPreview(`<div class="mermaid-error">Mermaid Error: ${err.message}</div>`)
              })
              
              return undefined
            }
            return null
          }
        },
      },
    }


    const crepe = new Crepe(config)

    crepe.on((listener) => {
      listener.markdownUpdated((_ctx, markdown) => {
        isInternalChange.current = true
        onChange(markdown)
        setTimeout(() => {
          isInternalChange.current = false
        }, 0)
      })
    })

    if (readOnly) {
      crepe.setReadonly(true)
    }

    await crepe.create()
    crepeRef.current = crepe
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const prevValueRef = useRef<string>(value)

  useEffect(() => {
    if (crepeRef.current && value && value !== prevValueRef.current) {
      prevValueRef.current = value
      const config: CrepeConfig = {
        root: containerRef.current!,
        defaultValue: value,
        features: {
          [Crepe.Feature.CodeMirror]: true,
          [Crepe.Feature.ListItem]: true,
          [Crepe.Feature.LinkTooltip]: true,
          [Crepe.Feature.Cursor]: true,
          [Crepe.Feature.ImageBlock]: false,
          [Crepe.Feature.BlockEdit]: true,
          [Crepe.Feature.Placeholder]: true,
          [Crepe.Feature.Toolbar]: true,
          [Crepe.Feature.Table]: true,
          [Crepe.Feature.Latex]: true,
        },
        featureConfigs: {
          [Crepe.Feature.Placeholder]: {
            text: placeholder || '在这里输入 Markdown...',
          },
          [Crepe.Feature.CodeMirror]: {
            renderPreview: (language, content, applyPreview) => {
              if (language === 'mermaid' && content) {
                const container = document.createElement('div')
                container.className = 'mermaid'
                container.style.cssText = 'position:absolute;visibility:hidden;width:800px;height:600px;'
                container.textContent = content
                document.body.appendChild(container)
                
                mermaid.run({ nodes: [container] }).then(() => {
                  const svg = container.querySelector('svg')
                  if (svg) {
                    svg.removeAttribute('style')
                    svg.style.maxWidth = '100%'
                    svg.style.height = 'auto'
                    applyPreview(svg.outerHTML)
                  } else {
                    applyPreview(container.innerHTML)
                  }
                  document.body.removeChild(container)
                }).catch((err) => {
                  document.body.removeChild(container)
                  applyPreview(`<div class="mermaid-error">Mermaid Error: ${err.message}</div>`)
                })
                
                return undefined
              }
              return null
            }
          },
        },
      }
      crepeRef.current.destroy()
      const crepe = new Crepe(config)
      crepe.on((listener) => {
        listener.markdownUpdated((_ctx, markdown) => {
          isInternalChange.current = true
          onChange(markdown)
          setTimeout(() => {
            isInternalChange.current = false
          }, 0)
        })
      })
      if (readOnly) {
        crepe.setReadonly(true)
      }
      crepe.create().then(() => {
        crepeRef.current = crepe
      })
    } else {
      prevValueRef.current = value
    }
  }, [value, onChange, placeholder, readOnly])

  useEffect(() => {
    if (mode === 'wysiwyg') {
      initCrepe()
    }
    return () => {
      if (crepeRef.current) {
        crepeRef.current.destroy()
        crepeRef.current = null
      }
    }
  }, [mode, initCrepe])

  useEffect(() => {
    if (crepeRef.current) {
      crepeRef.current.setReadonly(!!readOnly)
    }
  }, [readOnly])

  if (mode === 'source') {
    return (
      <textarea
        className="editor-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || '在这里输入 Markdown...'}
        readOnly={readOnly}
        spellCheck={false}
      />
    )
  }

  return (
    <div className="milkdown-editor-wrapper">
      <div ref={containerRef} className="milkdown-container" />
    </div>
  )
}