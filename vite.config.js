import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { copyFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'copy-worker',
      closeBundle: async () => {
        // 复制 _worker.js 到 dist 目录
        const src = resolve(__dirname, '_worker.js')
        const dest = resolve(__dirname, 'dist/_worker.js')
        if (existsSync(src)) {
          copyFileSync(src, dest)
          console.log('Copied _worker.js to dist/')
        }
      }
    }
  ],
})
