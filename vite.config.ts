import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  // Capacitor APK는 https://localhost/ 루트에서 웹 자산을 제공함. base가 /Web3star/ 등이면 JS 404 → 흰 화면.
  // --mode app 빌드는 항상 '/' (터미널에 남은 VITE_BASE_PATH 무시).
  base: mode === 'app' ? '/' : process.env.VITE_BASE_PATH || '/',
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
      // Figma asset alias
      'figma:asset': path.resolve(__dirname, './src/assets'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
}))
