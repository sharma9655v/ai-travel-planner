import { NextRequest, NextResponse } from 'next/server';
import type { WeatherResponse } from '@/types/itinerary';
import type { ApiError } from '@/types/api';
import { clientIp, createSlidingWindowLimiter } from '@/lib/rateLimit';
import {
  fetchWeatherForecast,
  MAX_FORECAST_DAYS,
  WeatherServiceError,
} from '@/lib/weather/service';

export const maxDuration = 30;

// Weather is free (no API key) but still costs bandwidth — cap at
// 30 forecast requests per IP per minute.
const isLimited = createSlidingWindowLimiter(30, 60 * 1000);

// Live weather via Open-Meteo (free, no API key). Maps WMO codes to the app's
// existing WeatherDay vocabulary and derives travel advice + alerts server-side.
export async function GET(request: NextRequest) {
  try {
    if (isLimited(clientIp(request))) {
      return NextResponse.json<ApiError>(
        { error: 'Too many requests. Please try again in a minute.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const lat = Number(searchParams.get('lat'));
    const lon = Number(searchParams.get('lon'));
    const requestedDays = Number(searchParams.get('days')) || 7;
    const days = Math.min(Math.max(Math.round(requestedDays), 1), MAX_FORECAST_DAYS);

    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      return NextResponse.json<ApiError>(
        { error: 'Valid latitude and longitude are required.' },
        { status: 400 }
      );
    }

    const weather = await fetchWeatherForecast(lat, lon, days);

    // Forecasts update every ~15 min — let the browser reuse a cached response
    // for 10 min so repeat visits don't re-hit the rate-limited proxy.
    return NextResponse.json<WeatherResponse>(
      {
        ...weather,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=600, stale-while-revalidate=3600',
        },
      }
    );
  } catch (error) {
    if (error instanceof WeatherServiceError) {
      return NextResponse.json<ApiError>({ error: error.message }, { status: 502 });
    }
    console.error('Weather API error:', error);
    return NextResponse.json<ApiError>(
      { error: "Couldn't load the weather forecast." },
      { status: 500 }
    );
  }
}
