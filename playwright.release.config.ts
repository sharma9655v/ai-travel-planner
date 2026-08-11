import { defineConfig } from '@playwright/test';

// Release gate — runs against a PRODUCTION build (npm run start) on :3104 and
// enforces: no console errors, security headers, no horizontal overflow at key
// breakpoints, axe accessibility (no serious/critical violations), dark mode.
export default defineConfig({
  testDir: 'release-gate',
  testMatch: 'release.spec.ts',
  timeout: 120_000,
  workers: 1,
  reporter: 'list',
  webServer: {
    command: 'npm run start -- --port 3104',
    url: 'http://localhost:3104',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  use: {
    baseURL: 'http://localhost:3104',
    viewport: { width: 1440, height: 900 },
  },
});
