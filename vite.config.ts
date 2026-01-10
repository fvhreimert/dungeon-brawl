/// <reference types="vitest" />
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

// Use relative paths for Tauri, GitHub Pages base path otherwise
const isTauri = process.env.TAURI_ENV_PLATFORM !== undefined

export default defineConfig({
  base: isTauri ? './' : '/dungeon-brawl/',
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: []
  }
})