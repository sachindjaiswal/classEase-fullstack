import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// API proxy target: defaults to localhost:8000 (php artisan serve).
// In Docker, set VITE_API_TARGET=http://nginx to proxy through the nginx container.
const apiTarget = process.env.VITE_API_TARGET || 'http://localhost:8000';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    // Poll instead of relying on chokidar so bind-mounted edits from the
    // Windows host are picked up inside Docker (otherwise Vite serves stale modules).
    watch: { usePolling: true },
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
});
