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
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  server: {
    proxy: {
      // Proxy requests starting with /api to your backend server
      '/api': {
        target: 'http://localhost:3000', // Point to backend port 3000
        changeOrigin: true, // Recommended for virtual hosted sites
        // secure: false, // Uncomment if backend is http and you have issues
        // rewrite: (path) => path.replace(/^\/api/, ''), // Uncomment if your backend *doesn't* expect /api prefix
      }
    }
  }
});