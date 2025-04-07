import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { splitVendorChunkPlugin } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    splitVendorChunkPlugin()
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // Backend server
        changeOrigin: true, // Ensure the request appears to come from the frontend server
        //rewrite: (path) => path.replace(/^\/api/, ''), // Optional: Remove '/api' prefix
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 800, // Increase the warning limit to 800kb
    rollupOptions: {
      output: {
        manualChunks: {
          // Split React and related libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Split Material UI
          'mui-vendor': [
            '@mui/material',
            '@mui/icons-material',
            '@emotion/react',
            '@emotion/styled'
          ],
          // Split markdown related packages
          'markdown-vendor': [
            'react-markdown',
            'rehype-highlight',
            'rehype-raw',
            'rehype-sanitize',
            'remark-gfm'
          ]
        }
      }
    }
  }
})
