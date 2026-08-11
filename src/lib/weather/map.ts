// ============================================================
// Open-Meteo mapping — pure functions, no fetch, no React.
// Maps WMO weather codes to the app's existing weather
// vocabulary and derives travel advice + alerts from data.
// ============================================================

import type { CurrentWeather, WeatherAlert, WeatherDay } from '@/types/itinerary';

export interface OpenMeteoDaily {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_probability_max: (number | null)[];
  wind_speed_10m_max: number[];
  relative_humidity_2m_max: number[];
}

export interface OpenMeteoCurrent {
  temperature_2m: number;
  apparent_temperature: number;
  weather_code: number;
  wind_speed_10m: number;
  relative_humidity_2m: number;
  precipitation: number;
  is_day: boolean;
}

export interface WmoCondition {
  condition: string;
  icon: string;
  severe: boolean;
}

export function mapWmoCode(code: number, isDay = true): WmoCondition {
  const suffix = isDay ? 'd' : 'n';
  if (code === 0 || code === 1) return { condition: 'Clear', icon: `01${suffix}`, severe: false };
  if (code === 2) return { condition: 'Clouds', icon: `03${suffix}`, severe: false };
  if (code === 3) return { condition: 'Clouds', icon: `04${suffix}`, severe: false };
  if (code === 45 || code === 48) return { condition: 'Fog', icon: `50${suffix}`, severe: false };
  if (code >= 51 && code <= 57) return { condition: 'Drizzle', icon: `09${suffix}`, severe: false };
  if (code >= 61 && code <= 67) return { condition: 'Rain', icon: `10${suffix}`, severe: false };
  if (code >= 71 && code <= 77) return { condition: 'Snow', icon: `13${suffix}`, severe: false };
  if (code >= 80 && code <= 82) return { condition: 'Rain', icon: `09${suffix}`, severe: false };
  if (code >= 85 && code <= 86) return { condition: 'Snow', icon: `13${suffix}`, severe: false };
  if (code >= 95) return { condition: 'Thunderstorm', icon: `11${suffix}`, severe: true };
  return { condition: 'Clouds', icon: `03${suffix}`, severe: false };
}

function travelAdvice(
  condition: string,
  severe: boolean,
  tempMax: number,
  tempMin: number,
  rainProbability: number,
  windMs: number
): string {
  if (severe) return 'Severe weather expected — keep an eye on the sky and plan indoor shelter options.';
  if (rainProbability >= 60 && (condition === 'Rain' || condition === 'Drizzle'))
    return 'High rain chance — pack a light raincoat and line up indoor backup plans.';
  if (tempMax >= 35) return 'Very hot day — stay hydrated, use sunscreen, and plan midday indoors.';
  if (tempMin <= 0) return 'Freezing temperatures — wear warm layers and protect hands and face.';
  if (windMs >= 10.8) return 'Windy — avoid exposed viewpoints and secure loose items.';
  if (rainProbability >= 40) return 'Some rain possible — a compact umbrella is a good call.';
  return 'Great conditions for sightseeing — enjoy the day.';
}

function buildAlerts(
  daily: OpenMeteoDaily
): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const maxTemp = daily.temperature_2m_max.length
    ? Math.max(...daily.temperature_2m_max)
    : -Infinity;
  const minTemp = daily.temperature_2m_min.length
    ? Math.min(...daily.temperature_2m_min)
    : Infinity;
  const maxRainProb = daily.precipitation_probability_max.length
    ? Math.max(...daily.precipitation_probability_max.map((p) => p ?? 0))
    : 0;
  const maxWindMs = daily.wind_speed_10m_max.length
    ? Math.max(...daily.wind_speed_10m_max)
    : 0;
  const hasThunder = daily.weather_code.some((c) => c >= 95);

  if (hasThunder)
    alerts.push({
      level: 'warning',
      title: 'Thunderstorms expected',
      detail: 'Thunderstorm cells are in the forecast — plan indoor shelter for exposed activities.',
    });
  if (maxRainProb >= 80)
    alerts.push({
      level: 'warning',
      title: 'Heavy rain likely',
      detail: `Rain probability peaks at ${Math.round(maxRainProb)}% — flexible indoor plans are recommended.`,
    });
  if (maxTemp >= 40)
    alerts.push({
      level: 'warning',
      title: 'Extreme heat',
      detail: `Temperatures may reach ${Math.round(maxTemp)}°C — avoid midday sun and stay hydrated.`,
    });
  else if (maxTemp >= 35)
    alerts.push({
      level: 'advisory',
      title: 'Heat advisory',
      detail: `Temperatures up to ${Math.round(maxTemp)}°C — plan hydration and indoor breaks.`,
    });
  if (minTemp <= -10)
    alerts.push({
      level: 'warning',
      title: 'Extreme cold',
      detail: `Lows near ${Math.round(minTemp)}°C — heavy winter gear required.`,
    });
  else if (minTemp <= 0)
    alerts.push({
      level: 'advisory',
      title: 'Cold spell',
      detail: `Night-time lows around ${Math.round(minTemp)}°C — pack warm layers.`,
    });
  if (maxWindMs >= 16.7)
    alerts.push({
      level: 'warning',
      title: 'Strong winds',
      detail: `Wind gusts up to ${Math.round(maxWindMs * 3.6)} km/h — exposed routes may be affected.`,
    });

  return alerts.slice(0, 4);
}

export function buildForecastDays(daily: OpenMeteoDaily): WeatherDay[] {
  return daily.time.map((date, i) => {
    const { condition, icon, severe } = mapWmoCode(daily.weather_code[i] ?? 0);
    const tempMax = daily.temperature_2m_max[i] ?? 0;
    const tempMin = daily.temperature_2m_min[i] ?? 0;
    const rainProbability = daily.precipitation_probability_max[i] ?? 0;
    const windMs = daily.wind_speed_10m_max[i] ?? 0;
    const humidity = daily.relative_humidity_2m_max[i] ?? 0;

    return {
      date,
      tempHigh: Math.round(tempMax),
      tempLow: Math.round(tempMin),
      condition,
      icon,
      humidity: Math.round(humidity),
      windSpeed: Math.round(windMs),
      precipitationProbability: Math.round(rainProbability),
      recommendation: travelAdvice(condition, severe, tempMax, tempMin, rainProbability, windMs),
    };
  });
}

export function buildCurrentWeather(current: OpenMeteoCurrent): CurrentWeather {
  const { condition, icon } = mapWmoCode(current.weather_code, current.is_day);
  return {
    temperature: Math.round(current.temperature_2m),
    apparentTemperature: Math.round(current.apparent_temperature),
    condition,
    icon,
    windSpeed: Math.round(current.wind_speed_10m),
    humidity: Math.round(current.relative_humidity_2m),
    precipitation: Math.round(current.precipitation),
    isDay: current.is_day,
  };
}

export function deriveAlerts(daily: OpenMeteoDaily): WeatherAlert[] {
  return buildAlerts(daily);
}
