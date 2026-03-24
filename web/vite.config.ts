import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname),
  resolve: {
    alias: {
      '@engine': path.resolve(__dirname, '../src'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../dist/web'),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    open: true,
  },
});
