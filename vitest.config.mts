import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: [
      'lib/**/__tests__/**/*.test.ts',
      'content/**/__tests__/**/*.test.ts',
      'components/**/__tests__/**/*.test.ts',
    ],
    exclude: ['node_modules/**', 'e2e/**', 'out/**', '.next/**'],
  },
});
