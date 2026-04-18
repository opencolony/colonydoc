import { describe, it, expect } from 'vitest'
import { minimatch } from 'minimatch'

describe('ignore pattern matching', () => {
  const testPatterns = (patterns: string[], path: string): boolean => {
    return patterns.some(pattern => {
      const normalizedPattern = pattern.endsWith('/') ? pattern.slice(0, -1) : pattern
      return minimatch(path, normalizedPattern, { dot: true, matchBase: true })
    })
  }

  it('should match node_modules/', () => {
    const patterns = ['node_modules/']
    expect(testPatterns(patterns, '/home/user/projects/myapp/node_modules')).toBe(true)
    expect(testPatterns(patterns, '/home/user/projects/node_modules')).toBe(true)
    expect(testPatterns(patterns, '/home/user/projects/myapp/src')).toBe(false)
  })

  it('should match *.log', () => {
    const patterns = ['*.log']
    expect(testPatterns(patterns, '/home/user/app.log')).toBe(true)
    expect(testPatterns(patterns, '/home/user/debug.log')).toBe(true)
    expect(testPatterns(patterns, '/home/user/app.js')).toBe(false)
  })

  it('should match **/test/**', () => {
    const patterns = ['**/test/**']
    expect(testPatterns(patterns, '/home/user/projects/myapp/test/unit')).toBe(true)
    expect(testPatterns(patterns, '/home/user/test/integration')).toBe(true)
    expect(testPatterns(patterns, '/home/user/projects/myapp/src')).toBe(false)
  })

  it('should match .env', () => {
    const patterns = ['.env']
    expect(testPatterns(patterns, '/home/user/projects/myapp/.env')).toBe(true)
    expect(testPatterns(patterns, '/home/user/.env')).toBe(true)
    expect(testPatterns(patterns, '/home/user/projects/myapp/.env.local')).toBe(false)
  })

  it('should not match with empty patterns', () => {
    const patterns: string[] = []
    expect(testPatterns(patterns, '/home/user/projects/myapp/node_modules')).toBe(false)
  })

  it('should match multiple patterns', () => {
    const patterns = ['node_modules/', '*.log', '.git/']
    expect(testPatterns(patterns, '/home/user/app.log')).toBe(true)
    expect(testPatterns(patterns, '/home/user/node_modules')).toBe(true)
    expect(testPatterns(patterns, '/home/user/.git')).toBe(true)
    expect(testPatterns(patterns, '/home/user/src')).toBe(false)
  })

  it('should match relative paths', () => {
    const patterns = ['node_modules/']
    expect(testPatterns(patterns, 'node_modules')).toBe(true)
    expect(testPatterns(patterns, 'src/node_modules')).toBe(true)
    expect(testPatterns(patterns, 'src')).toBe(false)
  })
})
