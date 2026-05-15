import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "../src/main/resources/web",
    emptyOutDir: true,
    target: "es2015"
  }
})
