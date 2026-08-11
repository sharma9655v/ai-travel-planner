// ============================================================
// Popular destinations for cache pre-warming (see scripts/prefetch-destinations.ts).
// Kept as plain data — business logic never hardcodes these names; the script
// simply runs the same cached providers a real trip would hit, so the first
// real generation for these places is served from cache.
// ============================================================

export const POPULAR_DESTINATIONS: string[] = [
  'Goa',
  'Delhi',
  'Mumbai',
  'Jaipur',
  'Manali',
  'Dubai',
  'Bali',
];