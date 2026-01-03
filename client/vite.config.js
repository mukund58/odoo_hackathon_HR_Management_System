import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://10.90.238.85:5000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://10.90.238.85:5000",
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 650,
  },
})
