import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'perf',
  testMatch: 'route-bytes.spec.ts',
  timeout: 60_000,
  use: { baseURL: 'http://localhost:3102' },
  webServer: {
    command: 'npm run start -- --port 3102',
    url: 'http://localhost:3102',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  reporter: [['line']],
});
