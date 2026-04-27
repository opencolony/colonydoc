const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

export function extractFrontmatter(content: string): { frontmatter: string | null; body: string } {
  const match = content.match(FRONTMATTER_REGEX)
  if (!match) return { frontmatter: null, body: content }
  return { frontmatter: match[1].trim(), body: content.slice(match[0].length) }
}
