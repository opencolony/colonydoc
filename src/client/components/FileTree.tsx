import React from 'react'

interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileNode[]
}

interface FileTreeProps {
  files: FileNode[]
  activePath: string | null
  currentDir: string
  onSelect: (path: string, type: 'file' | 'directory') => void
  onDelete: (path: string) => void
}

interface TreeNodeProps {
  node: FileNode
  activePath: string | null
  currentDir: string
  onSelect: (path: string, type: 'file' | 'directory') => void
  onDelete: (path: string) => void
  level?: number
}

function TreeNode({ node, activePath, currentDir, onSelect, onDelete, level = 0 }: TreeNodeProps) {
  const [expanded, setExpanded] = React.useState(true)
  const isDirectory = node.type === 'directory'
  const isActive = node.path === activePath
  const isCurrentDir = node.path === currentDir

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isDirectory) {
      setExpanded(!expanded)
    }
  }

  const handleClick = () => {
    onSelect(node.path, isDirectory ? 'directory' : 'file')
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`确定删除 ${node.name} 吗?`)) {
      onDelete(node.path)
    }
  }

  return (
    <div>
      <div
        className={`file-tree-item ${isActive || isCurrentDir ? 'active' : ''}`}
        style={{ paddingLeft: 16 + level * 16 }}
        onClick={handleClick}
      >
        <span 
          style={{ width: 16, textAlign: 'center', cursor: isDirectory ? 'pointer' : 'default' }}
          onClick={handleToggle}
        >
          {isDirectory ? (expanded ? '📂' : '📁') : '📄'}
        </span>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {node.name}
        </span>
        <button className="icon-btn" onClick={handleDelete} style={{ padding: 2, fontSize: 12 }}>
          🗑️
        </button>
      </div>
      {isDirectory && expanded && node.children && (
        <div className="file-tree-children">
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              activePath={activePath}
              currentDir={currentDir}
              onSelect={onSelect}
              onDelete={onDelete}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function FileTree({ files, activePath, currentDir, onSelect, onDelete }: FileTreeProps) {
  return (
    <div className="sidebar-content">
      {files.length === 0 ? (
        <div className="empty-state" style={{ padding: 24 }}>
          <div className="empty-state-icon">📂</div>
          <div>暂无文件</div>
        </div>
      ) : (
        files.map((node) => (
          <TreeNode
            key={node.path}
            node={node}
            activePath={activePath}
            currentDir={currentDir}
            onSelect={onSelect}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  )
}