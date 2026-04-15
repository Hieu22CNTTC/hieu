import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// API URL configuration
const API_URL = process.env.VITE_API_URL || 'http://localhost:3000'
const isVercelProduction = process.env.VERCEL_ENV === 'production'

// On Vercel, use the relative /_/backend path
const apiBaseUrl = isVercelProduction && process.env.VERCEL_ENV 
  ? '/_/backend/api' 
  : API_URL

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __API_URL__: JSON.stringify(apiBaseUrl)
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: API_URL,
        changeOrigin: true,
      },
      // Also proxy /_/backend for local development
      '/_/backend': {
        target: API_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/_\/backend/, '')
      }
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
