import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const { VITE_BACKEND_URL } = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    plugins: [react()],
    server: {
      port: 5173,
      allowedHosts: ['plain-demographic-tribune-nicole.trycloudflare.com'],
      proxy: {
        '/auth': {
          target: VITE_BACKEND_URL,
          changeOrigin: true,
          credentials: true
        },
        '/admin': {
          target: VITE_BACKEND_URL,
          changeOrigin: true,
          credentials: true
        },
        '/health': {
          target: VITE_BACKEND_URL,
          changeOrigin: true
        }
      }
    }
  };
});
