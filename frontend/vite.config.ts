import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'apollo-vendor': ['@apollo/client', 'graphql', 'graphql-ws'],
          'bootstrap-vendor': ['react-bootstrap', 'bootstrap', '@popperjs/core'],
          'ui-vendor': ['@dnd-kit/core', '@dnd-kit/sortable', 'react-calendar', 'react-bootstrap-icons'],
          'utils-vendor': ['date-fns'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
  },
})
