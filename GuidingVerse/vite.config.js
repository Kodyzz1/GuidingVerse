import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        // manualChunks: { // Temporarily comment out
        //   vendor: ['react', 'react-dom', 'react-router-dom'],
        // },
      },
    },
  },
  server: {
    proxy: {
      // Proxy API requests to the backend server
      '/api': {
        target: 'http://localhost:3000', // Your local backend port
        changeOrigin: true,
        secure: false,      // Often needed for localhost development
        // rewrite: (path) => path.replace(/^\/api/, ''), // Uncomment if your backend routes don't start with /api
      }
    }
  }
});