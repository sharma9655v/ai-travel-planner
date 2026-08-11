'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { SavedItinerary } from '@/types/itinerary';
import {
  ITINERARIES_STORAGE_KEY,
  STORAGE_BUDGET_BYTES,
  estimatePlansSize,
  isQuotaError,
  pruneOldestPlans,
} from '@/lib/storage/savedItineraries';
import { deleteTripFromCloud, setTripFavorite, syncTripToCloud } from '@/lib/trips/cloud';
import { revokeShare } from '@/lib/sharing/client';
import type { ShareLinkMeta } from '@/lib/sharing/types';

interface ItinerariesStore {
  plans: Record<string, SavedItinerary>;
  favorites: Record<string, boolean>;
  shares: Record<string, ShareLinkMeta>;

  saveItinerary: (id: string, saved: SavedItinerary) => void;
  deleteItinerary: (id: string) => void;
  getPlan: (id: string) => SavedItinerary | undefined;
  toggleFavorite: (id: string) => void;
  setShare: (id: string, meta: ShareLinkMeta) => void;
  clearShare: (id: string) => void;
}

function buildEntry(
  existing: SavedItinerary | undefined,
  saved: SavedItinerary
): SavedItinerary {
  return existing
    ? { ...saved, createdAt: existing.createdAt, updatedAt: new Date().toISOString() }
    : saved;
}

export const useItinerariesStore = create<ItinerariesStore>()(
  persist(
    (set, get) => ({
      plans: {},
      favorites: {},
      shares: {},

      saveItinerary: (id, saved) => {
        try {
          const entry = buildEntry(get().plans[id], saved);

          set((state) => {
            let plans = { ...state.plans, [id]: entry };
            let prunedAny = false;
            let guard = 0;

            while (
              estimatePlansSize(plans) > STORAGE_BUDGET_BYTES &&
              Object.keys(plans).length > 1 &&
              guard < 10
            ) {
              // keepCount counts candidates, which already exclude the saved id
              plans = pruneOldestPlans(plans, Math.max(0, Object.keys(plans).length - 2), id);
              prunedAny = true;
              guard++;
            }

            if (prunedAny) {
              console.warn('[itineraries] Storage budget reached — pruned the oldest saved trip.');
            }

            return { plans };
          });

          // Cloud sync is best-effort: signed-in users get their trips backed up,
          // guests and offline sessions are unaffected.
          void syncTripToCloud(entry).catch(() => {});
        } catch (error) {
          if (isQuotaError(error)) {
            console.error('[itineraries] localStorage quota exceeded — trip not persisted.');
          } else {
            console.error('[itineraries] Failed to persist itinerary:', error);
          }
        }
      },

      deleteItinerary: (id) => {
        const current = get().plans;
        if (!(id in current)) return;
        const plans = { ...current };
        delete plans[id];
        const favorites = { ...get().favorites };
        delete favorites[id];
        const shares = { ...get().shares };
        const meta = shares[id];
        delete shares[id];
        set({ plans, favorites, shares });

        // Deleting a trip also revokes its public link (privacy first).
        if (meta) {
          void revokeShare(meta.token, meta.revokeKey).catch(() => {});
        }
        void deleteTripFromCloud(id).catch(() => {});
      },

      getPlan: (id) => get().plans[id],

      toggleFavorite: (id) => {
        const next = !get().favorites[id];
        set((state) => ({ favorites: { ...state.favorites, [id]: next } }));

        void setTripFavorite(id, next).catch(() => {});
      },

      setShare: (id, meta) => {
        set((state) => ({ shares: { ...state.shares, [id]: meta } }));
      },

      clearShare: (id) => {
        set((state) => {
          const shares = { ...state.shares };
          delete shares[id];
          return { shares };
        });
      },
    }),
    {
      name: ITINERARIES_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => ({ plans: state.plans, favorites: state.favorites, shares: state.shares }),
    }
  )
);
