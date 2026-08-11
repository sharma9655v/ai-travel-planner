import { defineConfig } from '@playwright/test';

// Portfolio screenshot suite — runs against a dev server on :3103 and writes
// PNGs to docs/screenshots/ (plus src/app icons and public/og-card.png).
export default defineConfig({
  testDir: './screenshots',
  testMatch: 'portfolio-shots.spec.ts',
  timeout: 180_000,
  workers: 1,
  reporter: 'list',
  webServer: {
    command: 'npm run dev -- --port 3103',
    url: 'http://localhost:3103',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  use: {
    baseURL: 'http://localhost:3103',
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  },
});
