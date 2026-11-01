import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  root: fileURLToPath(new URL('./app/', import.meta.url)),
  base: './',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    assetsDir: 'site-assets',
  },
});
