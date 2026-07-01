import { defineConfig } from 'vite'

export default defineConfig({
  build: { outDir: 'dist' },
  server: { port: 3000 },
  define: {
    __API_BASE__: JSON.stringify(process.env.VITE_API_BASE || 'https://phimapi.com')
  }
})
