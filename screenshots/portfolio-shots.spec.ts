import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ITINERARIES_STORAGE_KEY,
  tokyoItinerary,
  weatherResponse,
} from '../tests/fixtures';
import { createDefaultQuestionnaireData } from '../src/types/questionnaire';
import type { TravelItinerary, SavedItinerary } from '../src/types/itinerary';

const SHOTS = join(process.cwd(), 'docs', 'screenshots');
const TMP = join(SHOTS, 'tmp');
const TRIP_ID = 'demo-tokyo';

function defaultQuestionnaireData() {
  const data = createDefaultQuestionnaireData();
  data.tripDetails = {
    startingLocation: 'Mumbai',
    destination: 'Tokyo',
    departureDate: '2026-10-01',
    returnDate: '2026-10-07',
    flexibleDates: false,
  };
  return data;
}

function expandDays(base: TravelItinerary): TravelItinerary {
  const days: TravelItinerary['dailyItinerary'] = [
    { day: 3, title: 'Ueno & Yanaka', summary: 'Museums in the morning, old-town streets in the afternoon.', date: '2026-10-03', activities: [
      { time: '09:30', endTime: '12:30', name: 'Tokyo National Museum', description: 'World-class Japanese art, swords and ukiyo-e.', location: 'Ueno', latitude: 35.7188, longitude: 139.7765, duration: '3 hours', category: 'culture', estimatedCost: 1000, tips: 'Rent the audio guide.', rating: 4.6, openingHours: '9:30–17:00' },
      { time: '13:30', endTime: '16:00', name: 'Yanaka Ginza', description: 'Lanes of tiny shops and street food.', location: 'Yanaka', latitude: 35.7241, longitude: 139.7648, duration: '2.5 hours', category: 'food', estimatedCost: 2500, tips: 'Try the croquettes.', rating: 4.4, openingHours: '10:00–18:00' },
    ], totalCost: 3500 },
    { day: 4, title: 'Kyoto Day Trip', summary: 'Shinkansen to Kyoto for temples and bamboo.', date: '2026-10-04', activities: [
      { time: '07:15', endTime: '08:45', name: 'Shinkansen to Kyoto', description: 'Fastest way to Kyoto from Tokyo.', location: 'Tokyo Station', latitude: 35.6812, longitude: 139.7671, duration: '1.5 hours', category: 'transport', estimatedCost: 13000, tips: 'Reserve window seats.', rating: 4.7, openingHours: '' },
      { time: '10:30', endTime: '12:00', name: 'Fushimi Inari Shrine', description: 'Thousands of vermilion torii gates.', location: 'Kyoto', latitude: 34.9671, longitude: 135.7727, duration: '1.5 hours', category: 'culture', estimatedCost: 0, tips: 'Go early or late to avoid crowds.', rating: 4.9, openingHours: '24 hours' },
      { time: '14:00', endTime: '15:30', name: 'Arashiyama Bamboo Grove', description: 'Walking paths through towering bamboo.', location: 'Arashiyama', latitude: 35.0168, longitude: 135.6762, duration: '1.5 hours', category: 'sightseeing', estimatedCost: 0, tips: 'Photograph the side paths.', rating: 4.6, openingHours: '24 hours' },
    ], totalCost: 13000 },
    { day: 5, title: 'Ginza & Tsukiji', summary: 'Morning market, afternoon shopping streets.', date: '2026-10-05', activities: [
      { time: '08:00', endTime: '10:00', name: 'Tsukiji Outer Market', description: 'Fresh seafood stalls and knife shops.', location: 'Tsukiji', latitude: 35.6654, longitude: 139.7707, duration: '2 hours', category: 'food', estimatedCost: 3500, tips: 'Try the tamagoyaki.', rating: 4.5, openingHours: '5:00–14:00' },
      { time: '11:00', endTime: '13:00', name: 'Ginza Shopping Streets', description: 'Flagship stores and department halls.', location: 'Ginza', latitude: 35.6717, longitude: 139.765, duration: '2 hours', category: 'shopping', estimatedCost: 5000, tips: 'Window-shop on Sundays when streets close.', rating: 4.2, openingHours: '10:00–20:00' },
      { time: '16:00', endTime: '18:00', name: 'teamLab Planets', description: 'Immersive digital art museum.', location: 'Toyosu', latitude: 35.6486, longitude: 139.79, duration: '2 hours', category: 'sightseeing', estimatedCost: 3800, tips: 'Book tickets in advance.', rating: 4.7, openingHours: '9:00–19:00' },
    ], totalCost: 12300 },
    { day: 6, title: 'Nikko Day Trip', summary: 'World Heritage shrines in the mountains.', date: '2026-10-06', activities: [
      { time: '08:30', endTime: '10:00', name: 'Tobu Railway to Nikko', description: 'Scenic ride into the mountains.', location: 'Asakusa', latitude: 35.7109, longitude: 139.7967, duration: '1.5 hours', category: 'transport', estimatedCost: 3800, tips: 'Get the round-trip pass.', rating: 4.4, openingHours: '' },
      { time: '11:00', endTime: '13:30', name: 'Toshogu Shrine', description: 'Lavish mausoleum of Tokugawa Ieyasu.', location: 'Nikko', latitude: 36.758, longitude: 139.5988, duration: '2.5 hours', category: 'culture', estimatedCost: 1300, tips: 'See the three wise monkeys.', rating: 4.8, openingHours: '8:00–17:00' },
      { time: '15:00', endTime: '16:30', name: 'Kegon Falls', description: '97-metre waterfall over basalt cliffs.', location: 'Nikko', latitude: 36.7379, longitude: 139.5018, duration: '1.5 hours', category: 'sightseeing', estimatedCost: 570, tips: 'The elevator view is worth it.', rating: 4.6, openingHours: '8:00–17:00' },
    ], totalCost: 5670 },
    { day: 7, title: 'Departure & Souvenirs', summary: 'Last-minute shopping and airport train.', date: '2026-10-07', activities: [
      { time: '10:00', endTime: '12:00', name: 'Akihabara Electronics Town', description: 'Anime, arcades and gadget stores.', location: 'Akihabara', latitude: 35.7022, longitude: 139.7745, duration: '2 hours', category: 'shopping', estimatedCost: 8000, tips: 'Duty-free counters accept passports.', rating: 4.4, openingHours: '10:00–20:00' },
      { time: '14:30', endTime: '16:30', name: 'Narita Express to Airport', description: 'Direct train to Narita Terminal 1.', location: 'Shinjuku', latitude: 35.6896, longitude: 139.7006, duration: '2 hours', category: 'transport', estimatedCost: 3500, tips: 'Board 20 minutes early.', rating: 4.3, openingHours: '' },
    ], totalCost: 11500 },
  ];

  return {
    ...base,
    dailyItinerary: [...base.dailyItinerary, ...days],
    accommodations: [
      ...base.accommodations,
      { name: 'Hoshinoya Tokyo', type: 'ryokan', rating: 4.8, pricePerNight: 85000, location: 'Otemachi', latitude: 35.6866, longitude: 139.7666, amenities: ['Onsen', 'Kaiseki dinner', 'WiFi'], description: 'Modern ryokan with a rooftop onsen.' },
      { name: 'Hotel Gracery Shinjuku', type: 'hotel', rating: 4.1, pricePerNight: 14000, location: 'Shinjuku', latitude: 35.6951, longitude: 139.7004, amenities: ['WiFi', '24h reception'], description: 'Reliable mid-range option near the station.' },
    ] as TravelItinerary['accommodations'],
    restaurants: [
      ...base.restaurants,
      { name: 'Sushi Dai', cuisine: 'Sushi', priceRange: '$$$', rating: 4.7, dietaryOptions: [], location: 'Tsukiji', latitude: 35.6655, longitude: 139.7709, description: 'Legendary market omakase.', mustTry: ['Omakase set'] },
      { name: 'Afuri Ramen', cuisine: 'Ramen', priceRange: '$$', rating: 4.4, dietaryOptions: ['Vegan options'], location: 'Ebisu', latitude: 35.6466, longitude: 139.7104, description: 'Yuzu-shio ramen with citrus broth.', mustTry: ['Yuzu shio ramen'] },
      { name: 'Narisawa', cuisine: 'Modern', priceRange: '$$$$', rating: 4.9, dietaryOptions: [], location: 'Minami Aoyama', latitude: 35.6698, longitude: 139.7093, description: 'Two-star tasting menu of Japanese terroir.', mustTry: ['Tasting menu'] },
    ] as TravelItinerary['restaurants'],
    budgetBreakdown: {
      totalEstimated: 385000,
      totalBudget: 400000,
      currency: 'JPY',
      categories: [
        { category: 'flights', estimated: 95000, percentage: 24 },
        { category: 'accommodation', estimated: 145000, percentage: 37 },
        { category: 'food', estimated: 60000, percentage: 16 },
        { category: 'transport', estimated: 45000, percentage: 12 },
        { category: 'activities', estimated: 35000, percentage: 9 },
        { category: 'misc', estimated: 5000, percentage: 2 },
      ],
      savingsTips: ['Book Shinkansen tickets 2 weeks ahead for saver fares.', 'Lunch sets at department basements are half the price of dinner.', 'Buy a 3-day Tokyo Metro pass instead of single tickets.'],
    },
    packingChecklist: [
      { category: 'Essentials', items: [{ item: 'Passport', packed: false, essential: true }, { item: 'IC card (Suica)', packed: false, essential: true }, { item: 'Travel insurance docs', packed: false, essential: true }] },
      { category: 'Clothing', items: [{ item: 'Light layers for October', packed: true, essential: false }, { item: 'Comfortable walking shoes', packed: true, essential: false }, { item: 'Compact umbrella', packed: false, essential: false }] },
      { category: 'Tech', items: [{ item: 'Portable charger', packed: true, essential: false }, { item: 'Universal adapter', packed: true, essential: false }] },
    ],
    transportationDetails: [
      ...base.transportationDetails,
      { from: 'Shinjuku', to: 'Tokyo Station', mode: 'train', duration: '15 min', estimatedCost: 200, notes: 'JR Yamanote line.' },
      { from: 'Tokyo Station', to: 'Kyoto Station', mode: 'shinkansen', duration: '2h 15m', estimatedCost: 13000, notes: 'Nozomi, reserve window seats.' },
    ] as TravelItinerary['transportationDetails'],
    emergencyContacts: [
      { service: 'Police', number: '110', notes: 'Emergency' },
      { service: 'Ambulance / Fire', number: '119', notes: 'Emergency' },
      { service: 'Japan Visitor Hotline', number: '050-3816-2787', notes: 'English support, 24h' },
      { service: 'Your hotel front desk', number: '03-1234-5678', notes: 'Keep this in your phone' },
    ] as TravelItinerary['emergencyContacts'],
    hiddenGems: [
      ...base.hiddenGems,
      { name: 'Shimokitazawa Vintage Shops', description: 'Flea-market energy in retro backstreets.', location: 'Shimokitazawa', latitude: 35.6619, longitude: 139.6671, category: 'shopping', tip: 'Afternoon is quietest.' },
      { name: 'Gotokuji Temple', description: 'The birthplace of maneki-neko beckoning cats.', location: 'Setagaya', latitude: 35.6474, longitude: 139.6471, category: 'culture', tip: 'Cat figurines are the perfect souvenir.' },
      { name: 'Yokohama Cup Noodle Museum', description: 'Build your own instant ramen.', location: 'Yokohama', latitude: 35.4574, longitude: 139.636, category: 'food', tip: 'Kids and adults both love the factory.' },
    ] as TravelItinerary['hiddenGems'],
    localCustoms: [...base.localCustoms, 'Shoes off in tatami rooms', 'No eating while walking'],
    travelTips: [...base.travelTips, 'Suica works on buses and konbini too.', 'October is typhoon season — check the forecast daily.'],
    importantNotes: [...base.importantNotes, 'Museums close on Mondays — plan around it.'],
  };
}

const portfolioTrip = expandDays(tokyoItinerary);

function savedTrip(id: string, itinerary: TravelItinerary): SavedItinerary {
  return {
    id,
    itinerary,
    questionnaireData: {
      tripDetails: {
        startingLocation: 'Mumbai',
        destination: 'Tokyo',
        departureDate: '2026-10-01',
        returnDate: '2026-10-07',
        flexibleDates: false,
      },
    } as SavedItinerary['questionnaireData'],
    createdAt: '2026-09-15T08:00:00.000Z',
  };
}

function seedScript(includePlan: boolean, generatedId: string | null): string {
  const planState = includePlan
    ? { plans: { [TRIP_ID]: savedTrip(TRIP_ID, portfolioTrip) }, favorites: { [TRIP_ID]: true }, shares: {} }
    : { plans: {}, favorites: {}, shares: {} };
  const questionnaire = {
    state: {
      data: defaultQuestionnaireData(),
      currentStep: 1,
      generatedId,
    },
    version: 1,
  };
  return `
    (() => {
      const k = ${JSON.stringify(ITINERARIES_STORAGE_KEY)};
      if (!localStorage.getItem(k)) {
        localStorage.setItem(k, ${JSON.stringify(JSON.stringify({ state: planState, version: 1 }))});
      }
      const q = 'atp:questionnaire:v1';
      if (!localStorage.getItem(q)) {
        localStorage.setItem(q, ${JSON.stringify(JSON.stringify(questionnaire))});
      }
    })();
  `;
}

async function shot(page: Page, name: string, fullPage = true) {
  await page.waitForTimeout(1400);
  await page.screenshot({ path: join(SHOTS, name), fullPage });
}

test.describe('portfolio screenshots', () => {
  test('home + hero (desktop & mobile)', async ({ page }) => {
    await page.addInitScript(seedScript(false, null));
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'load' });
    await expect(page.getByText('next adventure?')).toBeVisible();
    await shot(page, 'home.png');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload({ waitUntil: 'load' });
    await expect(page.getByText('next adventure?')).toBeVisible();
    await shot(page, 'home-mobile.png');
  });

  test('planner questionnaire', async ({ page }) => {
    await page.addInitScript(seedScript(false, null));
    await page.goto('/plan', { waitUntil: 'load' });
    await expect(page.getByRole('heading', { name: 'Trip Details' })).toBeVisible();
    await shot(page, 'planner.png', false);
  });

  test('itinerary (desktop & mobile)', async ({ page }) => {
    await page.route('**/api/weather**', (route) => route.fulfill({ json: weatherResponse }));
    await page.addInitScript(seedScript(true, TRIP_ID));
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/itinerary/${TRIP_ID}`, { waitUntil: 'load' });
    await expect(page.getByText('Shibuya Crossing').first()).toBeVisible();
    await shot(page, 'itinerary.png');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload({ waitUntil: 'load' });
    await expect(page.getByText('Shibuya Crossing').first()).toBeVisible();
    await shot(page, 'itinerary-mobile.png');
  });

  test('budget planner', async ({ page }) => {
    await page.route('**/api/weather**', (route) => route.fulfill({ json: weatherResponse }));
    await page.addInitScript(seedScript(true, TRIP_ID));
    await page.goto(`/budget/${TRIP_ID}`, { waitUntil: 'load' });
    await expect(page.getByText('Budget Planner').first()).toBeVisible();
    await shot(page, 'budget.png');
  });

  test('travel report', async ({ page }) => {
    await page.route('**/api/weather**', (route) => route.fulfill({ json: weatherResponse }));
    await page.addInitScript(seedScript(true, TRIP_ID));
    await page.goto(`/itinerary/${TRIP_ID}/report`, { waitUntil: 'load' });
    await expect(page.getByText('Tokyo', { exact: true }).first()).toBeVisible();
    await shot(page, 'report.png');
  });

  test('map explorer', async ({ page }) => {
    await page.addInitScript(seedScript(false, null));
    await page.goto('/map', { waitUntil: 'load' });
    await expect(page.getByText('Your Location', { exact: false }).first()).toBeVisible();
    await shot(page, 'map.png');
  });

  test('profile (guest with saved trip + empty profile)', async ({ page }) => {
    await page.addInitScript(seedScript(true, TRIP_ID));
    await page.goto('/profile', { waitUntil: 'load' });
    await expect(page.getByText('Saved Trips').first()).toBeVisible();
    await shot(page, 'profile.png');
    await page.addInitScript(() => localStorage.clear());
    await page.reload({ waitUntil: 'load' });
    await expect(page.getByText('No saved trips yet').first()).toBeVisible();
    await shot(page, 'empty.png');
  });

  test('loading experience (AI generation)', async ({ page }) => {
    await page.route('**/api/generate', async (route) => {
      await new Promise((r) => setTimeout(r, 20_000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'demo-loading', message: 'ok', itinerary: portfolioTrip, createdAt: '2026-09-15T08:00:00.000Z' }),
      });
    });
    await page.addInitScript(seedScript(false, null));
    await page.goto('/plan', { waitUntil: 'load' });
    await page.getByPlaceholder('e.g., New Delhi, Mumbai, London').fill('Mumbai');
    await page.getByPlaceholder('e.g., Goa, Bali, Paris, Tokyo').fill('Tokyo');
    await page.locator('input[type="date"]').nth(0).fill('2026-10-01');
    await page.locator('input[type="date"]').nth(1).fill('2026-10-07');
    await page.getByRole('button', { name: 'Continue' }).last().click();
    await expect(page.getByRole('heading', { name: 'Travelers' })).toBeVisible();
    for (let step = 2; step <= 8; step++) {
      if (step === 4) await page.getByText('Flight', { exact: true }).click();
      if (step === 5) await page.getByText('Hotel', { exact: true }).click();
      if (step === 6) await page.getByText('No Restrictions', { exact: true }).click();
      if (step === 7) await page.getByText('Adventure', { exact: true }).click();
      await page.getByRole('button', { name: 'Continue' }).last().click();
    }
    await page.getByRole('button', { name: /Generate My Itinerary/ }).click();
    await expect(page.getByText(/Planning your Tokyo/)).toBeVisible();
    await page.waitForTimeout(2500);
    await page.screenshot({ path: join(SHOTS, 'loading.png'), fullPage: false });
  });

  test('error state (unknown trip)', async ({ page }) => {
    await page.addInitScript(seedScript(false, null));
    await page.goto('/itinerary/does-not-exist', { waitUntil: 'load' });
    await expect(page.getByRole('heading', { name: 'Something Went Wrong' })).toBeVisible();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: join(SHOTS, 'error.png'), fullPage: false });
  });

  test('shared trip (public visitor view)', async ({ page }) => {
    const res = await page.request.post('/api/share', {
      data: { tripId: TRIP_ID, mode: 'view', itinerary: portfolioTrip },
    });
    expect(res.ok()).toBeTruthy();
    const { token } = (await res.json()) as { token: string };
    await page.goto(`/share/${token}`, { waitUntil: 'load' });
    await expect(page.getByText('Tokyo', { exact: true }).first()).toBeVisible();
    await shot(page, 'share.png');
  });

  test('brand assets: OG card, apple icon, favicon source', async ({ page }) => {
    await page.goto('file://' + join(process.cwd(), 'scripts', 'brand', 'og-card.html'));
    await page.screenshot({ path: join(process.cwd(), 'public', 'og-card.png'), fullPage: false });

    const iconSvg = readFileSync(join(process.cwd(), 'src', 'app', 'icon.svg'), 'utf8');
    await page.setContent(`<html><body style="margin:0;background:#090B10">${iconSvg}</body></html>`);
    await page.setViewportSize({ width: 180, height: 180 });
    await page.screenshot({ path: join(process.cwd(), 'src', 'app', 'apple-icon.png'), fullPage: false });
    await page.setViewportSize({ width: 32, height: 32 });
    await page.screenshot({ path: join(TMP, 'favicon-32.png'), fullPage: false });
  });
});
