import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  root: fileURLToPath(new URL('./app/', import.meta.url)),
  base: './',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    assetsDir: 'site-assets',
    rollupOptions: { input: { wardrobe: fileURLToPath(new URL('./app/index.html', import.meta.url)), portal: fileURLToPath(new URL('./app/portal.html', import.meta.url)) } },
  },
});
