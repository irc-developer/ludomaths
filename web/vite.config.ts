/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@domain': resolve(__dirname, '../src/domain'),
      '@application': resolve(__dirname, '../src/application'),
    },
  },
  test: {
    environment: 'jsdom',
    // Solo ejecuta tests dentro de web/src — evita que Vitest procese
    // los archivos de Jest en ../src/domain y ../src/application.
    include: ['src/**/*.test.{ts,tsx}'],
    globals: false,
  },
});
