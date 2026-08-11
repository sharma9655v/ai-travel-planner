import { describe, expect, it } from 'vitest';
import {
  buildCurrentWeather,
  buildForecastDays,
  deriveAlerts,
  mapWmoCode,
  type OpenMeteoCurrent,
  type OpenMeteoDaily,
} from '@/lib/weather/map';

describe('mapWmoCode', () => {
  it('maps clear and cloudy codes', () => {
    expect(mapWmoCode(0)).toEqual({ condition: 'Clear', icon: '01d', severe: false });
    expect(mapWmoCode(1)).toEqual({ condition: 'Clear', icon: '01d', severe: false });
    expect(mapWmoCode(2)).toEqual({ condition: 'Clouds', icon: '03d', severe: false });
    expect(mapWmoCode(3)).toEqual({ condition: 'Clouds', icon: '04d', severe: false });
  });

  it('maps precipitation and severe codes', () => {
    expect(mapWmoCode(45)).toEqual({ condition: 'Fog', icon: '50d', severe: false });
    expect(mapWmoCode(51)).toEqual({ condition: 'Drizzle', icon: '09d', severe: false });
    expect(mapWmoCode(61)).toEqual({ condition: 'Rain', icon: '10d', severe: false });
    expect(mapWmoCode(80)).toEqual({ condition: 'Rain', icon: '09d', severe: false });
    expect(mapWmoCode(71)).toEqual({ condition: 'Snow', icon: '13d', severe: false });
    expect(mapWmoCode(95)).toEqual({ condition: 'Thunderstorm', icon: '11d', severe: true });
    expect(mapWmoCode(99)).toEqual({ condition: 'Thunderstorm', icon: '11d', severe: true });
  });

  it('uses night icons when isDay is false', () => {
    expect(mapWmoCode(0, false)).toEqual({ condition: 'Clear', icon: '01n', severe: false });
  });

  it('defaults unknown codes to Clouds', () => {
    expect(mapWmoCode(20)).toEqual({ condition: 'Clouds', icon: '03d', severe: false });
  });
});

describe('buildForecastDays', () => {
  const daily: OpenMeteoDaily = {
    time: ['2026-10-01', '2026-10-02', '2026-10-03'],
    weather_code: [0, 61, 95],
    temperature_2m_max: [24.4, 18.2, 22.7],
    temperature_2m_min: [12.3, 11.1, 10.0],
    precipitation_probability_max: [10, 70, 90],
    wind_speed_10m_max: [5, 4.2, 9.9],
    relative_humidity_2m_max: [44.4, 88.2, 91.1],
  };

  it('builds one day per date with rounded values', () => {
    const days = buildForecastDays(daily);
    expect(days).toHaveLength(3);
    expect(days[0]).toMatchObject({
      date: '2026-10-01',
      tempHigh: 24,
      tempLow: 12,
      condition: 'Clear',
      icon: '01d',
      humidity: 44,
      windSpeed: 5,
      precipitationProbability: 10,
    });
  });

  it('recommends indoor backup plans on high rain', () => {
    const days = buildForecastDays(daily);
    expect(days[1].condition).toBe('Rain');
    expect(days[1].recommendation).toContain('High rain chance');
  });

  it('flags severe weather in the recommendation', () => {
    const days = buildForecastDays(daily);
    expect(days[2].condition).toBe('Thunderstorm');
    expect(days[2].recommendation).toContain('Severe weather expected');
  });
});

describe('buildCurrentWeather', () => {
  it('maps and rounds the current conditions', () => {
    const current: OpenMeteoCurrent = {
      temperature_2m: 23.6,
      apparent_temperature: 22.1,
      weather_code: 2,
      wind_speed_10m: 6.2,
      relative_humidity_2m: 55.5,
      precipitation: 0.4,
      is_day: true,
    };
    expect(buildCurrentWeather(current)).toEqual({
      temperature: 24,
      apparentTemperature: 22,
      condition: 'Clouds',
      icon: '03d',
      windSpeed: 6,
      humidity: 56,
      precipitation: 0,
      isDay: true,
    });
  });
});

describe('deriveAlerts', () => {
  const base: OpenMeteoDaily = {
    time: ['2026-10-01'],
    weather_code: [0],
    temperature_2m_max: [25],
    temperature_2m_min: [15],
    precipitation_probability_max: [20],
    wind_speed_10m_max: [5],
    relative_humidity_2m_max: [50],
  };

  it('returns no alerts for calm weather', () => {
    expect(deriveAlerts(base)).toEqual([]);
  });

  it('warns about thunderstorms', () => {
    const alerts = deriveAlerts({ ...base, weather_code: [95] });
    expect(
      alerts.some((a) => a.level === 'warning' && a.title === 'Thunderstorms expected')
    ).toBe(true);
  });

  it('warns on heavy rain and extreme heat', () => {
    const alerts = deriveAlerts({
      ...base,
      precipitation_probability_max: [90],
      temperature_2m_max: [41],
    });
    const titles = alerts.map((a) => a.title);
    expect(titles).toContain('Heavy rain likely');
    expect(titles).toContain('Extreme heat');
  });

  it('issues advisories (not warnings) for moderate heat and cold', () => {
    const alerts = deriveAlerts({
      ...base,
      temperature_2m_max: [36],
      temperature_2m_min: [-5],
    });
    expect(alerts.some((a) => a.level === 'advisory' && a.title === 'Heat advisory')).toBe(true);
    expect(alerts.some((a) => a.level === 'advisory' && a.title === 'Cold spell')).toBe(true);
    expect(alerts.some((a) => a.level === 'warning' && a.title === 'Extreme heat')).toBe(false);
  });

  it('caps the alert list at 4 entries', () => {
    const alerts = deriveAlerts({
      ...base,
      weather_code: [95],
      precipitation_probability_max: [95],
      temperature_2m_max: [45],
      temperature_2m_min: [-15],
      wind_speed_10m_max: [30],
    });
    expect(alerts.length).toBeLessThanOrEqual(4);
  });
});
