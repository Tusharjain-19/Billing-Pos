import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 8090,
    host: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false
  }
});
