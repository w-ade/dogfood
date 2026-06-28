import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Renderer-only dev server (NO Electron) — for browser design-view of the
// Dogfood UI. Nothing launches but the page. Run: npm run design
export default defineConfig({
  root: resolve('src/renderer'),
  resolve: {
    alias: { '@': resolve('src/renderer/src') },
    dedupe: ['react', 'react-dom']
  },
  plugins: [react()],
  server: { port: 5176, strictPort: true }
})
