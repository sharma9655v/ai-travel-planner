'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Compass, Plane } from 'lucide-react';
import { useItinerariesStore } from '@/hooks/useItineraries';
import { useQuestionnaireStore } from '@/hooks/useQuestionnaire';
import { useMounted } from '@/hooks/useMounted';
import { fadeUp, stagger } from '@/lib/motion';
import TripCard from './TripCard';
import EmptyState from '@/components/shared/EmptyState';

export default function RecentTrips() {
  const router = useRouter();
  const mounted = useMounted();
  const deleteItinerary = useItinerariesStore((s) => s.deleteItinerary);
  // Select the stable plans slice, then derive — the selector itself must
  // return a stable reference or React 19's useSyncExternalStore will
  // re-render in an infinite loop (fresh array from Object.values).
  const plans = useItinerariesStore((s) => s.plans);
  const trips = useMemo(
    () => Object.values(plans).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [plans]
  );

  if (!mounted) {
    return null;
  }

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this saved trip?')) return;
    deleteItinerary(id);

    // Don't let a deep link to a deleted trip regenerate it on the itinerary page
    const { generatedId, setGeneratedId } = useQuestionnaireStore.getState();
    if (generatedId === id) {
      setGeneratedId(null);
    }
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      variants={stagger}
    >
      <motion.div
        variants={fadeUp}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Compass size={16} color="var(--color-primary-light)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Recent Trips</h3>
        </div>
      </motion.div>

      {trips.length === 0 ? (
        <motion.div variants={fadeUp}>
          <EmptyState
            icon={Plane}
            title="No saved trips yet"
            description="Generate your first itinerary and it will show up here, ready to revisit."
            actionLabel="Plan your first trip"
            onAction={() => router.push('/plan')}
          />
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </motion.div>
  );
}