export interface SearchIntent {
  mode: 'fuzzy' | 'prefix'
  root: string
  query: string
}

export function parseSearchIntent(input: string): SearchIntent {
  const trimmed = input.trim()

  if (!trimmed) {
    return { mode: 'fuzzy', root: '~', query: '' }
  }

  // Handle paths with slashes (e.g., ~/projects/colony, projects/colony, /etc/nginx)
  if (trimmed.includes('/')) {
    const lastSlashIndex = trimmed.lastIndexOf('/')
    const pathPart = trimmed.slice(0, lastSlashIndex)
    const queryPart = trimmed.slice(lastSlashIndex + 1)

    // If query part is empty, it's just a path browse
    if (!queryPart) {
      return { mode: 'fuzzy', root: pathPart || '/', query: '' }
    }

    // Single-level absolute path like '/et' → root should be '/'
    const root = pathPart || (trimmed.startsWith('/') ? '/' : '')
    return { mode: 'prefix', root, query: queryPart }
  }

  // Handle ~ alone
  if (trimmed === '~') {
    return { mode: 'fuzzy', root: '~', query: '' }
  }

  // Handle / alone
  if (trimmed === '/') {
    return { mode: 'fuzzy', root: '/', query: '' }
  }

  // Plain text search
  return { mode: 'fuzzy', root: '', query: trimmed }
}
