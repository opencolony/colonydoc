import React, { memo } from 'react'
import { XMarkdown } from '@ant-design/x-markdown'
import { Mermaid as AntdMermaid, CodeHighlighter } from '@ant-design/x'
import Latex from '@ant-design/x-markdown/plugins/Latex'

interface MarkdownPreviewProps {
  content: string
}

function CodeBlock({ children, lang, block, ...props }: React.HTMLAttributes<HTMLElement> & { lang?: string; block?: boolean }) {
  if (lang === 'mermaid' && block) {
    const code = typeof children === 'string' ? children : ''
    return <AntdMermaid>{code}</AntdMermaid>
  }
  if (block) {
    const code = typeof children === 'string' ? children : ''
    return <CodeHighlighter lang={lang}>{code}</CodeHighlighter>
  }
  return <code {...props}>{children}</code>
}

const MarkdownPreview = memo(function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
    <div className="preview-pane">
      <XMarkdown 
        content={content} 
        components={{
          code: CodeBlock,
        }}
        config={{
          extensions: Latex()
        }}
      />
    </div>
  )
})

export default MarkdownPreview