import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'zustand'],
    alias: {
      // Force all packages to use the same React instance from the root
      'react': path.resolve('./node_modules/react'),
      'react-dom': path.resolve('./node_modules/react-dom'),
    }
  },
  optimizeDeps: {
    // Workspace packages are linked source (not pre-built), so let Vite read
    // them directly. Without this, adding a new @celeplay package requires
    // purging node_modules/.vite before it resolves.
    exclude: [
      '@celeplay/core-logic',
      '@celeplay/shared-ui',
      '@celeplay/game-duolock',
      '@celeplay/game-flipizi',
      '@celeplay/game-kalendily',
      '@celeplay/game-layerz',
      '@celeplay/game-square15',
      '@celeplay/game-wordmesh',
      '@celeplay/game-guexta',
    ],
  },
})
