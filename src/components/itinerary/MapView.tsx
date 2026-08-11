'use client';

import { DayPlan, Accommodation, Restaurant, HiddenGem } from '@/types/itinerary';
import LazyMount from '@/components/shared/LazyMount';
import MapComponent from './MapComponent';

export default function MapView({
  dailyItinerary,
  accommodations,
  restaurants,
  hiddenGems,
}: {
  dailyItinerary: DayPlan[];
  accommodations: Accommodation[];
  restaurants: Restaurant[];
  hiddenGems: HiddenGem[];
}) {
  // Leaflet is heavy (~90KB gzipped) and the map sits below the fold on the
  // itinerary page — defer mounting (and its chunk load) until it's near view.
  return (
    <LazyMount>
      <MapComponent
        dailyItinerary={dailyItinerary}
        accommodations={accommodations}
        restaurants={restaurants}
        hiddenGems={hiddenGems}
      />
    </LazyMount>
  );
}
