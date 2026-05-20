import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: true,
    // Inline assets < 8KB, hash larger ones
    assetsInlineLimit: 8192,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/@tonconnect')) {
            return 'ton-connect';
          }
          if (id.includes('node_modules/@telegram-apps')) {
            return 'telegram-sdk';
          }
          if (id.includes('node_modules/matter-js')) {
            return 'physics';
          }
        },
        // Consistent naming for long-term caching
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
  },
})
