import { useState, useCallback, useEffect, useRef, memo } from 'react'
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from '@/client/components/ui/command'
import { cn } from '@/client/lib/utils'

interface PathInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

interface SearchResult {
  path: string
}

export const PathInput = memo(function PathInput({
  value,
  onChange,
  placeholder = '输入路径...',
  disabled = false,
  className,
}: PathInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState(value)
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < 768
  })
  
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<number | null>(null)
  const commandRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    setSearchQuery(value)
  }, [value])

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`/api/files/roots/search?q=${encodeURIComponent(query)}`)
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      setResults(data.matches.map((path: string) => ({ path })))
      setIsOpen(true)
      setSelectedIndex(-1)
    } catch (e) {
      console.error('Failed to search paths:', e)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = window.setTimeout(() => {
      performSearch(searchQuery)
    }, 150)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchQuery, performSearch])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : prev
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          const selectedPath = results[selectedIndex].path
          onChange(selectedPath)
          setSearchQuery(selectedPath)
          setIsOpen(false)
          setSelectedIndex(-1)
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }, [isOpen, results, selectedIndex, onChange])

  const handleSelect = useCallback((path: string) => {
    onChange(path)
    setSearchQuery(path)
    setIsOpen(false)
    setSelectedIndex(-1)
  }, [onChange])

  const handleInputChange = useCallback((value: string) => {
    setSearchQuery(value)
    onChange(value)
  }, [onChange])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (commandRef.current && !commandRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div ref={commandRef} className={cn("relative", className)}>
      <Command 
        className={cn(
          "rounded-lg border shadow-md",
          isMobile && "w-full"
        )}
        onKeyDown={handleKeyDown}
      >
        <CommandInput
          ref={inputRef}
          value={searchQuery}
          placeholder={placeholder}
          disabled={disabled}
          onValueChange={handleInputChange}
          className={cn(
            isMobile && "h-12 text-base"
          )}
        />
        {isOpen && (
          <CommandList className={cn(
            "absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-md shadow-lg",
            isMobile && "max-h-[200px]"
          )}>
            {isLoading ? (
              <CommandEmpty>搜索中...</CommandEmpty>
            ) : results.length === 0 ? (
              <CommandEmpty>未找到匹配路径</CommandEmpty>
            ) : (
              results.map((result, index) => (
                <CommandItem
                  key={result.path}
                  value={result.path}
                  onSelect={() => handleSelect(result.path)}
                  className={cn(
                    "cursor-pointer",
                    index === selectedIndex && "bg-accent"
                  )}
                >
                  <span className={cn(
                    "truncate",
                    isMobile && "text-sm"
                  )}>
                    {result.path}
                  </span>
                </CommandItem>
              ))
            )}
          </CommandList>
        )}
      </Command>
    </div>
  )
})