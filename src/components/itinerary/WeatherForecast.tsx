'use client';

import { motion } from 'framer-motion';
import { Droplets, Wind, Umbrella, AlertTriangle, Sun } from 'lucide-react';
import type { CurrentWeather, WeatherAlert, WeatherDay } from '@/types/itinerary';

const weatherIcons: Record<string, string> = {
  Clear: '☀️',
  Clouds: '☁️',
  Rain: '🌧️',
  Snow: '❄️',
  Thunderstorm: '⛈️',
  Drizzle: '🌦️',
  Mist: '🌫️',
  Fog: '🌫️',
};

export default function WeatherForecast({
  forecast,
  current,
  alerts = [],
}: {
  forecast: WeatherDay[];
  current?: CurrentWeather | null;
  alerts?: WeatherAlert[];
}) {
  if (!forecast || forecast.length === 0) return null;

  const alertColor = (level: WeatherAlert['level']) =>
    level === 'warning' ? '#FF6B6B' : '#FFB547';

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <div style={{ width: 4, height: 20, borderRadius: 2, background: 'linear-gradient(180deg, #70E1FF, #27F2FF)' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Weather Forecast</h2>
        <div
          style={{
            marginLeft: '0.25rem',
            padding: '0.15rem 0.5rem',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(61, 220, 132, 0.12)',
            border: '1px solid rgba(61, 220, 132, 0.3)',
            color: 'var(--color-success)',
            fontSize: '0.5625rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          <Sun size={10} /> Live · Open-Meteo
        </div>
      </div>

      {/* Weather Alerts */}
      {alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
          {alerts.map((alert, i) => {
            const color = alertColor(alert.level);
            return (
              <motion.div
                key={`${alert.title}-${i}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  background: `${color}12`,
                  border: `1px solid ${color}35`,
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <AlertTriangle size={14} color={color} style={{ marginTop: 1, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color }}>
                    {alert.level === 'warning' ? '⚠ ' : ''}
                    {alert.title}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginTop: '0.125rem' }}>
                    {alert.detail}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Current Weather */}
      {current && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card-static"
          style={{
            padding: '1.25rem',
            borderRadius: 'var(--radius-xl)',
            marginBottom: '0.75rem',
            border: '1px solid rgba(112, 225, 255, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '2.75rem' }}>{weatherIcons[current.condition] || '🌤️'}</div>
            <div style={{ flex: 1, minWidth: '140px' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1 }}>
                {current.temperature}°
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                  {' '}
                  {current.condition}
                </span>
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                Right now · feels like {current.apparentTemperature}°
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))', gap: '0.5rem', flex: '1 1 240px' }}>
              <Metric icon={<Droplets size={12} color="var(--color-primary)" />} label="Humidity" value={`${current.humidity}%`} />
              <Metric icon={<Wind size={12} color="var(--color-text-muted)" />} label="Wind" value={`${current.windSpeed} m/s`} />
              <Metric icon={<Umbrella size={12} color="#70E1FF" />} label="Rain now" value={`${current.precipitation} mm`} />
            </div>
          </div>

          <div
            style={{
              marginTop: '0.875rem',
              padding: '0.625rem 0.875rem',
              background: 'rgba(112, 225, 255, 0.07)',
              border: '1px solid rgba(112, 225, 255, 0.15)',
              borderRadius: 'var(--radius-lg)',
              fontSize: '0.6875rem',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.5,
            }}
          >
            <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Travel advice: </span>
            {forecast[0]?.recommendation ?? 'Check the forecast before heading out.'}
          </div>
        </motion.div>
      )}

      {/* Daily Forecast */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          paddingBottom: '0.25rem',
        }}
      >
        {forecast.map((day, i) => (
          <motion.div
            key={day.date}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card-static"
            style={{
              minWidth: '150px',
              padding: '1rem',
              textAlign: 'center',
              flexShrink: 0,
            }}
          >
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontWeight: 500 }}>
              {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>

            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
              {weatherIcons[day.condition] || '🌤️'}
            </div>

            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
              {day.condition}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                {day.tempHigh}°
              </span>
              <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                {day.tempLow}°
              </span>
            </div>

            {typeof day.precipitationProbability === 'number' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem',
                  marginBottom: '0.5rem',
                }}
              >
                <Umbrella size={9} color="#70E1FF" />
                <span style={{ fontSize: '0.625rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  {day.precipitationProbability}% rain
                </span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.125rem' }}>
                <Droplets size={8} color="var(--color-primary-light)" />
                <span style={{ fontSize: '0.5625rem', color: 'var(--color-text-muted)' }}>{day.humidity}%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.125rem' }}>
                <Wind size={8} color="var(--color-text-muted)" />
                <span style={{ fontSize: '0.5625rem', color: 'var(--color-text-muted)' }}>{day.windSpeed} m/s</span>
              </div>
            </div>

            <div
              style={{
                fontSize: '0.5625rem',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {day.recommendation}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.625rem 0.75rem',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      {icon}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.5625rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </div>
        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{value}</div>
      </div>
    </div>
  );
}
