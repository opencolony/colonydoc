import { describe, it, expect } from 'vitest'
import { parseSearchIntent } from './searchIntent'

describe('parseSearchIntent', () => {
  it('should parse ~/ prefix as prefix mode', () => {
    expect(parseSearchIntent('~/do')).toEqual({ mode: 'prefix', root: '~', query: 'do' })
  })

  it('should parse / prefix as prefix mode', () => {
    expect(parseSearchIntent('/et')).toEqual({ mode: 'prefix', root: '/', query: 'et' })
  })

  it('should parse plain text as fuzzy mode', () => {
    expect(parseSearchIntent('projects')).toEqual({ mode: 'fuzzy', root: '', query: 'projects' })
  })

  it('should handle empty string', () => {
    expect(parseSearchIntent('')).toEqual({ mode: 'fuzzy', root: '~', query: '' })
  })

  it('should handle ~ alone', () => {
    expect(parseSearchIntent('~')).toEqual({ mode: 'fuzzy', root: '~', query: '' })
  })

  it('should handle / alone', () => {
    expect(parseSearchIntent('/')).toEqual({ mode: 'fuzzy', root: '/', query: '' })
  })

  it('should handle ~/ alone', () => {
    expect(parseSearchIntent('~/')).toEqual({ mode: 'fuzzy', root: '~', query: '' })
  })

  it('should handle whitespace', () => {
    expect(parseSearchIntent('  ~/docs  ')).toEqual({ mode: 'prefix', root: '~', query: 'docs' })
  })

  it('should split ~/projects/colony into root and query', () => {
    expect(parseSearchIntent('~/projects/colony')).toEqual({ mode: 'prefix', root: '~/projects', query: 'colony' })
  })

  it('should split projects/colony into root and query', () => {
    expect(parseSearchIntent('projects/colony')).toEqual({ mode: 'prefix', root: 'projects', query: 'colony' })
  })

  it('should split /etc/nginx into root and query', () => {
    expect(parseSearchIntent('/etc/nginx')).toEqual({ mode: 'prefix', root: '/etc', query: 'nginx' })
  })

  it('should handle deep paths like ~/a/b/c', () => {
    expect(parseSearchIntent('~/a/b/c')).toEqual({ mode: 'prefix', root: '~/a/b', query: 'c' })
  })

  it('should handle trailing slash as fuzzy browse', () => {
    expect(parseSearchIntent('~/projects/')).toEqual({ mode: 'fuzzy', root: '~/projects', query: '' })
  })
})
