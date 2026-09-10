import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
const proxy = { '/api': { target: process.env.API_TARGET || 'http://localhost:3000', changeOrigin: true } };
export default defineConfig({ plugins: [react()], server: { proxy }, preview: { proxy } })
