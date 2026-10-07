/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import webTsconfig from './tsconfig.json';
import { privateCatalogPlugin } from './privateCatalogPlugin';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), privateCatalogPlugin(loadEnv(mode, __dirname, 'LUDOMATHS_').LUDOMATHS_PRIVATE_CATALOG_FILE)],
  esbuild: {
    // A string bypasses per-file tsconfig lookup for shared modules in ../src.
    // Use the web compiler options instead of the mobile config and its dependencies.
    tsconfigRaw: JSON.stringify({ compilerOptions: webTsconfig.compilerOptions }),
  },
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
}));
