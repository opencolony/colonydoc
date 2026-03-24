import { useState, useEffect } from 'react'
import { ChevronRight, Folder, FolderOpen, File, FileText, X } from 'lucide-react'
import { cn } from '@/client/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from './ui/dialog'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'

interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileNode[]
}

interface MoveFileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: { path: string; name: string; type: 'file' | 'directory' } | null
  files: FileNode[]
  onMove: (oldPath: string, newParentPath: string) => void
}

interface TreeNodeSelectProps {
  node: FileNode
  selectedPath: string | null
  onSelect: (path: string) => void
  expandedPaths: Set<string>
  onToggleExpand: (path: string) => void
  currentItemPath: string
}

function TreeNodeSelect({
  node,
  selectedPath,
  onSelect,
  expandedPaths,
  onToggleExpand,
  currentItemPath,
}: TreeNodeSelectProps) {
  if (node.type !== 'directory') return null

  const isExpanded = expandedPaths.has(node.path)
  const isSelected = selectedPath === node.path
  const isCurrentItem = node.path === currentItemPath || currentItemPath.startsWith(node.path + '/')
  const hasChildren = node.children && node.children.length > 0

  return (
    <div className="select-none">
      <div
        className={cn(
          'flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer hover:bg-accent',
          isSelected && 'bg-accent',
          isCurrentItem && 'opacity-50 pointer-events-none'
        )}
        onClick={() => !isCurrentItem && onSelect(node.path)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (hasChildren && !isCurrentItem) {
              onToggleExpand(node.path)
            }
          }}
          className={cn(
            'size-5 flex items-center justify-center rounded hover:bg-black/10 dark:hover:bg-white/10',
            (!hasChildren || isCurrentItem) && 'invisible'
          )}
        >
          <ChevronRight className={cn('size-3.5 transition-transform', isExpanded && 'rotate-90')} />
        </button>
        {isExpanded ? (
          <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <Folder className="size-4 shrink-0 text-muted-foreground" />
        )}
        <span className="text-sm truncate flex-1">{node.name}</span>
        {isSelected && (
          <span className="text-xs text-muted-foreground">移动到这里</span>
        )}
      </div>
      {isExpanded && hasChildren && (
        <div className="ml-4">
          {node.children!.map((child) => (
            <TreeNodeSelect
              key={child.path}
              node={child}
              selectedPath={selectedPath}
              onSelect={onSelect}
              expandedPaths={expandedPaths}
              onToggleExpand={onToggleExpand}
              currentItemPath={currentItemPath}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function MoveFileModal({
  open,
  onOpenChange,
  item,
  files,
  onMove,
}: MoveFileModalProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>('')
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (item && open) {
      const parentPath = item.path.substring(0, item.path.lastIndexOf('/'))
      setSelectedPath(parentPath || '/')
    }
  }, [item, open])

  const handleToggleExpand = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  const handleMove = () => {
    if (item && selectedPath !== null) {
      const oldParentPath = item.path.substring(0, item.path.lastIndexOf('/'))
      if (selectedPath !== oldParentPath) {
        onMove(item.path, selectedPath === '/' ? '' : selectedPath)
      }
      onOpenChange(false)
    }
  }

  if (!item) return null

  const displayPath = selectedPath
    ? selectedPath === '/'
      ? '根目录'
      : selectedPath.split('/').filter(Boolean).join(' / ')
    : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>移动到</DialogTitle>
          <DialogDescription>
            选择要将「{item.name}」移动到的目标文件夹
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
          <FileText className="size-4 shrink-0" />
          <span className="truncate">{item.name}</span>
        </div>
        <ScrollArea className="flex-1 max-h-[300px] border rounded-md p-2">
          <div className="space-y-0.5">
            <div
              className={cn(
                'flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer hover:bg-accent',
                selectedPath === '/' && 'bg-accent'
              )}
              onClick={() => setSelectedPath('/')}
            >
              <Folder className="size-4 shrink-0 text-muted-foreground" />
              <span className="text-sm">根目录</span>
              {selectedPath === '/' && (
                <span className="text-xs text-muted-foreground ml-auto">移动到这里</span>
              )}
            </div>
            {files.map((node) => (
              <TreeNodeSelect
                key={node.path}
                node={node}
                selectedPath={selectedPath}
                onSelect={setSelectedPath}
                expandedPaths={expandedPaths}
                onToggleExpand={handleToggleExpand}
                currentItemPath={item.path}
              />
            ))}
          </div>
        </ScrollArea>
        <div className="text-xs text-muted-foreground py-2">
          目标位置: <span className="font-medium text-foreground">{displayPath}</span>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleMove} disabled={selectedPath === null}>
            移动
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}