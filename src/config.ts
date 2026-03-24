import path from 'path'
import fs from 'fs'
import markdownExtensions from 'markdown-extensions'

export interface ColonydocConfig {
  root: string
  port: number
  host: string
  allowedExtensions: string[]
  theme: {
    default: 'light' | 'dark' | 'system'
  }
  editor: {
    autosave: boolean
    debounceMs: number
  }
}

const defaultConfig: ColonydocConfig = {
  root: process.cwd(),
  port: 5787,
  host: '0.0.0.0',
  allowedExtensions: markdownExtensions.map((ext) => `.${ext}`),
  theme: {
    default: 'system',
  },
  editor: {
    autosave: true,
    debounceMs: 300,
  },
}

export async function loadConfig(configPath?: string): Promise<ColonydocConfig> {
  const config = { ...defaultConfig }

  const possiblePaths = configPath
    ? [configPath]
    : [
        path.join(process.cwd(), 'colonydoc.config.js'),
        path.join(process.cwd(), 'colonydoc.config.mjs'),
      ]

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const module = await import(p)
        const userConfig = module.default || module
        Object.assign(config, userConfig)
        if (userConfig.theme) {
          config.theme = { ...defaultConfig.theme, ...userConfig.theme }
        }
        if (userConfig.editor) {
          config.editor = { ...defaultConfig.editor, ...userConfig.editor }
        }
        break
      } catch (e) {
        console.warn(`Failed to load config from ${p}:`, e)
      }
    }
  }

  config.root = path.resolve(config.root)

  return config
}

export { defaultConfig }