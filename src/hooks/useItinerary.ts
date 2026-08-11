'use client';

import { useEffect, useState } from 'react';
import type { QuestionnaireData } from '@/types/questionnaire';
import type { TravelItinerary } from '@/types/itinerary';
import type { GenerateItineraryResponse, ServerItineraryResponse } from '@/types/api';
import { useQuestionnaireStore } from '@/hooks/useQuestionnaire';
import { useItinerariesStore } from '@/hooks/useItineraries';
import { recordTripEvent } from '@/lib/trips/cloud';

const NOT_FOUND_MESSAGE = 'Itinerary not found. It may have expired or the link is invalid.';

function logEnrichmentFailure(err: unknown): void {
  // Enrichment is best-effort by design — the user never sees this error.
  console.warn('[itinerary] Background enrichment failed (original itinerary kept):', err);
}

// Browsers hydrate zustand persist stores asynchronously (and storage can be
// unavailable, e.g. private mode). Without waiting, a cold deep link to
// /itinerary/[id] can run its load effect against an empty store and fall
// through to the 404 state even though the trip exists in localStorage.
// Known issue K1 — resolved here by deferring the load until hydration
// completes (with a hard timeout so the not-found path can never hang).
const HYDRATION_TIMEOUT_MS = 1500;

function waitForStoreHydration(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  const stores = [useItinerariesStore, useQuestionnaireStore];
  if (stores.every((s) => s.persist.hasHydrated())) return Promise.resolve();

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      unsubs.forEach((unsub) => unsub());
      resolve();
    };
    const check = () => {
      if (stores.every((s) => s.persist.hasHydrated())) finish();
    };
    const unsubs = stores.map((s) => s.persist.onFinishHydration(check));
    const timer = setTimeout(finish, HYDRATION_TIMEOUT_MS);
    check();
  });
}

export type EnrichmentStatus = 'idle' | 'loading' | 'done' | 'error';

export interface UseItineraryResult {
  itinerary: TravelItinerary | null;
  isLoading: boolean;
  error: string;
  destination: string;
  /** Background enrichment of a freshly generated plan (/api/enrich). */
  enrichment: EnrichmentStatus;
  applyItinerary: (updated: TravelItinerary) => void;
}

// Module-level dedup: prevents React Strict Mode (or any double-mount) from
// firing two simultaneous NVIDIA API calls. The free tier rate-limits
// concurrent requests, which makes the second one take 90s+ and timeout.
const inflightGenerations = new Set<string>();

// Same guard for the background enrichment call — one enrichment per trip.
const inflightEnrichments = new Set<string>();

export function useItinerary(id: string): UseItineraryResult {
  const { generatedId, data } = useQuestionnaireStore();
  const savedPlan = useItinerariesStore((s) => s.plans[id]);
  const [itinerary, setItinerary] = useState<TravelItinerary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [enrichment, setEnrichment] = useState<EnrichmentStatus>('idle');

  useEffect(() => {
    // AbortController lets us cancel the fetch if the component unmounts
    // (React Strict Mode unmounts + remounts in dev).
    const controller = new AbortController();
    let cancelled = false;

    const saveItinerary = (it: TravelItinerary, questionnaireData: QuestionnaireData, createdAt?: string) => {
      useItinerariesStore.getState().saveItinerary(id, {
        id,
        itinerary: it,
        questionnaireData,
        createdAt: createdAt || new Date().toISOString(),
      });
    };

    // Background enrichment (POST /api/enrich): upgrades the freshly generated
    // plan with hotels, restaurants, events and daily routes WITHOUT making
    // the user wait. On failure the original itinerary stays fully usable.
    const runBackgroundEnrichment = async (
      tripId: string,
      questionnaireData: QuestionnaireData,
      initial: TravelItinerary,
      createdAt: string
    ) => {
      if (inflightEnrichments.has(tripId)) return;
      inflightEnrichments.add(tripId);
      setEnrichment('loading');
      try {
        const response = await fetch('/api/enrich', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tripId,
            questionnaire: questionnaireData,
            itinerary: initial,
          }),
          signal: controller.signal,
        });
        if (cancelled) return;
        if (!response.ok) {
          setEnrichment('error');
          return;
        }
        const result = (await response.json()) as { itinerary: TravelItinerary };
        if (cancelled) return;
        setItinerary(result.itinerary);
        saveItinerary(result.itinerary, questionnaireData, createdAt);
        setEnrichment('done');
      } catch (err: unknown) {
        if (cancelled || (err instanceof DOMException && err.name === 'AbortError')) return;
        logEnrichmentFailure(err);
        setEnrichment('error');
      } finally {
        inflightEnrichments.delete(tripId);
      }
    };

    const loadItinerary = async () => {
      // Wait for persisted stores to hydrate before deciding anything.
      await waitForStoreHydration();

      if (cancelled) return;

      // Generation is consumed here now — clear the flag so the questionnaire's
      // "Generate" button isn't stuck on "Preparing..." if the user returns.
      if (id === generatedId) {
        useQuestionnaireStore.getState().setGenerating(false);
      }

      // 1. Saved plan (fresh visits, refreshes, deep links)
      const saved = useItinerariesStore.getState().getPlan(id);
      if (saved?.itinerary) {
        setItinerary(saved.itinerary);
        setIsLoading(false);
        return;
      }

      // 2. Just-generated plan → call API and persist the result
      if (id === generatedId && data.tripDetails.destination) {
        // Dedup guard: skip if another mount already started generation for this ID
        if (inflightGenerations.has(id)) {
          return;
        }
        inflightGenerations.add(id);

        try {
          const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            signal: controller.signal,
          });

          if (cancelled) return;

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server error: ${response.status}`);
          }

          const result = (await response.json()) as GenerateItineraryResponse;
          if (cancelled) return;

          setItinerary(result.itinerary);
          saveItinerary(result.itinerary, data, result.createdAt);
          void recordTripEvent(id, 'generated').catch(() => {});
          void runBackgroundEnrichment(id, data, result.itinerary, result.createdAt);
        } catch (err: unknown) {
          if (cancelled || (err instanceof DOMException && err.name === 'AbortError')) return;
          console.error(err);
          const message =
            err instanceof DOMException && err.name === 'TimeoutError'
              ? 'The server took too long to respond. Please try again.'
              : err instanceof Error
                ? err.message
                : 'An unexpected error occurred.';
          setLoadError(message);
        } finally {
          inflightGenerations.delete(id);
          if (!cancelled) setIsLoading(false);
        }
        return;
      }

      // 3. Fallback → server (returns 404 for unknown ids)
      try {
        const response = await fetch(`/api/itineraries/${id}`, {
          signal: controller.signal,
        });
        if (cancelled) return;
        if (response.ok) {
          const result = (await response.json()) as ServerItineraryResponse;
          setItinerary(result.itinerary);
          saveItinerary(result.itinerary, data, result.createdAt);
          setIsLoading(false);
          return;
        }
      } catch {
        if (cancelled) return;
        // DB fetch failed
      }

      setLoadError(NOT_FOUND_MESSAGE);
      setIsLoading(false);
    };

    loadItinerary();

    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Derived: the saved plan was deleted from storage while it was being viewed
  const planWasDeleted = itinerary !== null && !isLoading && id !== generatedId && !savedPlan;
  const error = loadError || (planWasDeleted ? NOT_FOUND_MESSAGE : '');

  // Apply a (possibly AI-edited) itinerary: update UI state and persist it so
  // refreshes and deep links keep showing the latest version.
  const applyItinerary = (updated: TravelItinerary) => {
    setItinerary(updated);
    useItinerariesStore.getState().saveItinerary(id, {
      id,
      itinerary: updated,
      questionnaireData: data,
      createdAt: savedPlan?.createdAt || new Date().toISOString(),
    });
    void recordTripEvent(id, 'edited').catch(() => {});
  };

  return { itinerary, isLoading, error, destination: data.tripDetails.destination, enrichment, applyItinerary };
}