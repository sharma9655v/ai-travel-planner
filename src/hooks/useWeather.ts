'use client';

import { useEffect, useState } from 'react';
import type { CurrentWeather, WeatherAlert, WeatherDay, WeatherResponse } from '@/types/itinerary';
import type { ApiError } from '@/types/api';

export interface WeatherCoords {
  latitude: number;
  longitude: number;
}

export interface UseWeatherResult {
  current: CurrentWeather | null;
  forecast: WeatherDay[];
  alerts: WeatherAlert[];
  isLoading: boolean;
  error: string;
}

const MAX_FORECAST_DAYS = 16;

interface WeatherState {
  current: CurrentWeather | null;
  forecast: WeatherDay[];
  alerts: WeatherAlert[];
  error: string;
  loadedKey: string | null;
}

const EMPTY_STATE: WeatherState = {
  current: null,
  forecast: [],
  alerts: [],
  error: '',
  loadedKey: null,
};

function keyFor(coords: WeatherCoords, days: number): string {
  return `${coords.latitude.toFixed(4)}|${coords.longitude.toFixed(4)}|${days}`;
}

// Live forecast for a trip's coordinates. No coordinates → no weather
// (honest: we never fabricate a forecast).
export function useWeather(coords: WeatherCoords | null, days: number): UseWeatherResult {
  const [state, setState] = useState<WeatherState>(EMPTY_STATE);
  const clampedDays = coords ? Math.min(Math.max(Math.round(days), 1), MAX_FORECAST_DAYS) : 1;
  const key = coords ? keyFor(coords, clampedDays) : null;

  useEffect(() => {
    if (!coords || !key) return;
    const controller = new AbortController();

    fetch(`/api/weather?lat=${coords.latitude}&lon=${coords.longitude}&days=${clampedDays}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as ApiError | null;
          throw new Error(data?.error || 'Weather unavailable right now.');
        }
        return (await response.json()) as WeatherResponse;
      })
      .then((data) => {
        if (controller.signal.aborted) return;
        setState({
          current: data.current,
          forecast: data.forecast,
          alerts: data.alerts,
          error: '',
          loadedKey: key,
        });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Weather unavailable right now.',
        }));
      });

    return () => controller.abort();
    // Deps are stable primitives (key encodes lat|lon|days). Depending on the
    // `coords` object identity here would refetch on every render — e.g. when
    // the caller builds coords inline — causing an endless request loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, clampedDays]);

  // Coordinates disappeared → reset (adjust state during render, per React docs).
  if (!coords && state.loadedKey !== null) {
    setState(EMPTY_STATE);
  }

  const isLoading = coords !== null && state.loadedKey !== key && state.error === '';

  return {
    current: state.current,
    forecast: state.forecast,
    alerts: state.alerts,
    isLoading,
    error: state.error,
  };
}
