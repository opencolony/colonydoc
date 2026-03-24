import { useState, useEffect } from 'react'
import { File, Folder } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from './ui/dialog'
import { Input } from './ui/input'
import { Button } from './ui/button'

interface RenameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: { path: string; name: string; type: 'file' | 'directory' } | null
  onRename: (oldPath: string, newName: string) => void
}

export function RenameDialog({ open, onOpenChange, item, onRename }: RenameDialogProps) {
  const [name, setName] = useState('')

  useEffect(() => {
    if (item) {
      setName(item.type === 'directory' ? item.name : item.name.replace(/\.md$/, ''))
    }
  }, [item])

  const handleSubmit = () => {
    if (item && name.trim()) {
      onRename(item.path, name.trim())
      onOpenChange(false)
    }
  }

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>重命名</DialogTitle>
          <DialogDescription>
            输入新的名称来重命名「{item.name}」
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 py-2">
          {item.type === 'directory' ? (
            <Folder className="size-5 shrink-0 text-muted-foreground" />
          ) : (
            <File className="size-5 shrink-0 text-muted-foreground" />
          )}
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSubmit()
              }
            }}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}