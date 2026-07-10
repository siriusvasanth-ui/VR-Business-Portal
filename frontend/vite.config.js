import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// During local development, API calls to /api are proxied to the backend on
// port 5000 so the frontend can use same-origin relative URLs. In production
// the frontend talks to VITE_API_BASE_URL (see src/api/client.js).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/api-docs': { target: 'http://localhost:5000', changeOrigin: true }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
