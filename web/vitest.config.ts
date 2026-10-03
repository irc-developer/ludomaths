import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import webTsconfig from './tsconfig.json';

export default defineConfig({
  plugins: [react()],
  esbuild: {
    // Match the web build when transforming shared modules outside web/.
    tsconfigRaw: JSON.stringify({ compilerOptions: webTsconfig.compilerOptions }),
  },
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
