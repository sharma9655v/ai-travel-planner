import { chromium } from '@playwright/test';
import { ITINERARIES_STORAGE_KEY, tokyoItinerary, weatherResponse } from './tests/fixtures';
import { createDefaultQuestionnaireData } from './src/types/questionnaire';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.route('**/api/weather*', (route) => route.fulfill({ json: weatherResponse }));

  const data = createDefaultQuestionnaireData();
  data.tripDetails = {
    startingLocation: 'Mumbai',
    destination: 'Tokyo',
    departureDate: '2026-10-01',
    returnDate: '2026-10-07',
    flexibleDates: false,
  };
  const saved = {
    id: 'demo-tokyo',
    itinerary: tokyoItinerary,
    questionnaireData: data,
    createdAt: '2026-09-15T08:00:00.000Z',
  };
  await page.addInitScript(
    ({ key, plan }) => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify(plan));
      }
    },
    { key: ITINERARIES_STORAGE_KEY, plan: JSON.stringify({ state: { plans: { 'demo-tokyo': saved }, favorites: {}, shares: {} }, version: 1 }) }
  );

  await page.goto('http://localhost:3104/', { waitUntil: 'networkidle' });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.waitForTimeout(300);

  await page.goto('http://localhost:3104/itinerary/demo-tokyo', { waitUntil: 'networkidle' });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.waitForTimeout(300);

  const report = await page.evaluate(() => {
    const cw = document.documentElement.clientWidth;
    const vw = window.innerWidth;
    const out: any[] = [];
    for (const el of Array.from(document.querySelectorAll('*'))) {
      const r = el.getBoundingClientRect();
      if (r.right > cw + 1.5 || r.left < -1.5) {
        out.push({
          tag: el.tagName,
          cls: String(el.className || '').slice(0, 90),
          l: Math.round(r.left * 10) / 10,
          r: Math.round(r.right * 10) / 10,
          w: Math.round(r.width * 10) / 10,
          pos: getComputedStyle(el).position,
          text: (el.textContent || '').trim().slice(0, 40),
        });
      }
    }
    const scroll = Array.from(document.querySelectorAll('*'))
      .filter((el) => el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflowX === 'auto')
      .slice(0, 10)
      .map((el) => ({
        tag: el.tagName,
        cls: String(el.className || '').slice(0, 90),
        sw: el.scrollWidth,
        cw: el.clientWidth,
      }));
    return {
      clientW: cw,
      innerW: vw,
      htmlScrollW: document.documentElement.scrollWidth,
      bodyScrollW: document.body.scrollWidth,
      offenders: out.slice(0, 25),
      scrollables: scroll,
    };
  });
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
})();