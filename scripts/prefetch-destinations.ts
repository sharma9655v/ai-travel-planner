import { POPULAR_DESTINATIONS } from '@/lib/cache/popularDestinations';
import { geocodeLocation } from '@/lib/planning/geocode';
import { findHotels, findNearbyPlaces, findRestaurants } from '@/lib/planning/osm';

// ============================================================
// Cache pre-warming script.
//
// Usage: npm run prefetch:destinations
//
// For every destination in POPULAR_DESTINATIONS it resolves coordinates and
// pulls places/hotels/restaurants through the normal (cached) planning
// providers. The first real trip generation for that destination then reads
// everything from cache instead of hitting Nominatim/Overpass live.
//
// Respects provider usage rules: it runs the exact same queries the app
// makes with the same timeouts, sequentially per destination.
// ============================================================

function log(...args: unknown[]): void {
  console.log('[prefetch]', ...args);
}

async function prefetchDestination(name: string): Promise<void> {
  const startedAt = Date.now();

  const point = await geocodeLocation(name);
  if (!point) {
    log(`✗ ${name} — geocoding failed, skipping`);
    return;
  }

  const [places, hotels, restaurants] = await Promise.all([
    findNearbyPlaces(point),
    findHotels(point),
    findRestaurants(point),
  ]);

  log(
    `✓ ${name} — ${places.length} places, ${hotels.length} hotels, ${restaurants.length} restaurants (${Date.now() - startedAt}ms)`
  );
}

async function main(): Promise<void> {
  log(`Pre-warming cache for ${POPULAR_DESTINATIONS.length} destinations…`);
  const startedAt = Date.now();

  let failures = 0;
  for (const destination of POPULAR_DESTINATIONS) {
    try {
      await prefetchDestination(destination);
    } catch (error) {
      failures += 1;
      log(`✗ ${destination} — ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  log(`Done in ${Date.now() - startedAt}ms (${failures} destination failures).`);
  process.exit(failures === POPULAR_DESTINATIONS.length ? 1 : 0);
}

main().catch((error) => {
  log('Fatal:', error);
  process.exit(1);
});