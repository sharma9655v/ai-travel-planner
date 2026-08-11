// ============================================================
// Weather API Response Types
// ============================================================

export interface WeatherResponse {
  city: string;
  country: string;
  current: CurrentWeather;
  forecast: ForecastDay[];
}

export interface CurrentWeather {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  icon: string;
  description: string;
}

export interface ForecastDay {
  date: string;
  tempHigh: number;
  tempLow: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  pop: number; // probability of precipitation
}
