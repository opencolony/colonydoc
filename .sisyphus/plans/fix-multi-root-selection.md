# 修复多 Root 文件选择问题

## TL;DR

> **问题**: 多 root 配置下，刷新页面后侧边栏选中错误的项目，且相同相对路径的文件显示错误内容
> 
> **方案**: 修改 URL hash 格式为 `#rootPath:filePath`，在请求中传递 root 参数

---

## 问题描述

### Bug 1: 页面刷新后侧边栏选中错误的项目
- 刷新页面后，侧边栏总是选中第一个 root
- 而不是当前文件所在的 root

### Bug 2: 相同相对路径的文件显示错误内容
- 两个 root 都有 `/README.md` 时
- 点击任何一个都显示第一个 root 的内容

## 根本原因

1. URL hash 只存储相对路径（如 `#/README.md`），没有 root 信息
2. 后端 `findRootForPath` 返回第一个匹配的 root
3. `handleHashChange` 中匹配逻辑错误（相对路径不以绝对路径开头）

---

## TODOs

- [ ] 1. **修改 useFile.ts 的 load 函数**

  **文件**: `src/client/hooks/useFile.ts`
  
  **修改**: 添加 `rootPath` 参数
  
  ```typescript
  const load = useCallback(async (filePath: string, rootPath?: string) => {
    try {
      const url = rootPath 
        ? `/api/files${filePath}?root=${encodeURIComponent(rootPath)}`
        : `/api/files${filePath}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to load file')
      const text = await res.text()
      setContent(text)
      setPath(filePath)
      lastSavedContentRef.current = text
      setStatus('idle')
    } catch (e) {
      optionsRef.current.onError?.(e instanceof Error ? e : new Error('Unknown error'), filePath)
    }
  }, [])
  ```

- [ ] 2. **修改 App.tsx 的 SidebarContentProps 接口**

  **文件**: `src/client/App.tsx`
  
  **修改**: `onSelect` 添加可选的 `rootPath` 参数
  
  ```typescript
  onSelect: (path: string, type: 'file' | 'directory', rootPath?: string) => void
  ```

- [ ] 3. **修改 App.tsx 的 handleSelectFile 函数**

  **文件**: `src/client/App.tsx`
  
  **修改**: 接受 `rootPath` 参数，编码到 hash 中
  
  ```typescript
  const handleSelectFile = useCallback((selectedPath: string, type: 'file' | 'directory', rootPath?: string) => {
    if (type === 'file') {
      const parts = selectedPath.split('/').filter(Boolean)
      const dirs: string[] = []
      for (let i = 0; i < parts.length - 1; i++) {
        dirs.push('/' + parts.slice(0, i + 1).join('/'))
      }
      if (dirs.length > 0) {
        setExpandedPaths(prev => {
          const next = new Set(prev)
          dirs.forEach(d => next.add(d))
          return next
        })
      }

      const effectiveRoot = rootPath || activeRoot
      load(selectedPath, effectiveRoot)
      window.location.hash = effectiveRoot ? `${effectiveRoot}:${selectedPath}` : selectedPath
      const dir = selectedPath.substring(0, selectedPath.lastIndexOf('/'))
      setCurrentDir(dir)
      setDrawerVisible(false)
    } else {
      setCurrentDir(selectedPath)
    }
  }, [load, activeRoot])
  ```

- [ ] 4. **修改 App.tsx 的 handleHashChange 函数**

  **文件**: `src/client/App.tsx`
  
  **修改**: 解析 hash 中的 root 信息
  
  ```typescript
  useEffect(() => {
    const handleHashChange = () => {
      const hash = decodeURIComponent(window.location.hash.slice(1))
      if (hash && loadingRef.current !== hash) {
        loadingRef.current = hash
        // Parse root from hash format: rootPath:filePath
        const colonIndex = hash.indexOf(':')
        let rootPath: string | undefined
        let filePath: string
        if (colonIndex > 0) {
          rootPath = hash.substring(0, colonIndex)
          filePath = hash.substring(colonIndex + 1)
        } else {
          filePath = hash
        }
        load(filePath, rootPath)
        if (rootPath) {
          setActiveRoot(rootPath)
        }
        const dir = filePath.substring(0, filePath.lastIndexOf('/'))
        setCurrentDir(dir)
        const parentDirs: string[] = []
        let currentPath = filePath
        while (currentPath.includes('/')) {
          currentPath = currentPath.substring(0, currentPath.lastIndexOf('/'))
          if (currentPath) parentDirs.push(currentPath)
        }
        setExpandedPaths(prev => {
          const newSet = new Set(prev)
          parentDirs.forEach(d => newSet.add(d))
          return newSet
        })
      }
    }

    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [load])
  ```

- [ ] 5. **修改 FileTree.tsx 的 FileTreeProps 接口**

  **文件**: `src/client/components/FileTree.tsx`
  
  **修改**: `onSelect` 添加可选的 `rootPath` 参数
  
  ```typescript
  onSelect: (path: string, type: 'file' | 'directory', rootPath?: string) => void
  ```

- [ ] 6. **修改 FileTree.tsx 的 TreeNode onClick**

  **文件**: `src/client/components/FileTree.tsx`
  
  **修改**: 传递 `activeRoot` 参数
  
  ```typescript
  onClick={() => onSelect(node.path, 'file', activeRoot || undefined)}
  ```

- [ ] 7. **修改 api.ts 的 GET /* 路由**

  **文件**: `src/server/api.ts`
  
  **修改**: 支持 `?root=` 查询参数
  
  在 `router.get('/*', ...)` 中，在处理根路径之后添加：
  
  ```typescript
  const rootParam = c.req.query('root')
  let rootPath: string | null
  
  if (rootParam) {
    rootPath = path.resolve(rootParam)
    if (!config.roots.some(r => path.resolve(r.path) === rootPath)) {
      return c.json({ error: 'Invalid root' }, 400)
    }
  } else {
    rootPath = findRootForPath(filePath, config)
  }
  
  if (!rootPath) return c.json({ error: 'Access denied' }, 403)
  ```

- [ ] 8. **运行类型检查**
  
  ```bash
  npm run typecheck
  ```

---

## 验证步骤

1. 配置两个 root
2. 打开第二个 root 中的文件
3. 刷新页面 → 侧边栏应选中第二个 root
4. 两个 root 都有 `/README.md` → 点击每个应显示正确内容