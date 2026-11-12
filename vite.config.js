import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base relativa: o build abre em qualquer pasta ou subcaminho
export default defineConfig({
  plugins: [react()],
  base: './',
})
