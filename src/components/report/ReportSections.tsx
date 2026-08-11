import {
  AlertTriangle,
  Bus,
  Car,
  Droplets,
  Footprints,
  Info,
  MapPin,
  Navigation,
  Plane,
  Ship,
  Sparkles,
  TrainFront,
  Umbrella,
  Wind,
} from 'lucide-react';
import type {
  ActivityCategory,
  CurrentWeather,
  EmergencyContact,
  TravelItinerary,
  WeatherAlert,
  WeatherDay,
} from '@/types/itinerary';
import type { NormalizedBudget } from '@/lib/budget/normalize';
import { formatCurrency, formatDate } from '@/lib/utils';
import ReportSection from './ReportSection';

const CATEGORY_COLORS: Record<ActivityCategory, string> = {
  sightseeing: '#27F2FF',
  food: '#FFB547',
  transport: '#8B8B9E',
  accommodation: '#5CFFD4',
  adventure: '#FF6B6B',
  shopping: '#FF9F5A',
  relaxation: '#3DDC84',
  culture: '#B16DFF',
  nightlife: '#FF5CE1',
  wellness: '#7CF5C8',
};

function weatherEmoji(icon: string): string {
  const map: Record<string, string> = {
    Clear: '☀️',
    Clouds: '⛅',
    Rain: '🌧️',
    Snow: '❄️',
    Thunderstorm: '⛈️',
    Drizzle: '🌦️',
    Fog: '🌫️',
  };
  return map[icon] ?? '🌤️';
}

function transportIcon(mode: string) {
  const m = mode.toLowerCase();
  if (m.includes('flight') || m.includes('plane') || m.includes('air')) return Plane;
  if (m.includes('train') || m.includes('rail') || m.includes('metro') || m.includes('subway')) return TrainFront;
  if (m.includes('bus')) return Bus;
  if (m.includes('ferry') || m.includes('boat') || m.includes('ship')) return Ship;
  if (m.includes('walk') || m.includes('foot')) return Footprints;
  if (m.includes('car') || m.includes('drive') || m.includes('taxi') || m.includes('uber')) return Car;
  return Navigation;
}

interface ReportSectionsProps {
  itinerary: TravelItinerary;
  forecast: WeatherDay[];
  currentWeather: CurrentWeather | null;
  weatherAlerts: WeatherAlert[];
  budget: NormalizedBudget;
}

export default function ReportSections({
  itinerary,
  forecast,
  currentWeather,
  weatherAlerts,
  budget,
}: ReportSectionsProps) {
  const { tripSummary, dailyItinerary } = itinerary;
  const activityCount = dailyItinerary.reduce((sum, day) => sum + (day.activities?.length ?? 0), 0);

  return (
    <div>
      {/* 01 — Executive Summary */}
      <ReportSection number="01" title="Executive Summary" kicker="Your trip at a glance">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '0.625rem',
            marginBottom: '1.25rem',
          }}
        >
          {[
            { label: 'Days', value: tripSummary.totalDays },
            { label: 'Activities', value: activityCount },
            { label: 'Stays', value: itinerary.accommodations.length },
            { label: 'Restaurants', value: itinerary.restaurants.length },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                padding: '0.9rem 0.5rem',
                textAlign: 'center',
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div style={{ fontSize: '1.375rem', fontWeight: 900, color: 'var(--color-primary)' }}>{stat.value}</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            padding: '1rem 1.125rem',
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(61, 220, 132, 0.07)',
            border: '1px solid rgba(61, 220, 132, 0.25)',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-success)', marginBottom: '0.35rem' }}>
            Estimated Budget
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-text-primary)' }}>
            {formatCurrency(budget.total.low, budget.currency)} – {formatCurrency(budget.total.high, budget.currency)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            ≈ {formatCurrency(budget.daily.low, budget.currency)} – {formatCurrency(budget.daily.high, budget.currency)} per day · estimated range, final costs vary with your choices
          </div>
        </div>

        {forecast.length > 0 && (
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--color-text-primary)' }}>Weather outlook: </strong>
            {weatherEmoji(forecast[0].icon)} {forecast[0].condition} on {formatDate(forecast[0].date)} — high {forecast[0].tempHigh}°C, low {forecast[0].tempLow}°C
            {forecast[0].precipitationProbability !== undefined && forecast[0].precipitationProbability > 25 ? `, ${forecast[0].precipitationProbability}% chance of rain` : ''}.
          </div>
        )}

        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
          {tripSummary.coverDescription}
        </div>
      </ReportSection>

      {/* 02 — Destination Overview */}
      <ReportSection number="02" title="Destination Overview" kicker={tripSummary.destination}>
        <div style={{ display: 'grid', gap: '1rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
          <div>
            <strong style={{ color: 'var(--color-text-primary)' }}>Travel style: </strong>
            {tripSummary.travelStyle}
          </div>
          {tripSummary.bestTimeToVisit && (
            <div>
              <strong style={{ color: 'var(--color-text-primary)' }}>Best time to visit: </strong>
              {tripSummary.bestTimeToVisit}
            </div>
          )}
          <div>
            <strong style={{ color: 'var(--color-text-primary)' }}>Trip highlights: </strong>
            <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.1rem' }}>
              {(tripSummary.highlights ?? []).map((highlight, i) => (
                <li key={i} style={{ marginBottom: '0.3rem' }}>{highlight}</li>
              ))}
            </ul>
          </div>
        </div>
      </ReportSection>

      {/* 03 — Daily Itinerary */}
      <ReportSection number="03" title="Daily Itinerary" kicker="Day-by-day plan" flow>
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {dailyItinerary.map((day) => (
            <article key={day.day} className="report-flow">
              <header style={{ marginBottom: '0.75rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                  Day {day.day} — {day.title}
                </h3>
                <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                  {formatDate(day.date)}
                </div>
              </header>

              {day.summary && (
                <p style={{ margin: '0 0 0.75rem', fontSize: '0.8125rem', lineHeight: 1.65, color: 'var(--color-text-secondary)' }}>
                  {day.summary}
                </p>
              )}

              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {(day.activities ?? []).map((activity, i) => (
                  <div
                    key={`${day.day}-${i}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '72px 1fr',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-lg)',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      breakInside: 'avoid',
                    }}
                  >
                    <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-muted)', paddingTop: '0.1rem' }}>
                      {activity.time}
                      {activity.endTime ? `–${activity.endTime}` : ''}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{activity.name}</span>
                        <span
                          style={{
                            padding: '0.1rem 0.45rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.5625rem',
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            color: CATEGORY_COLORS[activity.category] ?? 'var(--color-text-muted)',
                            border: `1px solid ${(CATEGORY_COLORS[activity.category] ?? '#8B8B9E')}55`,
                          }}
                        >
                          {activity.category}
                        </span>
                      </div>
                      {activity.description && (
                        <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
                          {activity.description}
                        </p>
                      )}
                      <div style={{ marginTop: '0.35rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                        {activity.location && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={11} /> {activity.location}</span>}
                        {activity.duration && <span>⏱ {activity.duration}</span>}
                      </div>
                      {activity.tips && (
                        <div style={{ marginTop: '0.35rem', fontSize: '0.6875rem', color: 'var(--color-warning, #FFB547)' }}>
                          Tip: {activity.tips}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </ReportSection>

      {/* 04 — Route Summary */}
      <ReportSection number="04" title="Route Summary" kicker="Getting around">
        {itinerary.transportationDetails.length === 0 ? (
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
            No transport legs were planned for this trip.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '0.625rem' }}>
            {itinerary.transportationDetails.map((leg, i) => {
              const Icon = transportIcon(leg.mode);
              return (
                <div
                  key={i}
                  className="report-table"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1.2fr',
                    gap: '0.75rem',
                    alignItems: 'center',
                    padding: '0.75rem 0.875rem',
                    borderRadius: 'var(--radius-lg)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {leg.from} → {leg.to}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: 'var(--color-text-secondary)',
                      padding: '0.2rem 0.55rem',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <Icon size={12} color="var(--color-primary)" /> {leg.mode}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)', textAlign: 'right' }}>
                    {leg.duration}
                    {leg.notes && <div style={{ color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>{leg.notes}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ReportSection>

      {/* 05 — Weather */}
      <ReportSection number="05" title="Weather" kicker="Live forecast">
        {forecast.length === 0 ? (
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
            No live weather data available for this destination.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {currentWeather && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  padding: '1rem 1.125rem',
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(39, 242, 255, 0.06)',
                  border: '1px solid rgba(39, 242, 255, 0.22)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                    Now
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-text-primary)' }}>
                    {weatherEmoji(currentWeather.icon)} {Math.round(currentWeather.temperature)}°C
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{currentWeather.condition}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.875rem', fontSize: '0.6875rem', color: 'var(--color-text-secondary)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Droplets size={12} /> {currentWeather.humidity}% humidity
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Wind size={12} /> {Math.round(currentWeather.windSpeed)} km/h
                  </span>
                  {currentWeather.apparentTemperature !== undefined && (
                    <span>Feels like {Math.round(currentWeather.apparentTemperature)}°C</span>
                  )}
                </div>
              </div>
            )}

            {weatherAlerts.length > 0 && (
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {weatherAlerts.map((alert, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: '0.6rem',
                      alignItems: 'flex-start',
                      padding: '0.7rem 0.875rem',
                      borderRadius: 'var(--radius-lg)',
                      border: `1px solid ${alert.level === 'warning' ? 'rgba(255, 107, 107, 0.35)' : 'rgba(255, 181, 71, 0.35)'}`,
                      background: alert.level === 'warning' ? 'rgba(255, 107, 107, 0.07)' : 'rgba(255, 181, 71, 0.07)',
                    }}
                  >
                    <AlertTriangle size={15} color={alert.level === 'warning' ? '#FF6B6B' : '#FFB547'} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                      <strong style={{ color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>{alert.title}.</strong> {alert.detail}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.625rem' }}>
              {forecast.map((day) => (
                <div
                  key={day.date}
                  className="report-avoid"
                  style={{
                    padding: '0.875rem',
                    borderRadius: 'var(--radius-lg)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{formatDate(day.date)}</div>
                  <div style={{ fontSize: '1.25rem', margin: '0.35rem 0 0.2rem' }}>{weatherEmoji(day.icon)}</div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{day.condition}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    {Math.round(day.tempLow)}°–{Math.round(day.tempHigh)}°C
                  </div>
                  <div style={{ marginTop: '0.35rem', display: 'grid', gap: '0.15rem', fontSize: '0.625rem', color: 'var(--color-text-muted)' }}>
                    {day.precipitationProbability !== undefined && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Umbrella size={10} /> {day.precipitationProbability}% rain
                      </span>
                    )}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Wind size={10} /> {Math.round(day.windSpeed)} km/h
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Droplets size={10} /> {day.humidity}% humidity
                    </span>
                  </div>
                  {day.recommendation && (
                    <div style={{ marginTop: '0.4rem', fontSize: '0.625rem', lineHeight: 1.5, color: 'var(--color-warning, #FFB547)' }}>
                      {day.recommendation}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)' }}>
              Live forecast by Open-Meteo — refreshed when this report is opened.
            </div>
          </div>
        )}
      </ReportSection>

      {/* 06 — Packing Checklist */}
      <ReportSection number="06" title="Packing Checklist" kicker="What to bring">
        {itinerary.packingChecklist.length === 0 ? (
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
            No packing list was generated for this trip.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            {itinerary.packingChecklist.map((group, gi) => (
              <div key={gi} className="report-flow">
                <h3 style={{ margin: '0 0 0.6rem', fontSize: '0.8125rem', fontWeight: 800, color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>
                  {group.category}
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                  {(group.items ?? []).map((item, ii) => (
                    <span
                      key={ii}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.4rem 0.75rem',
                        borderRadius: 'var(--radius-full)',
                        background: item.essential ? 'rgba(255, 181, 71, 0.09)' : 'rgba(255, 255, 255, 0.04)',
                        border: `1px solid ${item.essential ? 'rgba(255, 181, 71, 0.3)' : 'rgba(255, 255, 255, 0.07)'}`,
                        fontSize: '0.75rem',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {item.essential && <span style={{ color: '#FFB547', fontSize: '0.625rem' }}>★</span>}
                      {item.item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)' }}>
              ★ = essential item.
            </div>
          </div>
        )}
      </ReportSection>

      {/* 07 — Travel Tips */}
      <ReportSection number="07" title="Travel Tips" kicker="Local know-how">
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {itinerary.travelTips.length > 0 && (
            <div>
              <h3 style={{ margin: '0 0 0.6rem', fontSize: '0.8125rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>Practical tips</h3>
              <ol style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
                {itinerary.travelTips.map((tip, i) => (
                  <li key={i} style={{ marginBottom: '0.3rem' }}>{tip}</li>
                ))}
              </ol>
            </div>
          )}
          {itinerary.localCustoms.length > 0 && (
            <div>
              <h3 style={{ margin: '0 0 0.6rem', fontSize: '0.8125rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>Local customs & etiquette</h3>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
                {itinerary.localCustoms.map((custom, i) => (
                  <li key={i} style={{ marginBottom: '0.3rem' }}>{custom}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </ReportSection>

      {/* 08 — AI Recommendations */}
      <ReportSection number="08" title="AI Recommendations" kicker="Curated for you">
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {itinerary.hiddenGems.length > 0 && (
            <div className="report-flow">
              <h3 style={{ margin: '0 0 0.6rem', fontSize: '0.8125rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                Hidden gems & off-the-beaten-path picks
              </h3>
              <div style={{ display: 'grid', gap: '0.625rem' }}>
                {itinerary.hiddenGems.map((gem, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '0.875rem',
                      borderRadius: 'var(--radius-lg)',
                      background: 'rgba(177, 109, 255, 0.05)',
                      border: '1px solid rgba(177, 109, 255, 0.18)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{gem.name}</span>
                      {gem.category && (
                        <span style={{ padding: '0.1rem 0.45rem', borderRadius: 'var(--radius-full)', fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#B16DFF', border: '1px solid rgba(177, 109, 255, 0.4)' }}>
                          {gem.category}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>{gem.description}</p>
                    <div style={{ marginTop: '0.35rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                      {gem.location && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <MapPin size={11} /> {gem.location}
                        </span>
                      )}
                      {gem.tip && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#B16DFF' }}>
                          <Sparkles size={11} /> {gem.tip}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {itinerary.importantNotes.length > 0 && (
            <div className="report-flow">
              <h3 style={{ margin: '0 0 0.6rem', fontSize: '0.8125rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                Know before you go
              </h3>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
                {itinerary.importantNotes.map((note, i) => (
                  <li key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <Info size={13} style={{ flexShrink: 0, marginTop: '0.22rem', color: 'var(--color-primary)' }} />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </ReportSection>

      {/* 09 — Emergency Information */}
      <ReportSection number="09" title="Emergency Information" kicker="Stay safe">
        {itinerary.emergencyContacts.length === 0 ? (
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
            No emergency contacts were provided for this destination.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '0.625rem' }}>
            {itinerary.emergencyContacts.map((contact: EmergencyContact, i) => (
              <div
                key={i}
                className="report-table"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '0.75rem',
                  alignItems: 'center',
                  padding: '0.75rem 0.875rem',
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(255, 107, 107, 0.05)',
                  border: '1px solid rgba(255, 107, 107, 0.16)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{contact.service}</div>
                  {contact.notes && <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>{contact.notes}</div>}
                </div>
                <span
                  style={{
                    fontSize: '0.9375rem',
                    fontWeight: 900,
                    color: '#FF6B6B',
                    padding: '0.35rem 0.7rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(255, 107, 107, 0.3)',
                  }}
                >
                  {contact.number}
                </span>
              </div>
            ))}
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.625rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              Always verify local emergency numbers after arrival — national numbers can differ by region.
            </p>
          </div>
        )}
      </ReportSection>
    </div>
  );
}
