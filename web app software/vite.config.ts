import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    hmr: {
      clientPort: 5173,
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
