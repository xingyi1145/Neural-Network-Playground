import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@testing-library/react': path.resolve(__dirname, './node_modules/@testing-library/react'),
      '@testing-library/user-event': path.resolve(__dirname, './node_modules/@testing-library/user-event'),
      'react-router-dom': path.resolve(__dirname, './node_modules/react-router-dom'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    include: ['../../tests/frontend/**/*.test.jsx'],
    deps: {
      inline: ['reactflow'],
    },
  },
  server: {
    fs: {
      allow: ['../../'],
    },
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        // Retry on connection refused (backend not ready)
        // eslint-disable-next-line no-unused-vars
        configure: (proxy, _options) => {
          // eslint-disable-next-line no-unused-vars
          proxy.on('error', (err, _req, res) => {
            console.log('[Proxy] Connection error - backend may still be starting:', err.code);
          });
        },
      },
    },
  },
});

