import chokidar from 'chokidar'
import fs from 'fs'
import path from 'path'
import type { ColonynoteConfig } from '../config.js'
import { IgnoreMatcher } from './ignore.js'

export interface WatcherCallbacks {
  onFileChange: (rootPath: string, event: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir', path: string) => void
}

function isPathUnderRoot(filePath: string, rootPath: string): boolean {
  const normalizedFile = path.normalize(filePath)
  const normalizedRoot = path.normalize(rootPath)
  return normalizedFile === normalizedRoot || normalizedFile.startsWith(normalizedRoot + path.sep)
}

export function setupWatcher(config: ColonynoteConfig, matcher: IgnoreMatcher, callbacks: WatcherCallbacks) {
  const rootPaths = config.dirs.map(r => r.path)
  const watcher = chokidar.watch(rootPaths, {
    ignored: (filePath: string) => {
      if (!config.showHiddenFiles && (filePath.includes('/.') || filePath.startsWith('.'))) return true

      try {
        const stat = fs.statSync(filePath)
        if (matcher.isIgnored(filePath, stat.isDirectory())) return true
      } catch {
        if (matcher.isIgnored(filePath, false)) return true
      }

      const ext = filePath.split('.').pop()?.toLowerCase() || ''
      if (ext && !config.allowedExtensions.includes('.' + ext) && !filePath.includes('/')) {
        return false
      }
      return false
    },
    persistent: true,
    ignoreInitial: true,
    depth: 3,
  })

  watcher
    .on('add', (filePath) => {
      if (config.allowedExtensions.some(ext => filePath.endsWith(ext))) {
        const matchingRoots = config.dirs.filter(r => isPathUnderRoot(filePath, r.path))
        const matchingRoot = matchingRoots.sort((a, b) => b.path.length - a.path.length)[0]
        const rootPath = matchingRoot?.path || config.dirs[0]?.path || ''
        callbacks.onFileChange(rootPath, 'add', filePath)
      }
    })
    .on('change', (filePath) => {
      if (config.allowedExtensions.some(ext => filePath.endsWith(ext))) {
        const matchingRoots = config.dirs.filter(r => isPathUnderRoot(filePath, r.path))
        const matchingRoot = matchingRoots.sort((a, b) => b.path.length - a.path.length)[0]
        const rootPath = matchingRoot?.path || config.dirs[0]?.path || ''
        callbacks.onFileChange(rootPath, 'change', filePath)
      }
    })
    .on('unlink', (filePath) => {
      if (config.allowedExtensions.some(ext => filePath.endsWith(ext))) {
        const matchingRoots = config.dirs.filter(r => isPathUnderRoot(filePath, r.path))
        const matchingRoot = matchingRoots.sort((a, b) => b.path.length - a.path.length)[0]
        const rootPath = matchingRoot?.path || config.dirs[0]?.path || ''
        callbacks.onFileChange(rootPath, 'unlink', filePath)
      }
    })
    .on('addDir', (filePath) => {
      const matchingRoots = config.dirs.filter(r => isPathUnderRoot(filePath, r.path))
      const matchingRoot = matchingRoots.sort((a, b) => b.path.length - a.path.length)[0]
      const rootPath = matchingRoot?.path || config.dirs[0]?.path || ''
      callbacks.onFileChange(rootPath, 'addDir', filePath)
    })
    .on('unlinkDir', (filePath) => {
      const matchingRoots = config.dirs.filter(r => isPathUnderRoot(filePath, r.path))
      const matchingRoot = matchingRoots.sort((a, b) => b.path.length - a.path.length)[0]
      const rootPath = matchingRoot?.path || config.dirs[0]?.path || ''
      callbacks.onFileChange(rootPath, 'unlinkDir', filePath)
    })
    .on('error', (error) => console.error('Watcher error:', error))

  return watcher
}