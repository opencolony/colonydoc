import mermaid from 'mermaid'
import { codeBlockConfig, type CodeBlockConfig } from '@milkdown/kit/component/code-block'
import { Editor } from '@milkdown/kit/core'
import { codeBlockSchema } from '@milkdown/kit/preset/commonmark'

let currentDarkMode = false

function isDarkMode(): boolean {
  if (typeof document === 'undefined') return false
  return document.documentElement.classList.contains('dark')
}

function initMermaid(dark: boolean) {
  if (dark) {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      darkMode: true,
      htmlLabels: false,
      themeVariables: {
        background: 'transparent',
        primaryColor: '#4f46e5',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#818cf8',
        secondaryColor: '#3b82f6',
        secondaryTextColor: '#f8fafc',
        secondaryBorderColor: '#60a5fa',
        tertiaryColor: '#8b5cf6',
        tertiaryTextColor: '#f8fafc',
        tertiaryBorderColor: '#a78bfa',
        lineColor: '#94a3b8',
        textColor: '#f8fafc',
        mainBkg: '#374151',
        nodeBorder: '#6366f1',
        clusterBkg: '#1f2937',
        clusterBorder: '#4b5563',
        titleColor: '#f8fafc',
        edgeLabelBackground: '#1f2937',
        nodeTextColor: '#f8fafc',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      },
      themeCSS: `
        .node rect, .node circle, .node ellipse, .node polygon, .node path {
          fill: #374151 !important;
          stroke: #6366f1 !important;
        }
        .node .label, .nodeLabel {
          color: #f8fafc !important;
        }
        .edgeLabel {
          background-color: #1f2937 !important;
          color: #f8fafc !important;
        }
        .edgePath .path {
          stroke: #94a3b8 !important;
        }
        .arrowheadPath {
          fill: #94a3b8 !important;
        }
        text {
          color: #f8fafc !important;
          fill: #f8fafc !important;
        }
      `,
      securityLevel: 'loose',
    })
  } else {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      htmlLabels: false,
      securityLevel: 'loose',
    })
  }
  currentDarkMode = dark
}

async function renderMermaid(content: string): Promise<string> {
  if (!content.trim()) {
    return '<div class="mermaid-placeholder" style="padding: 20px; text-align: center; color: #999;">Mermaid Diagram</div>'
  }

  try {
    const dark = isDarkMode()
    if (dark !== currentDarkMode) {
      initMermaid(dark)
    }
    
    const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const { svg } = await mermaid.render(id, content)
    return svg
  } catch (error) {
    return `<div class="mermaid-error" style="padding: 20px; color: #e74c3c;">Invalid Mermaid syntax</div>`
  }
}

const mermaidBlockSchema = codeBlockSchema.extendSchema((prev) => {
  return (ctx) => {
    const baseSchema = prev(ctx)
    return {
      ...baseSchema,
      toMarkdown: {
        match: baseSchema.toMarkdown.match,
        runner: (state, node) => {
          const language = node.attrs.language ?? ''
          if (language.toLowerCase() === 'mermaid') {
            const text = node.content.firstChild?.text || ''
            state.addNode('code', undefined, text, { lang: 'mermaid' })
          } else {
            return baseSchema.toMarkdown.runner(state, node)
          }
        },
      },
    }
  }
})

export const mermaidFeature = (editor: Editor) => {
  editor.config((ctx) => {
    ctx.update(codeBlockConfig.key, (prev): CodeBlockConfig => {
      const originalRenderPreview = prev.renderPreview
      return {
        ...prev,
        renderPreview: (language: string, content: string, applyPreview: (value: string | HTMLElement | null) => void) => {
          if (language.toLowerCase() === 'mermaid') {
            renderMermaid(content).then((svg) => {
              applyPreview(svg)
            })
            return null
          }
          return originalRenderPreview(language, content, applyPreview)
        },
      }
    })
  }).use(mermaidBlockSchema)
}