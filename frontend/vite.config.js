import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Reenvía /api al back. Así el navegador habla con un solo dominio
// (localhost o el túnel de ngrok) y el CORS del back no interviene.
const proxyApi = {
  '/api': {
    target: 'http://localhost:4002',
    changeOrigin: true,
    configure: (proxy) => {
      proxy.on('proxyReq', (pedido) => pedido.removeHeader('origin'));
    },
  },
};

// Dominios de ngrok para mostrar la app a testers desde esta PC.
const hostsPermitidos = ['.ngrok-free.dev', '.ngrok-free.app'];

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { proxy: proxyApi, allowedHosts: hostsPermitidos },
  preview: { proxy: proxyApi, allowedHosts: hostsPermitidos },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.js'],
  },
});
