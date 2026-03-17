import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { ColonydocConfig } from '../config.js'
import { createFileRouter } from './api.js'

export function createApp(config: ColonydocConfig) {
  const app = new Hono()

  app.use('*', cors())

  app.use('*', async (c, next) => {
    c.set('config', config)
    await next()
  })

  const fileRouter = createFileRouter(config)
  app.route('/api/files', fileRouter)

  return app
}