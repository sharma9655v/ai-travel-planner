import { test, expect, type Page } from '@playwright/test';
import {
  ITINERARIES_STORAGE_KEY,
  generateResponse,
  makeSavedItinerary,
  refinedItinerary,
  tokyoItinerary,
  weatherResponse,
} from '../fixtures';

// Seed the zustand persist store (plans) plus a stubbed weather API so every
// itinerary page load is deterministic and never depends on the network.
// Only seeds when the key is absent — app-persisted state (e.g. share links
// created during the test) survives subsequent navigations.
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
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(weatherResponse),
    })
  );
}

test.describe('critical flows', () => {
  test('wizard: create an itinerary end-to-end', async ({ page }) => {
    await page.route('**/api/generate', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(generateResponse),
      })
    );
    await page.route('**/api/enrich', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ itinerary: tokyoItinerary }),
      })
    );
    await page.route('**/api/weather*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(weatherResponse),
      })
    );

    await page.goto('/plan');
    await page.getByPlaceholder('e.g., New Delhi, Mumbai, London').fill('Mumbai');
    await page.getByPlaceholder('e.g., Goa, Bali, Paris, Tokyo').fill('Tokyo');
    await page.locator('input[type="date"]').nth(0).fill('2026-10-01');
    await page.locator('input[type="date"]').nth(1).fill('2026-10-07');

    // During framer-motion transitions the exiting step stays mounted, so
    // always target the newest Continue button (`.last()`) and assert the
    // *entering* step's heading (h2), which only the new step renders.
    const stepHeadings = [
      'Trip Details',
      'Travelers',
      'Budget',
      'Transportation',
      'Accommodation',
      'Food & Dining',
      'Interests',
      'Travel Style',
      'Review Your Trip',
    ];

    await page.getByRole('button', { name: 'Continue' }).last().click();
    await expect(page.getByRole('heading', { name: 'Travelers' })).toBeVisible();

    for (let step = 2; step <= 8; step++) {
      // Steps 4-7 require at least one selection before Continue enables.
      if (step === 4) await page.getByText('Flight', { exact: true }).click();
      if (step === 5) await page.getByText('Hotel', { exact: true }).click();
      if (step === 6) await page.getByText('No Restrictions', { exact: true }).click();
      if (step === 7) await page.getByText('Adventure', { exact: true }).click();

      await page.getByRole('button', { name: 'Continue' }).last().click();
      await expect(page.getByRole('heading', { name: stepHeadings[step] })).toBeVisible();
    }

    await page.getByRole('button', { name: /Generate My Itinerary/ }).click();
    await page.waitForURL(/\/itinerary\/[a-f0-9]{12}/);

    await expect(page.getByText('Tokyo', { exact: true }).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Shibuya Crossing').first()).toBeVisible({ timeout: 20_000 });
  });

  test('edit: refine a plan through the AI panel', async ({ page }) => {
    await seed(page, 'e2e-refine');
    await page.route('**/api/refine', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          itinerary: refinedItinerary,
          summary: 'Day 2 now visits the Tokyo National Museum.',
          changed: true,
        }),
      })
    );

    await page.goto('/itinerary/e2e-refine');
    await expect(page.getByText('Tokyo', { exact: true }).first()).toBeVisible({ timeout: 20_000 });

    await page.locator('button[style*="position: fixed"]').click();
    const input = page.locator('input[placeholder*="Edit your plan"]');
    await expect(input).toBeVisible();
    await input.fill('Replace Day 2 with a museum');
    await input.press('Enter');

    await expect(page.getByText('Day 2 now visits the Tokyo National Museum.')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText('Tokyo National Museum').first()).toBeVisible({ timeout: 20_000 });
  });

  test('report: printable travel report renders the plan', async ({ page }) => {
    await seed(page, 'e2e-report');
    await page.goto('/itinerary/e2e-report/report');
    await expect(page.getByText('Tokyo', { exact: true }).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Shibuya Crossing').first()).toBeVisible({ timeout: 20_000 });
  });

  test('weather: forecast renders from the weather API', async ({ page }) => {
    await seed(page, 'e2e-weather');
    await page.goto('/itinerary/e2e-weather');

    await expect(page.getByText('Weather Forecast')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('24°').first()).toBeVisible();
    await expect(page.getByText('Heat advisory')).toBeVisible();
    await expect(page.getByText('Clear', { exact: true }).first()).toBeVisible();
  });

  test('map: demo map shows honest notices', async ({ page }) => {
    await page.goto('/map');
    await expect(page.getByText('Your Location', { exact: false }).first()).toBeVisible();

    await page.getByRole('button', { name: 'Traffic' }).click();
    await expect(page.getByText("Live traffic layer coming soon.")).toBeVisible();
  });

  test('save: a saved plan survives a full reload', async ({ page }) => {
    await seed(page, 'e2e-persist');
    await page.goto('/itinerary/e2e-persist');
    await expect(page.getByText('Tokyo', { exact: true }).first()).toBeVisible({ timeout: 20_000 });

    await page.reload();
    await expect(page.getByText('Tokyo', { exact: true }).first()).toBeVisible({ timeout: 20_000 });
  });

  test('share: publish a link, view it as a visitor, then revoke it', async ({ page }) => {
    await seed(page, 'e2e-share');
    await page.goto('/itinerary/e2e-share');
    await expect(page.getByText('Tokyo', { exact: true }).first()).toBeVisible({ timeout: 20_000 });

    await page.getByRole('button', { name: 'Share this trip' }).click();
    await page.getByRole('button', { name: 'Create share link' }).click();

    const linkCell = page.locator('button:has-text("Copy")').locator('span').first();
    await expect(linkCell).toBeVisible({ timeout: 20_000 });
    const linkText = await linkCell.innerText();
    const token = linkText.match(/[a-f0-9]{48}/)![0];

    await page.goto(`/share/${token}`);
    await expect(page.getByText('Tokyo', { exact: true }).first()).toBeVisible({ timeout: 20_000 });

    await page.goto('/itinerary/e2e-share');
    await page.getByRole('button', { name: 'Share this trip' }).click();
    await page.getByRole('button', { name: 'Stop sharing' }).click();
    await page.getByRole('button', { name: 'Stop sharing' }).click();

    await expect(page.getByRole('button', { name: 'Create share link' })).toBeVisible({
      timeout: 20_000,
    });

    await page.goto(`/share/${token}`);
    await expect(page.getByText('This link is invalid or was revoked')).toBeVisible({
      timeout: 20_000,
    });
  });

  test('sanity: generated itinerary fixtures are plausible', async () => {
    expect(tokyoItinerary.tripSummary.destination).toBe('Tokyo');
    expect(tokyoItinerary.dailyItinerary.length).toBeGreaterThanOrEqual(2);
    expect(tokyoItinerary.dailyItinerary[0].activities[0].latitude).not.toBe(0);
  });
});
