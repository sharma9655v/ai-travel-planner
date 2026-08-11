'use client';

import { motion } from 'framer-motion';
import { EmergencyContact } from '@/types/itinerary';
import { Phone, AlertTriangle, Lightbulb, Globe } from 'lucide-react';

export default function EmergencyContacts({
  contacts,
  travelTips,
  localCustoms,
  importantNotes,
}: {
  contacts: EmergencyContact[];
  travelTips: string[];
  localCustoms: string[];
  importantNotes: string[];
}) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      {/* Emergency Contacts */}
      {contacts && contacts.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ width: 4, height: 20, borderRadius: 2, background: 'linear-gradient(180deg, #FF6B6B, #FFB547)' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Emergency Contacts</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {contacts.map((contact, i) => (
              <motion.div
                key={`contact-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  background: 'rgba(255, 107, 107, 0.04)',
                  border: '1px solid rgba(255, 107, 107, 0.1)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 107, 107, 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Phone size={14} color="var(--color-danger)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {contact.service}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                    {contact.notes}
                  </div>
                </div>
                <a
                  href={`tel:${contact.number}`}
                  style={{
                    fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-danger)',
                    background: 'rgba(255, 107, 107, 0.1)',
                    padding: '0.375rem 0.75rem', borderRadius: 'var(--radius-full)',
                    textDecoration: 'none',
                  }}
                >
                  {contact.number}
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Travel Tips */}
      {travelTips && travelTips.length > 0 && (
        <InfoSection
          title="Travel Tips"
          icon={<Lightbulb size={14} color="var(--color-warning)" />}
          items={travelTips}
          gradientColors={['#FFB547', '#3DDC84']}
        />
      )}

      {/* Local Customs */}
      {localCustoms && localCustoms.length > 0 && (
        <InfoSection
          title="Local Customs"
          icon={<Globe size={14} color="var(--color-secondary)" />}
          items={localCustoms}
          gradientColors={['#B16DFF', '#27F2FF']}
        />
      )}

      {/* Important Notes */}
      {importantNotes && importantNotes.length > 0 && (
        <InfoSection
          title="Important Notes"
          icon={<AlertTriangle size={14} color="var(--color-danger)" />}
          items={importantNotes}
          gradientColors={['#FF6B6B', '#FFB547']}
        />
      )}
    </div>
  );
}

function InfoSection({
  title,
  icon,
  items,
  gradientColors,
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
  gradientColors: string[];
}) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div style={{ width: 4, height: 16, borderRadius: 2, background: `linear-gradient(180deg, ${gradientColors[0]}, ${gradientColors[1]})` }} />
        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{title}</h3>
      </div>
      <div
        className="glass-card-static"
        style={{ padding: '1rem' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <div style={{ marginTop: 2, flexShrink: 0 }}>{icon}</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
