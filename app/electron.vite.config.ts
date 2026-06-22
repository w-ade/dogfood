import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: { '@': resolve('src/renderer/src') },
      // dialkit ships its own React; dedupe so hooks run against the app's
      // single React instance (otherwise: "Invalid hook call").
      dedupe: ['react', 'react-dom']
    },
    plugins: [react()],
    build: {
      rollupOptions: {
        input: {
          index: resolve('src/renderer/index.html'),
          debug: resolve('src/renderer/debug.html')
        }
      }
    }
  }
})
