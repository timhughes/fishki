import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react()
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
        manualChunks: (id) => {
          // Split React and related libraries
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('node_modules/react-router-dom')) {
            return 'react-vendor';
          }
          
          // Split Material UI
          if (id.includes('node_modules/@mui') || 
              id.includes('node_modules/@emotion')) {
            return 'mui-vendor';
          }
          
          // Split markdown related packages
          if (id.includes('node_modules/react-markdown') || 
              id.includes('node_modules/rehype') || 
              id.includes('node_modules/remark')) {
            return 'markdown-vendor';
          }
        }
      }
    }
  }
})
