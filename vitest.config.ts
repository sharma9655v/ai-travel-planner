import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    // API route modules keep module-level rate limiters — give every test file
    // its own fresh module registry (pool: 'forks') and run files sequentially.
    pool: 'forks',
    fileParallelism: false,
    hookTimeout: 20_000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
