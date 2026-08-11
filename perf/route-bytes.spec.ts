import { test, expect, type Page } from '@playwright/test';
import { ITINERARIES_STORAGE_KEY, makeSavedItinerary, weatherResponse } from '../tests/fixtures';

async function seed(page: Page, id: string) {
  const saved = makeSavedItinerary(id);
  await page.addInitScript(
    ({ key, state }) => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify({ state, version: 1 }));
      }
    },
    { key: ITINERARIES_STORAGE_KEY, state: { plans: { [id]: saved }, favorites: {}, shares: {} } }
  );
  await page.route('**/api/weather*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(weatherResponse) })
  );
}

const ROUTES = [
  '/',
  '/plan',
  '/map',
  '/itinerary/e2e-wizard',
  '/itinerary/e2e-wizard/report',
  '/budget/e2e-wizard',
  '/share/e2e-wizard',
];

test.describe('perf: initial JS bytes per route (prod)', () => {
  for (const route of ROUTES) {
    test(route, async ({ page }) => {
      if (route.startsWith('/itinerary') || route.startsWith('/budget')) {
        await seed(page, 'e2e-wizard');
      }
      if (route.startsWith('/share')) {
        await page.addInitScript(({ key }) => {
          if (!localStorage.getItem(key)) {
            localStorage.setItem(
              key,
              JSON.stringify({ state: { plans: {}, favorites: {}, shares: {} }, version: 1 })
            );
          }
        }, { key: ITINERARIES_STORAGE_KEY });
      }

      await page.goto(route, { waitUntil: 'load' });
      await page.waitForTimeout(2500);

      const stats = await page.evaluate(() =>
        performance
          .getEntriesByType('resource')
          .filter((r) => r.name.endsWith('.js'))
          .map((r) => ({
            name: r.name.split('/').pop() ?? '',
            size: Math.round((r as PerformanceResourceTiming).transferSize / 1024),
          }))
      );
      const total = stats.reduce((a, b) => a + b.size, 0);
      const top = stats.sort((a, b) => b.size - a.size).slice(0, 8);
      console.log(`PERF ${route} totalKb=${total}`);
      for (const t of top) console.log(`  ${t.size}KB  ${t.name}`);
      expect(true).toBe(true);
    });
  }
});
