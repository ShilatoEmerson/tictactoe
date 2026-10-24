import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:4000' }, // avoids CORS hassle in dev
  },
  test: { environment: 'jsdom', globals: true, setupFiles: './src/setupTests.js' },
});
