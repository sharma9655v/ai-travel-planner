'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import QRCode from 'qrcode';
import { Check, Copy, Eye, Link2, Loader2, Pencil, QrCode, Share2, Trash2, X } from 'lucide-react';
import type { TravelItinerary } from '@/types/itinerary';
import type { ShareMode } from '@/lib/sharing/types';
import { publishShare, revokeShare, shareUrl } from '@/lib/sharing/client';
import { useItinerariesStore } from '@/hooks/useItineraries';

interface ShareTripModalProps {
  tripId: string;
  itinerary: TravelItinerary;
  onClose: () => void;
}

const MODE_OPTIONS: { mode: ShareMode; label: string; hint: string }[] = [
  { mode: 'view', label: 'View only', hint: 'Visitors can read the trip, not change anything.' },
  { mode: 'edit', label: 'Can edit', hint: 'Visitors can copy the trip into their own planner.' },
];

export default function ShareTripModal({ tripId, itinerary, onClose }: ShareTripModalProps) {
  const shareMeta = useItinerariesStore((s) => s.shares[tripId]) ?? null;
  const setShare = useItinerariesStore((s) => s.setShare);
  const clearShare = useItinerariesStore((s) => s.clearShare);

  const [mode, setMode] = useState<ShareMode>(shareMeta?.mode ?? 'view');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  const link = shareMeta ? shareUrl(shareMeta.token) : null;

  // Keep the shared copy in sync with the current version of the trip.
  const rePublish = useCallback(
    async (nextMode: ShareMode) => {
      setBusy(true);
      setError(null);
      try {
        const meta = await publishShare(tripId, itinerary, nextMode, shareMeta);
        setShare(tripId, meta);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      } finally {
        setBusy(false);
      }
    },
    [tripId, itinerary, shareMeta, setShare]
  );

  // Silent refresh when the modal opens with an existing link.
  // Deferred so React doesn't cascade renders from within the effect.
  useEffect(() => {
    if (shareMeta) {
      const timer = window.setTimeout(() => {
        void rePublish(shareMeta.mode).catch(() => {});
      }, 0);
      return () => window.clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  // QR code for the current link (generated client-side).
  useEffect(() => {
    if (!link) return;
    let cancelled = false;
    QRCode.toDataURL(link, {
      width: 168,
      margin: 1,
      color: { dark: '#0B0D12', light: '#FFFFFF' },
    })
      .then((url) => {
        if (!cancelled) setQrUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [link]);

  const copyLink = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const input = document.createElement('input');
      input.value = link;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const handleStopSharing = async () => {
    if (!shareMeta) return;
    setBusy(true);
    setError(null);
    try {
      await revokeShare(shareMeta.token, shareMeta.revokeKey);
      clearShare(tripId);
      setConfirmRevoke(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not revoke the link.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: 420,
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: 'var(--radius-xl)',
            background: 'rgba(13, 15, 20, 0.98)',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            padding: '1.5rem',
            boxShadow: '0 24px 80px rgba(0, 0, 0, 0.55)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, rgba(39, 242, 255, 0.18), rgba(177, 109, 255, 0.18))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Share2 size={18} color="var(--color-primary)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>Share Trip</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>{itinerary.tripSummary.destination}</div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
              }}
            >
              <X size={15} />
            </button>
          </div>

          {error && (
            <div
              style={{
                padding: '0.7rem 0.875rem',
                marginBottom: '1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 107, 107, 0.08)',
                border: '1px solid rgba(255, 107, 107, 0.3)',
                fontSize: '0.75rem',
                color: '#FF6B6B',
              }}
            >
              {error}
            </div>
          )}

          {!shareMeta ? (
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gap: '0.625rem' }}>
                {MODE_OPTIONS.map((option) => (
                  <button
                    key={option.mode}
                    onClick={() => setMode(option.mode)}
                    disabled={busy}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.9rem 1rem',
                      borderRadius: 'var(--radius-lg)',
                      background: mode === option.mode ? 'rgba(39, 242, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${mode === option.mode ? 'rgba(39, 242, 255, 0.35)' : 'rgba(255, 255, 255, 0.07)'}`,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      textAlign: 'left',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {option.mode === 'view' ? <Eye size={16} color="var(--color-primary)" /> : <Pencil size={16} color="#B16DFF" />}
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>{option.label}</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '0.1rem' }}>{option.hint}</div>
                    </div>
                  </button>
                ))}
              </div>

              <button onClick={() => void rePublish(mode)} disabled={busy} className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                {busy ? <Loader2 size={16} className="spin" /> : <Link2 size={16} />}
                {busy ? 'Creating link…' : 'Create share link'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              {/* Privacy: who can access */}
              <div>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                  Privacy
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.75rem 0.875rem',
                    borderRadius: 'var(--radius-lg)',
                    background: 'rgba(61, 220, 132, 0.07)',
                    border: '1px solid rgba(61, 220, 132, 0.25)',
                    fontSize: '0.75rem',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', flex: 1 }}>
                    <Link2 size={13} color="var(--color-success)" />
                    Anyone with the link
                  </span>
                  <span style={{ fontSize: '0.625rem', color: 'var(--color-success)', fontWeight: 700 }}>ACTIVE</span>
                </div>
              </div>

              {/* Access mode toggle */}
              <div>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                  Access level
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {MODE_OPTIONS.map((option) => (
                    <button
                      key={option.mode}
                      onClick={() => void rePublish(option.mode)}
                      disabled={busy}
                      title={option.hint}
                      style={{
                        flex: 1,
                        padding: '0.6rem 0.5rem',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: shareMeta.mode === option.mode ? 'rgba(39, 242, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${shareMeta.mode === option.mode ? 'rgba(39, 242, 255, 0.4)' : 'rgba(255, 255, 255, 0.07)'}`,
                        color: 'var(--color-text-primary)',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      {option.mode === 'view' ? <Eye size={13} /> : <Pencil size={13} />}
                      {option.label}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>
                  Updating the access level re-publishes the latest version of your trip.
                </div>
              </div>

              {/* Link + QR */}
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <button
                  onClick={() => void copyLink()}
                  disabled={busy || !link}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.8rem 1rem',
                    borderRadius: 'var(--radius-lg)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.09)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: '0.75rem',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {link}
                  </span>
                  {copied ? <Check size={15} color="var(--color-success)" /> : <Copy size={15} color="var(--color-text-muted)" />}
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: copied ? 'var(--color-success)' : 'var(--color-primary)' }}>
                    {copied ? 'Copied' : 'Copy'}
                  </span>
                </button>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    borderRadius: 'var(--radius-lg)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                  }}
                >
                  {qrUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- QR is a client-generated data URL; next/image adds nothing here
                    <img
                      src={qrUrl}
                      alt="QR code for this shared trip"
                      width={168}
                      height={168}
                      style={{ borderRadius: 'var(--radius-md)', background: '#fff', padding: 6 }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 168,
                        height: 168,
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        color: 'var(--color-text-muted)',
                        fontSize: '0.6875rem',
                      }}
                    >
                      <QrCode size={28} />
                      Generating…
                    </div>
                  )}
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', lineHeight: 1.6, maxWidth: 140 }}>
                    Scan with any phone camera to open the shared trip.
                  </div>
                </div>
              </div>

              {/* Revoke */}
              {confirmRevoke ? (
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-lg)',
                    background: 'rgba(255, 107, 107, 0.07)',
                    border: '1px solid rgba(255, 107, 107, 0.3)',
                  }}
                >
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
                    Stop sharing this trip?
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                    The link will stop working immediately. Anyone who already opened it keeps nothing after this point.
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => setConfirmRevoke(false)}
                      disabled={busy}
                      style={{
                        flex: 1,
                        padding: '0.6rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      Keep sharing
                    </button>
                    <button
                      onClick={() => void handleStopSharing()}
                      disabled={busy}
                      style={{
                        flex: 1,
                        padding: '0.6rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: 'rgba(255, 107, 107, 0.15)',
                        border: '1px solid rgba(255, 107, 107, 0.4)',
                        color: '#FF6B6B',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      {busy ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />}
                      Stop sharing
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmRevoke(true)}
                  disabled={busy}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    padding: '0.6rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'transparent',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#FF6B6B',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <Trash2 size={13} />
                  Stop sharing
                </button>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
