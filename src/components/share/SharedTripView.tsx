import type { TravelItinerary } from '@/types/itinerary';
import { formatDate } from '@/lib/utils';

interface SharedTripViewProps {
  itinerary: TravelItinerary;
}

// Read-only rendering of a shared trip. Server-safe: no hooks, no browser APIs.
export default function SharedTripView({ itinerary }: SharedTripViewProps) {
  const { tripSummary, dailyItinerary, accommodations, restaurants, emergencyContacts } = itinerary;

  const stats = [
    { label: 'Days', value: tripSummary.totalDays },
    { label: 'Activities', value: dailyItinerary.reduce((sum, day) => sum + (day.activities?.length ?? 0), 0) },
    { label: 'Stays', value: accommodations.length },
    { label: 'Restaurants', value: restaurants.length },
  ];

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* Header card */}
      <div
        style={{
          padding: '1.5rem',
          borderRadius: 'var(--radius-xl)',
          background: 'linear-gradient(135deg, rgba(39, 242, 255, 0.08), rgba(177, 109, 255, 0.08))',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>
          {tripSummary.destination}
        </h1>
        <p style={{ margin: '0.35rem 0 1rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
          {formatDate(tripSummary.startDate)} — {formatDate(tripSummary.endDate)} · {tripSummary.travelStyle}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.5rem' }}>
          {stats.map((stat) => (
            <div
              key={stat.label}
              style={{
                padding: '0.7rem 0.5rem',
                textAlign: 'center',
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
              }}
            >
              <div style={{ fontSize: '1.125rem', fontWeight: 900, color: 'var(--color-primary)' }}>{stat.value}</div>
              <div style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', marginTop: '0.1rem' }}>{stat.label}</div>
            </div>
          ))}
        </div>
        {tripSummary.coverDescription && (
          <p style={{ margin: '1rem 0 0', fontSize: '0.8125rem', lineHeight: 1.7, color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
            {tripSummary.coverDescription}
          </p>
        )}
      </div>

      {/* Days */}
      <section style={{ display: 'grid', gap: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>Daily Itinerary</h2>
        {dailyItinerary.map((day) => (
          <article
            key={day.day}
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-xl)',
              background: 'var(--color-card)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
              Day {day.day} — {day.title}
            </h3>
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', margin: '0.2rem 0 0.75rem' }}>{formatDate(day.date)}</div>
            <div style={{ display: 'grid', gap: '0.625rem' }}>
              {(day.activities ?? []).map((activity, i) => (
                <div
                  key={`${day.day}-${i}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '64px 1fr',
                    gap: '0.625rem',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-lg)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-muted)', paddingTop: '0.1rem' }}>
                    {activity.time}
                    {activity.endTime ? `–${activity.endTime}` : ''}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{activity.name}</div>
                    {activity.description && (
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
                        {activity.description}
                      </p>
                    )}
                    <div style={{ marginTop: '0.3rem', fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                      {[activity.location, activity.duration].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      {/* Stays */}
      {accommodations.length > 0 && (
        <section style={{ display: 'grid', gap: '0.75rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>Accommodation</h2>
          {accommodations.map((stay, i) => (
            <div
              key={i}
              style={{
                padding: '1rem 1.125rem',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-card)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {stay.name} {stay.rating > 0 ? <span style={{ color: '#FFB547' }}>{'★'.repeat(Math.round(stay.rating))}</span> : null}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>
                {stay.type} · {stay.location}
              </div>
              {stay.amenities.length > 0 && (
                <div style={{ marginTop: '0.4rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {stay.amenities.map((amenity, ai) => (
                    <span
                      key={ai}
                      style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.07)',
                        fontSize: '0.625rem',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Food */}
      {restaurants.length > 0 && (
        <section style={{ display: 'grid', gap: '0.75rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>Food & Dining</h2>
          {restaurants.map((restaurant, i) => (
            <div
              key={i}
              style={{
                padding: '1rem 1.125rem',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-card)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {restaurant.name} <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#FFB547' }}>{'★'.repeat(Math.round(restaurant.rating))}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>
                {restaurant.cuisine} · {restaurant.priceRange} · {restaurant.location}
              </div>
              {restaurant.mustTry.length > 0 && (
                <div style={{ marginTop: '0.4rem', fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                  <strong style={{ color: 'var(--color-text-secondary)' }}>Must try: </strong>
                  {restaurant.mustTry.join(', ')}
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Emergency */}
      {emergencyContacts.length > 0 && (
        <section style={{ display: 'grid', gap: '0.75rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>Emergency Contacts</h2>
          {emergencyContacts.map((contact, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                padding: '0.9rem 1.125rem',
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(255, 107, 107, 0.05)',
                border: '1px solid rgba(255, 107, 107, 0.16)',
              }}
            >
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{contact.service}</div>
                {contact.notes && <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>{contact.notes}</div>}
              </div>
              <span style={{ fontSize: '0.9375rem', fontWeight: 900, color: '#FF6B6B' }}>{contact.number}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
