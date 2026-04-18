import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { ColonynoteConfig } from '../config.js'
import { createFileRouter } from './api.js'
import { IgnoreMatcher, defaultIgnoreConfig } from './ignore.js'

export function createApp(config: ColonynoteConfig) {
  const app = new Hono()

  const matcher = new IgnoreMatcher(config.dirs[0]?.path || process.cwd(), {
    globalPatterns: config.ignore.patterns,
  })

  app.use('*', cors())

  app.use('*', async (c, next) => {
    c.set('config', config)
    await next()
  })

  const fileRouter = createFileRouter(config, matcher)
  app.route('/api/files', fileRouter)

  return { app, matcher }
}