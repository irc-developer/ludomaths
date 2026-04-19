import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@domain':      resolve(__dirname, '../src/domain'),
      '@application': resolve(__dirname, '../src/application'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
