import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  // Yandex Games требует всё в одном html+js, поэтому инлайним ассеты
  build: {
    outDir: 'dist',
    target: 'es2020',
    // Не разбивать на чанки — для Yandex Games нужен один бандл
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    host: true,
    port: 3000,
  },
});
