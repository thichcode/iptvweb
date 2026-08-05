import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: { outDir: 'dist' },
  server: { port: 3000 },
  plugins: [{
    name: 'strip-crossorigin',
    transformIndexHtml: { enforce: 'post', transform: (html) => html.replace(/ crossorigin/g, '') }
  }]
})
