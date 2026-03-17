import React, { useState } from 'react'
import { Popup, Input, Button, Space } from 'antd-mobile'

interface CreateFileModalProps {
  visible: boolean
  onClose: () => void
  onCreate: (name: string, isDirectory: boolean) => void
  currentDir: string
}

export function CreateFileModal({ visible, onClose, onCreate, currentDir }: CreateFileModalProps) {
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
    <Popup
      visible={visible}
      onMaskClick={onClose}
      bodyStyle={{ borderRadius: '16px 16px 0 0' }}
    >
      <div style={{ padding: 20 }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: 16 }}>新建</h3>
        <div style={{ margin: '0 0 12px 0', fontSize: 12, color: '#999' }}>
          位置: {currentDir || '根目录'}
        </div>
        <Input
          placeholder={isDirectory ? '文件夹名称' : '文件名称 (自动添加 .md)'}
          value={name}
          onChange={setName}
          style={{ '--font-size': '16px' } as any}
        />
        <div style={{ margin: '16px 0' }}>
          <Space>
            <Button
              size="small"
              color={isDirectory ? 'primary' : 'default'}
              onClick={() => setIsDirectory(true)}
            >
              文件夹
            </Button>
            <Button
              size="small"
              color={!isDirectory ? 'primary' : 'default'}
              onClick={() => setIsDirectory(false)}
            >
              Markdown 文件
            </Button>
          </Space>
        </div>
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>取消</Button>
          <Button color="primary" onClick={handleSubmit}>
            创建
          </Button>
        </Space>
      </div>
    </Popup>
  )
}