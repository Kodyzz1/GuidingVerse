import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Add the server configuration section:
  server: {
    proxy: {
      // Proxy requests starting with /api to your backend server
      '/api': {
        target: 'http://localhost:3001', // Your backend server address
        changeOrigin: true, // Recommended for virtual hosted sites
        // secure: false, // Uncomment if backend is http and you have issues
        // rewrite: (path) => path.replace(/^\/api/, ''), // Uncomment if your backend *doesn't* expect /api prefix
      }
    }
  }
});