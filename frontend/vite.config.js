import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server proxies /auth, /queries and /admin to the FastAPI backend so
// the frontend never needs CORS — same-origin in development, same-origin
// in production (static files served by FastAPI itself).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:8000',
      '/queries': 'http://localhost:8000',
      '/admin': 'http://localhost:8000',
      '/generation': 'http://localhost:8000',
      '/audio': 'http://localhost:8000'
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
