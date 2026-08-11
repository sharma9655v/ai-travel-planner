import type { WeatherResponse } from '@/types/itinerary';
import {
  buildCurrentWeather,
  buildForecastDays,
  deriveAlerts,
  type OpenMeteoCurrent,
  type OpenMeteoDaily,
} from './map';
import { CACHE_TTL, getOrCompute } from '@/lib/cache';

const OPEN_METEO_URL = process.env.OPEN_METEO_URL ?? 'https://api.open-meteo.com/v1/forecast';
export const MAX_FORECAST_DAYS = 16;

interface WeatherServiceOptions {
  timeoutMs?: number;
}

export class WeatherServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WeatherServiceError';
  }
}

// Shared by the public weather endpoint and the generation pipeline so the
// server never needs to issue an HTTP request back to its own API route.
export async function fetchWeatherForecast(
  latitude: number,
  longitude: number,
  requestedDays: number,
  { timeoutMs = 7_000 }: WeatherServiceOptions = {}
): Promise<WeatherResponse> {
  const days = Math.min(Math.max(Math.round(requestedDays), 1), MAX_FORECAST_DAYS);

  // Forecasts only refresh every ~15 min upstream — an identical fetch within
  // that window is served from cache (short TTL, see CACHE_TTL.weather).
  const result = await getOrCompute<WeatherResponse>(
    'weather',
    [latitude.toFixed(4), longitude.toFixed(4), days],
    CACHE_TTL.weather,
    () => fetchWeatherFromUpstream(latitude, longitude, days, timeoutMs)
  );
  if (result === null) {
    throw new WeatherServiceError('Weather service is unavailable right now.');
  }
  return result;
}

async function fetchWeatherFromUpstream(
  latitude: number,
  longitude: number,
  days: number,
  timeoutMs: number
): Promise<WeatherResponse | null> {
  const url = new URL(OPEN_METEO_URL);
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', String(days));
  url.searchParams.set('wind_speed_unit', 'ms');
  url.searchParams.set(
    'current',
    'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m,precipitation,is_day'
  );
  url.searchParams.set(
    'daily',
    'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,relative_humidity_2m_max'
  );

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
    if (!response.ok) {
      throw new WeatherServiceError('Weather service is unavailable right now.');
    }

    const json = (await response.json()) as {
      current?: OpenMeteoCurrent;
      daily?: OpenMeteoDaily;
    };

    if (!json.current || !json.daily?.time?.length) {
      throw new WeatherServiceError('The weather service returned no forecast.');
    }

    return {
      current: buildCurrentWeather(json.current),
      forecast: buildForecastDays(json.daily),
      alerts: deriveAlerts(json.daily),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof WeatherServiceError) throw error;
    if (controller.signal.aborted) {
      throw new WeatherServiceError('Weather service timed out.');
    }
    throw new WeatherServiceError('Weather service is unavailable right now.');
  } finally {
    clearTimeout(timer);
  }
}