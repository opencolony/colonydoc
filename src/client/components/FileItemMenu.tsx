import { useState, useEffect } from 'react'
import { MoreHorizontal, Trash2, Pencil, FolderInput, FileText, Folder } from 'lucide-react'
import { cn } from '@/client/lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet'
import { Button } from './ui/button'
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
  childrenCount?: number
}

interface FileItemMenuProps {
  item: FileItem | null
  onRenameRequest: (item: FileItem) => void
  onMoveRequest: (item: FileItem) => void
  onDelete: (path: string) => void
}

export function FileItemMenu({ item, onRenameRequest, onMoveRequest, onDelete }: FileItemMenuProps) {
  const [open, setOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

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
      onDelete(item.path)
    }
    setDeleteDialogOpen(false)
    handleClose()
  }

  if (!item) return null

  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent side={isMobile ? 'bottom' : 'right'} className={cn(
          "p-0",
          !isMobile && "w-[200px] sm:w-[240px]"
        )}>
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="text-sm font-normal flex items-center gap-2">
              {item.type === 'directory' ? (
                <Folder className="size-4" />
              ) : (
                <FileText className="size-4" />
              )}
              <span className="truncate">{item.name}</span>
            </SheetTitle>
          </SheetHeader>
          <div className="p-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-sm"
              onClick={() => {
                onRenameRequest(item)
                handleClose()
              }}
            >
              <Pencil className="size-4" />
              重命名
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-sm"
              onClick={() => {
                onMoveRequest(item)
                handleClose()
              }}
            >
              <FolderInput className="size-4" />
              移动到
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-sm text-destructive hover:text-destructive"
              onClick={handleDeleteClick}
            >
              <Trash2 className="size-4" />
              删除
            </Button>
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