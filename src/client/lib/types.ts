/**
 * Client-side type definitions.
 *
 * These mirror server-side types from `src/config.ts` but are safe to import
 * in the browser bundle (no Node.js dependencies).
 */

/**
 * Configuration for a document root directory.
 * Keep in sync with the server-side DirConfig in `src/config.ts`.
 */
export interface DirConfig {
  path: string
  name?: string
  exclude?: string[]
  isCli?: boolean
}
