import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      sourcemap: !isProduction,
      chunkSizeWarningLimit: 1000,
    },
    server: {
      port: 3000,
      host: "0.0.0.0",
      hmr: false,
      watch: null,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8001',
          // changeOrigin is OFF on purpose - same reason as server.ts.
          // Rewriting the Host header to the target breaks Django's
          // subdomain-based tenant detection (Company.resolve_from_request).
          changeOrigin: false,
        },
      },
    },
  };
});
