import { useState, useEffect, useRef } from 'react'
import { History, Loader2, AlertCircle, CheckCircle2, ChevronLeft, RotateCcw, FileClock } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from './ui/dialog'
import { Sheet, SheetContent } from './ui/sheet'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { cn } from '@/client/lib/utils'

interface SnapshotEntry {
  timestamp: number
  source: string
  size: number
}

interface VersionHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  path?: string
  rootPath?: string | null
  isDirty?: boolean
  onRestore?: (content: string) => void
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatSource(source: string): string {
  switch (source) {
    case 'manual': return '手动保存'
    case 'auto-save': return '自动保存'
    case 'pre-restore': return '恢复前备份'
    default: return source
  }
}

export function VersionHistoryDialog({ open, onOpenChange, path, rootPath, isDirty, onRestore }: VersionHistoryDialogProps) {
  const [history, setHistory] = useState<SnapshotEntry[]>([])
  const [selectedTimestamp, setSelectedTimestamp] = useState<number | null>(null)
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < 768
  })
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (!open) {
      setHistory([])
      setSelectedTimestamp(null)
      setPreviewContent(null)
      setError(null)
      setSuccess(null)
      return
    }
    fetchHistory()
  }, [open, path, rootPath])

  useEffect(() => {
    if (!selectedTimestamp || !path) {
      setPreviewContent(null)
      return
    }
    fetchPreview(selectedTimestamp)
  }, [selectedTimestamp, path, rootPath])

  const fetchHistory = async () => {
    if (!path) return
    setLoading(true)
    setError(null)
    try {
      const url = rootPath
        ? `/api/files/history?root=${encodeURIComponent(rootPath)}&path=${encodeURIComponent(path)}`
        : `/api/files/history?path=${encodeURIComponent(path)}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        const list: SnapshotEntry[] = data.history || []
        setHistory(list)
        if (list.length > 0) {
          setSelectedTimestamp(list[0].timestamp)
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch history')
    } finally {
      setLoading(false)
    }
  }

  const fetchPreview = async (timestamp: number) => {
    if (!path) return
    setPreviewLoading(true)
    try {
      const url = rootPath
        ? `/api/files/history/version?root=${encodeURIComponent(rootPath)}&path=${encodeURIComponent(path)}&timestamp=${encodeURIComponent(timestamp)}`
        : `/api/files/history/version?path=${encodeURIComponent(path)}&timestamp=${encodeURIComponent(timestamp)}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.error) {
        setPreviewContent(null)
      } else {
        setPreviewContent(data.content ?? '')
      }
    } catch (e) {
      setPreviewContent(null)
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleRestore = async () => {
    if (!selectedTimestamp || !path) return
    if (isDirty) {
      const ok = window.confirm('恢复将覆盖当前未保存的更改，确定要继续吗？')
      if (!ok) return
    }
    setRestoring(true)
    setError(null)
    setSuccess(null)
    try {
      const url = rootPath
        ? `/api/files/history/restore?root=${encodeURIComponent(rootPath)}&path=${encodeURIComponent(path)}&timestamp=${encodeURIComponent(selectedTimestamp)}`
        : `/api/files/history/restore?path=${encodeURIComponent(path)}&timestamp=${encodeURIComponent(selectedTimestamp)}`
      const res = await fetch(url, { method: 'POST' })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        return
      }
      setSuccess('已恢复到所选版本')
      onRestore?.(data.content ?? '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to restore')
    } finally {
      setRestoring(false)
    }
  }

  const content = (
    <>
      <DialogHeader className="pb-2 shrink-0">
        <DialogTitle className="flex items-center gap-2">
          <History className="size-5" />
          历史版本
        </DialogTitle>
        <DialogDescription>
          {path ? `查看并恢复 ${path.split('/').pop()} 的历史版本` : '查看文件历史版本'}
        </DialogDescription>
      </DialogHeader>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 text-sm">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">加载历史版本...</span>
        </div>
      )}

      {!loading && !error && history.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground">
          <FileClock className="size-10 mb-3 opacity-50" />
          <span>暂无历史版本</span>
        </div>
      )}

      {!loading && history.length > 0 && (
        <div className={cn('flex gap-4 min-h-0 flex-1', isMobile && 'flex-col')}>
          <div className={cn('flex flex-col border rounded-md overflow-hidden', isMobile ? 'h-48' : 'w-72 shrink-0')}>
            <div className="px-3 py-2 border-b bg-muted/50 text-xs font-medium text-muted-foreground">
              共 {history.length} 个版本
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1" ref={listRef}>
                {history.map((entry) => {
                  const isSelected = selectedTimestamp === entry.timestamp
                  return (
                    <button
                      key={entry.timestamp}
                      type="button"
                      onClick={() => setSelectedTimestamp(entry.timestamp)}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                        isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn('font-medium', isSelected ? 'text-primary-foreground' : 'text-foreground')}>
                          {formatTimestamp(entry.timestamp)}
                        </span>
                        <span className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded-full shrink-0',
                          isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                        )}>
                          {formatSource(entry.source)}
                        </span>
                      </div>
                      <div className={cn('mt-1 text-[10px]', isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground/80')}>
                        {entry.size} 字节
                      </div>
                    </button>
                  )
                })}
              </div>
            </ScrollArea>
          </div>

          <div className="flex flex-col flex-1 min-w-0 border rounded-md overflow-hidden">
            <div className="px-3 py-2 border-b bg-muted/50 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {selectedTimestamp ? `版本 ${formatTimestamp(selectedTimestamp)}` : '预览'}
              </span>
              {selectedTimestamp && (
                <span className="text-[10px] text-muted-foreground">
                  {history.find(h => h.timestamp === selectedTimestamp)?.source && formatSource(history.find(h => h.timestamp === selectedTimestamp)!.source)}
                </span>
              )}
            </div>
            <ScrollArea className="flex-1">
              {previewLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : previewContent !== null ? (
                <pre className="p-4 text-xs font-mono whitespace-pre-wrap break-words text-foreground/90">{previewContent}</pre>
              ) : (
                <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                  选择版本查看内容
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      )}

      <DialogFooter className="shrink-0 gap-2 sm:gap-0">
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={restoring}>
          <ChevronLeft className="size-4 mr-1" />
          关闭
        </Button>
        <Button
          onClick={handleRestore}
          disabled={!selectedTimestamp || restoring || history.length === 0}
          className="gap-1"
        >
          {restoring ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
          恢复到此版本
        </Button>
      </DialogFooter>
    </>
  )

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85dvh] flex flex-col p-4">
          {content}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-4">
        {content}
      </DialogContent>
    </Dialog>
  )
}
