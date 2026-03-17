import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5787,
    host: true,
    hmr: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5788',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:5788',
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
  },
})
