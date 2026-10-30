import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backend = env.VITE_PROXY_TARGET || 'http://localhost:5000';

  return {
    plugins: [react(), tailwindcss()],
    build: {
      chunkSizeWarningLimit: 1000, // exceljs is loaded only when downloading Excel
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom', 'axios'],
            charts: ['recharts'],
          },
        },
      },
    },
    server: {
      port: 5173,
      // In development the API and uploaded images are proxied to CricketBE, so phones on
      // the same Wi-Fi can open http://<your-laptop-ip>:5173 (run `npm run dev:lan`).
      proxy: {
        '/api': { target: backend, changeOrigin: true },
        '/uploads': { target: backend, changeOrigin: true },
      },
    },
  };
});
