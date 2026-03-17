import { useState, useCallback, useRef } from 'react'

interface UseFileOptions {
  onSave?: () => void
  onSaveStart?: () => void
  onError?: (error: Error) => void
}

export function useFile(options: UseFileOptions = {}) {
  const [content, setContent] = useState('')
  const [path, setPath] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const saveTimeoutRef = useRef<number | null>(null)
  const lastSavedContentRef = useRef<string>('')
  
  const optionsRef = useRef(options)
  optionsRef.current = options

  const load = useCallback(async (filePath: string) => {
    try {
      const res = await fetch(`/api/files${filePath}`)
      if (!res.ok) throw new Error('Failed to load file')
      const text = await res.text()
      setContent(text)
      setPath(filePath)
      lastSavedContentRef.current = text
      setStatus('idle')
    } catch (e) {
      optionsRef.current.onError?.(e instanceof Error ? e : new Error('Unknown error'))
    }
  }, [])

  const save = useCallback(async (newContent: string, filePath: string | null = path) => {
    if (!filePath) return

    setStatus('saving')
    optionsRef.current.onSaveStart?.()
    try {
      const res = await fetch(`/api/files${filePath}`, {
        method: 'POST',
        body: newContent,
      })
      if (!res.ok) throw new Error('Failed to save')
      setStatus('saved')
      lastSavedContentRef.current = newContent
      optionsRef.current.onSave?.()
    } catch (e) {
      setStatus('error')
      optionsRef.current.onError?.(e instanceof Error ? e : new Error('Unknown error'))
    }
  }, [path])

  const updateContent = useCallback((newContent: string, debounceMs: number = 300) => {
    setContent(newContent)
    setStatus('idle')

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      save(newContent)
    }, debounceMs)
  }, [save])

  const isDirty = content !== lastSavedContentRef.current

  return {
    content,
    path,
    status,
    isDirty,
    load,
    save,
    updateContent,
    setContent,
    setPath,
  }
}