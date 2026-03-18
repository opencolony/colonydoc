import { useState, memo } from 'react'
import { Folder, FileText } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet'
import { Button } from './ui/button'
import { Input } from './ui/input'

interface CreateFileModalProps {
  visible: boolean
  onClose: () => void
  onCreate: (name: string, isDirectory: boolean) => void
  currentDir: string
}

export const CreateFileModal = memo(function CreateFileModal({ visible, onClose, onCreate, currentDir }: CreateFileModalProps) {
  const [name, setName] = useState('')
  const [isDirectory, setIsDirectory] = useState(false)

  const handleSubmit = () => {
    if (name.trim()) {
      onCreate(name.trim(), isDirectory)
      setName('')
      setIsDirectory(false)
      onClose()
    }
  }

  return (
    <Sheet open={visible} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl" noClose>
        <SheetHeader className="text-left">
          <SheetTitle>新建</SheetTitle>
          <SheetDescription>
            位置: {currentDir || '根目录'}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <Input
            placeholder={isDirectory ? '文件夹名称' : '文件名称 (自动添加 .md)'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11"
          />
          <div className="flex gap-2">
            <Button
              variant={isDirectory ? 'default' : 'outline'}
              onClick={() => setIsDirectory(true)}
              className="flex-1 h-11"
            >
              <Folder className="size-4 mr-2" />
              文件夹
            </Button>
            <Button
              variant={!isDirectory ? 'default' : 'outline'}
              onClick={() => setIsDirectory(false)}
              className="flex-1 h-11"
            >
              <FileText className="size-4 mr-2" />
              Markdown
            </Button>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={onClose}>取消</Button>
            <Button onClick={handleSubmit}>创建</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
})