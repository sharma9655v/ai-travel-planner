import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {
  ITINERARIES_STORAGE_KEY,
  tokyoItinerary,
  weatherResponse,
} from '../tests/fixtures';
import { createDefaultQuestionnaireData } from '../src/types/questionnaire';
import type { SavedItinerary } from '../src/types/itinerary';

const TRIP_ID = 'demo-tokyo';

function seedScript(): string {
  const data = createDefaultQuestionnaireData();
  data.tripDetails = {
    startingLocation: 'Mumbai',
    destination: 'Tokyo',
    departureDate: '2026-10-01',
    returnDate: '2026-10-07',
    flexibleDates: false,
  };
  const saved: SavedItinerary = {
    id: TRIP_ID,
    itinerary: tokyoItinerary,
    questionnaireData: data,
    createdAt: '2026-09-15T08:00:00.000Z',
  };
  return `
    (() => {
      const k = ${JSON.stringify(ITINERARIES_STORAGE_KEY)};
      if (!localStorage.getItem(k)) {
        localStorage.setItem(k, ${JSON.stringify(JSON.stringify({ state: { plans: { [TRIP_ID]: saved }, favorites: {}, shares: {} }, version: 1 }))});
      }
    })();
  `;
}

const VIEWPORTS = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
];

async function open(
  page: Page,
  path: string,
  { seed = false, interceptWeather = true }: { seed?: boolean; interceptWeather?: boolean } = {}
) {
  if (seed) await page.addInitScript(seedScript());
  if (interceptWeather) {
    await page.route('**/api/weather*', (route) => route.fulfill({ json: weatherResponse }));
  }
  await page.goto(path, { waitUntil: 'networkidle' });
}

test.describe('release gate', () => {
  test('no console errors on any route', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`${msg.text().slice(0, 160)} @ ${page.url()}`);
    });
    page.on('pageerror', (err) => errors.push(`pageerror: ${err.message.slice(0, 160)}`));

    await open(page, '/');
    await expect(page.getByText('next adventure?')).toBeVisible();

    await open(page, '/plan', { seed: true });
    await expect(page.getByRole('heading', { name: 'Trip Details' })).toBeVisible();

    await open(page, `/itinerary/${TRIP_ID}`, { seed: true });
    await expect(page.getByText('Shibuya Crossing').first()).toBeVisible();

    await open(page, `/budget/${TRIP_ID}`, { seed: true });
    await expect(page.getByText('Budget Planner').first()).toBeVisible();

    await open(page, `/itinerary/${TRIP_ID}/report`, { seed: true });
    await expect(page.getByText('Shibuya Crossing').first()).toBeVisible();

    await open(page, '/profile', { seed: true });
    await expect(page.getByText('Saved Trips').first()).toBeVisible();

    await open(page, '/map');
    await expect(page.getByText('Your Location', { exact: false }).first()).toBeVisible();

    expect(errors, `console errors:\n${errors.join('\n')}`).toEqual([]);
  });

  test('security headers are present', async ({ request }) => {
    const res = await request.get('/');
    const headers = res.headers();
    expect(headers['content-security-policy']).toContain("default-src 'self'");
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
    // K3 guard: script-src must be strict — no 'unsafe-inline' (nonce-based).
    expect(headers['content-security-policy']).toContain('script-src');
    expect(headers['content-security-policy']).toContain("'nonce-");
    expect(headers['content-security-policy']).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(headers['content-security-policy']).toContain("'strict-dynamic'");
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['permissions-policy']).toBeDefined();
  });

  test('responsive: no horizontal overflow at key breakpoints', async ({ page }) => {
    await open(page, '/');
    for (const vp of VIEWPORTS) {
      await page.setViewportSize(vp);
      await page.waitForTimeout(300);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow, `home overflow at ${vp.width}px`).toBeLessThanOrEqual(1);
    }
    await open(page, `/itinerary/${TRIP_ID}`, { seed: true });
    for (const vp of VIEWPORTS) {
      await page.setViewportSize(vp);
      await page.waitForTimeout(300);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow, `itinerary overflow at ${vp.width}px`).toBeLessThanOrEqual(1);
    }
    await open(page, '/plan', { seed: true });
    for (const vp of VIEWPORTS) {
      await page.setViewportSize(vp);
      await page.waitForTimeout(300);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow, `plan overflow at ${vp.width}px`).toBeLessThanOrEqual(1);
    }
  });

  test('dark mode: body uses theme background and html.dark', async ({ page }) => {
    await open(page, '/');
    const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(isDark).toBe(true);
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe('rgb(9, 11, 16)');
  });

  test('accessibility: no serious or critical violations (axe)', async ({ page }) => {
    await open(page, '/');
    await page.waitForTimeout(500);
    let results = await new AxeBuilder({ page }).analyze();
    let violations = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''));
    expect(violations, axeSummary(violations)).toEqual([]);

    await open(page, '/plan', { seed: true });
    await page.waitForTimeout(500);
    results = await new AxeBuilder({ page }).analyze();
    violations = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''));
    expect(violations, axeSummary(violations)).toEqual([]);

    await open(page, `/itinerary/${TRIP_ID}`, { seed: true });
    await page.waitForTimeout(500);
    results = await new AxeBuilder({ page }).analyze();
    violations = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''));
    expect(violations, axeSummary(violations)).toEqual([]);

    await open(page, '/profile', { seed: true });
    await page.waitForTimeout(500);
    results = await new AxeBuilder({ page }).analyze();
    violations = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''));
    expect(violations, axeSummary(violations)).toEqual([]);
  });

  test('share flow works on the production server', async ({ page }) => {
    const res = await page.request.post('/api/share', {
      data: { tripId: TRIP_ID, mode: 'view', itinerary: tokyoItinerary },
    });
    expect(res.ok()).toBeTruthy();
    const { token } = (await res.json()) as { token: string };
    await page.goto(`/share/${token}`, { waitUntil: 'networkidle' });
    await expect(page.getByText('Shibuya Crossing').first()).toBeVisible();
  });
});

function axeSummary(violations: { id: string; impact?: string | null; nodes: unknown[] }[]): string {
  return violations
    .map((v) => `${v.impact} ${v.id} (${v.nodes.length} nodes)`)
    .join('\n') || 'none';
}
