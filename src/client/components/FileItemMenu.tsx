import { useState, useEffect } from 'react'
import {
  Trash2,
  Pencil,
  FolderInput,
  FileText,
  Folder,
  Plus,
  Copy,
} from 'lucide-react'
import { cn } from '@/client/lib/utils'
import { Sheet, SheetContent } from './ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog'

interface FileItem {
  path: string
  name: string
  type: 'file' | 'directory'
  rootPath: string
  childrenCount?: number
}

interface FileItemMenuProps {
  item: FileItem | null
  currentDir: string
  onRenameRequest: (item: FileItem) => void
  onMoveRequest: (item: FileItem) => void
  onCopyRequest?: (item: FileItem) => void
  onDelete: (path: string, rootPath: string) => void
  onCreateRequest?: (isDirectory: boolean, parentPath: string) => void
}

export function FileItemMenu({
  item,
  currentDir,
  onRenameRequest,
  onMoveRequest,
  onCopyRequest,
  onDelete,
  onCreateRequest,
}: FileItemMenuProps) {
  const [open, setOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (item) {
      setOpen(true)
    } else {
      setOpen(false)
    }
  }, [item])

  const handleClose = () => {
    setOpen(false)
  }

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (item) {
      onDelete(item.path, item.rootPath)
    }
    setDeleteDialogOpen(false)
    handleClose()
  }

  if (!item) return null

  const parentPath = item.type === 'directory' ? item.path : currentDir

  // 移动端底部 Sheet 头部
  const MobileHeader = () => (
    <>
      {/* Grab Handle */}
      <div className="flex justify-center pt-2.5 pb-1 md:hidden">
        <div className="w-10 h-1 rounded-full bg-muted-foreground/25" />
      </div>
      <div className="px-4 pt-1 pb-3 md:hidden">
        <div className="flex items-center gap-3 pt-3">
          <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            {item.type === 'directory' ? (
              <Folder className="size-5 text-primary" />
            ) : (
              <FileText className="size-5 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium block truncate">{item.name}</span>
            <p className="text-[11px] text-muted-foreground">
              {item.type === 'directory'
                ? `文件夹${item.childrenCount ? ` · ${item.childrenCount} 个项目` : ''}`
                : '文件'}
            </p>
          </div>
        </div>
      </div>
    </>
  )

  // 桌面端右侧抽屉头部
  const DesktopHeader = () => (
    <div className="hidden md:flex items-center gap-3 px-4 py-3 border-b border-border">
      <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        {item.type === 'directory' ? (
          <Folder className="size-4 text-primary" />
        ) : (
          <FileText className="size-4 text-primary" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium block truncate">{item.name}</span>
      </div>
    </div>
  )

  // 操作项配置
  const actions = [
    {
      icon: Pencil,
      label: '重命名',
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      onClick: () => {
        onRenameRequest(item)
        handleClose()
      },
    },
    {
      icon: FolderInput,
      label: '移动到',
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      onClick: () => {
        onMoveRequest(item)
        handleClose()
      },
    },
    {
      icon: Copy,
      label: '复制到',
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      onClick: () => {
        onCopyRequest?.(item)
        handleClose()
      },
    },
  ]

  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent
          side={isMobile ? 'bottom' : 'right'}
          className={cn('p-0', !isMobile && 'w-[280px] sm:w-[300px]')}
          noClose
        >
          <MobileHeader />
          <DesktopHeader />

          {/* 快捷新建 */}
          <div className="px-3 py-2 flex gap-2">
            <button
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shadow-sm"
              onClick={() => {
                onCreateRequest?.(false, parentPath)
                handleClose()
              }}
            >
              <Plus className="size-3.5" />
              新建文件
            </button>
            <button
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/80 transition-colors border border-border"
              onClick={() => {
                onCreateRequest?.(true, parentPath)
                handleClose()
              }}
            >
              <Plus className="size-3.5" />
              新建文件夹
            </button>
          </div>

          {/* 操作卡片列表 */}
          <div className="px-3 pb-1.5 space-y-1.5">
            {actions.map((action, i) => (
              <button
                key={i}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={action.onClick}
                className={cn(
                  'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-all',
                  hoveredIndex === i
                    ? 'bg-muted shadow-sm scale-[1.01]'
                    : 'bg-card border border-border/60'
                )}
              >
                <div
                  className={cn(
                    'size-7 rounded-lg flex items-center justify-center shrink-0',
                    action.color
                  )}
                >
                  <action.icon className="size-4" />
                </div>
                <span>{action.label}</span>
              </button>
            ))}
          </div>

          {/* 删除卡片 */}
          <div className="px-3 pb-4">
            <button
              onClick={handleDeleteClick}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-destructive bg-destructive/5 border border-destructive/10 hover:bg-destructive/10 transition-colors"
            >
              <div className="size-7 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                <Trash2 className="size-4" />
              </div>
              <span>删除{item.type === 'directory' ? '此文件夹' : '此文件'}</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              {item.type === 'directory' && item.childrenCount && item.childrenCount > 0 ? (
                <span className="text-destructive font-medium">
                  文件夹「{item.name}」包含 {item.childrenCount} 个项目，删除后将全部删除且无法恢复。确定要继续吗？
                </span>
              ) : (
                <>确定要删除「{item.name}」吗？此操作无法撤销。</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
