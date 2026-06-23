import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import crypto from 'crypto'

const HISTORY_BASE_DIR = path.join(os.homedir(), '.colonynote', 'history')

const MAX_SNAPSHOTS = 50
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000
const MERGE_INTERVAL_MS = 60 * 1000

export interface SnapshotMeta {
  timestamp: number
  source: string
  size: number
  hash: string
  file: string
}

interface SnapshotManifest {
  snapshots: SnapshotMeta[]
}

function hashRootPath(rootPath: string): string {
  return crypto.createHash('sha256').update(path.resolve(rootPath)).digest('hex').slice(0, 16)
}

function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex')
}

export function getFileHistoryDir(rootPath: string, filePath: string): string {
  const relativePath = filePath.startsWith('/') ? filePath.slice(1) : filePath
  const rootHash = hashRootPath(rootPath)
  return path.join(HISTORY_BASE_DIR, rootHash, relativePath)
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true })
}

function manifestPath(dir: string): string {
  return path.join(dir, 'snapshots.json')
}

async function readManifest(dir: string): Promise<SnapshotManifest> {
  try {
    const raw = await fs.readFile(manifestPath(dir), 'utf-8')
    const data = JSON.parse(raw) as SnapshotManifest
    if (Array.isArray(data.snapshots)) return data
  } catch {
    // ignore read/parse errors
  }
  return { snapshots: [] }
}

async function writeManifest(dir: string, manifest: SnapshotManifest): Promise<void> {
  await fs.writeFile(manifestPath(dir), JSON.stringify(manifest, null, 2), 'utf-8')
}

function formatTimestamp(now = Date.now()): string {
  return now.toString()
}

async function pruneSnapshots(dir: string, manifest: SnapshotManifest): Promise<void> {
  const now = Date.now()
  const before = manifest.snapshots.length
  const kept: SnapshotMeta[] = []
  const removedFiles = new Set<string>()

  for (const snapshot of manifest.snapshots) {
    if (now - snapshot.timestamp > MAX_AGE_MS) {
      removedFiles.add(snapshot.file)
      continue
    }
    kept.push(snapshot)
  }

  // Keep only the most recent MAX_SNAPSHOTS
  if (kept.length > MAX_SNAPSHOTS) {
    const overflow = kept.slice(0, kept.length - MAX_SNAPSHOTS)
    for (const snapshot of overflow) {
      removedFiles.add(snapshot.file)
    }
    kept.splice(0, kept.length - MAX_SNAPSHOTS)
  }

  if (removedFiles.size > 0) {
    for (const file of removedFiles) {
      try {
        await fs.unlink(path.join(dir, file))
      } catch {
        // ignore
      }
    }
    manifest.snapshots = kept
  }
}

export async function createSnapshot(
  rootPath: string,
  filePath: string,
  content: string,
  source: string,
  options: { force?: boolean } = {}
): Promise<SnapshotMeta | null> {
  const dir = getFileHistoryDir(rootPath, filePath)
  await ensureDir(dir)

  const manifest = await readManifest(dir)
  const contentHash = hashContent(content)

  const lastSnapshot = manifest.snapshots[manifest.snapshots.length - 1]

  // 内容没有变化，不重复存档
  if (lastSnapshot && lastSnapshot.hash === contentHash) {
    return null
  }

  const now = Date.now()

  // 短时间内的非强制存档，合并到上一条
  if (!options.force && lastSnapshot && now - lastSnapshot.timestamp < MERGE_INTERVAL_MS) {
    const oldFile = lastSnapshot.file
    try {
      await fs.unlink(path.join(dir, oldFile))
    } catch {
      // ignore
    }
    const newFile = `${formatTimestamp(now)}.md`
    await fs.writeFile(path.join(dir, newFile), content, 'utf-8')
    lastSnapshot.timestamp = now
    lastSnapshot.source = source
    lastSnapshot.size = Buffer.byteLength(content, 'utf-8')
    lastSnapshot.hash = contentHash
    lastSnapshot.file = newFile
    await pruneSnapshots(dir, manifest)
    await writeManifest(dir, manifest)
    return lastSnapshot
  }

  const newFile = `${formatTimestamp(now)}.md`
  await fs.writeFile(path.join(dir, newFile), content, 'utf-8')
  const snapshot: SnapshotMeta = {
    timestamp: now,
    source,
    size: Buffer.byteLength(content, 'utf-8'),
    hash: contentHash,
    file: newFile,
  }
  manifest.snapshots.push(snapshot)
  await pruneSnapshots(dir, manifest)
  await writeManifest(dir, manifest)
  return snapshot
}

export async function listSnapshots(rootPath: string, filePath: string): Promise<SnapshotMeta[]> {
  const dir = getFileHistoryDir(rootPath, filePath)
  const manifest = await readManifest(dir)
  return manifest.snapshots.slice().sort((a, b) => b.timestamp - a.timestamp)
}

export async function getSnapshotContent(rootPath: string, filePath: string, timestamp: number): Promise<string | null> {
  const dir = getFileHistoryDir(rootPath, filePath)
  const manifest = await readManifest(dir)
  const snapshot = manifest.snapshots.find(s => s.timestamp === timestamp)
  if (!snapshot) return null
  try {
    return await fs.readFile(path.join(dir, snapshot.file), 'utf-8')
  } catch {
    return null
  }
}

export async function snapshotCurrentFile(rootPath: string, filePath: string, source: string): Promise<SnapshotMeta | null> {
  const fullPath = path.join(rootPath, filePath.startsWith('/') ? filePath.slice(1) : filePath)
  try {
    const content = await fs.readFile(fullPath, 'utf-8')
    return createSnapshot(rootPath, filePath, content, source, { force: true })
  } catch {
    return null
  }
}

export async function restoreSnapshot(rootPath: string, filePath: string, timestamp: number): Promise<string | null> {
  const content = await getSnapshotContent(rootPath, filePath, timestamp)
  if (content === null) return null

  // 先给当前内容拍个快照，防止后悔
  await snapshotCurrentFile(rootPath, filePath, 'pre-restore')

  const fullPath = path.join(rootPath, filePath.startsWith('/') ? filePath.slice(1) : filePath)
  await fs.mkdir(path.dirname(fullPath), { recursive: true })
  await fs.writeFile(fullPath, content, 'utf-8')
  return content
}
