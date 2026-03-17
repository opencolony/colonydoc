import React from 'react'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  readOnly?: boolean
}

export function MarkdownEditor({ value, onChange, placeholder, readOnly }: MarkdownEditorProps) {
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