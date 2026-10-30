import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Dev: Vite on 5179 proxies /api to the dashboard server on 5178. Build: web/dist, served by the server.
export default defineConfig({
  root: path.resolve(__dirname),
  plugins: [react()],
  server: {
    port: 5179,
    strictPort: true,
    host: '127.0.0.1',
    proxy: { '/api': 'http://127.0.0.1:5178' },
    fs: { allow: [path.resolve(__dirname, '..')] },
  },
  build: { outDir: 'dist', emptyOutDir: true, chunkSizeWarningLimit: 2000 },
});
