'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PackingCategory } from '@/types/itinerary';
import { Package, Check, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';

export default function PackingChecklist({
  initialChecklist,
}: {
  initialChecklist: PackingCategory[];
}) {
  const [checklist, setChecklist] = useState(initialChecklist || []);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    new Set(checklist.map((_, i) => i))
  );

  if (!checklist || checklist.length === 0) return null;

  const totalItems = checklist.reduce((sum, cat) => sum + (cat.items?.length || 0), 0);
  const packedItems = checklist.reduce(
    (sum, cat) => sum + (cat.items?.filter((item) => item.packed)?.length || 0),
    0
  );
  const essentialMissing = checklist.reduce(
    (sum, cat) =>
      sum + (cat.items?.filter((item) => item.essential && !item.packed)?.length || 0),
    0
  );

  const togglePacked = (catIdx: number, itemIdx: number) => {
    setChecklist((prev) => {
      const updated = [...prev];
      const cat = { ...updated[catIdx] };
      const items = [...(cat.items || [])];
      items[itemIdx] = { ...items[itemIdx], packed: !items[itemIdx].packed };
      cat.items = items;
      updated[catIdx] = cat;
      return updated;
    });
  };

  const toggleCategory = (idx: number) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <div style={{ width: 4, height: 20, borderRadius: 2, background: 'linear-gradient(180deg, #27F2FF, #70E1FF)' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Packing Checklist</h2>
      </div>

      {/* Summary */}
      <div
        className="glass-card-static"
        style={{ padding: '1rem 1.25rem', marginBottom: '1rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
            {packedItems} of {totalItems} items packed
          </div>
          {essentialMissing > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.6875rem', color: 'var(--color-warning)' }}>
              <AlertCircle size={12} />
              {essentialMissing} essential missing
            </div>
          )}
        </div>
        <div style={{ height: 4, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 2, overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${totalItems > 0 ? (packedItems / totalItems) * 100 : 0}%` }}
            transition={{ duration: 0.5 }}
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #27F2FF, #3DDC84)',
              borderRadius: 2,
              boxShadow: '0 0 8px rgba(39, 242, 255, 0.3)',
            }}
          />
        </div>
      </div>

      {/* Categories */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {checklist.map((category, catIdx) => {
          const isExpanded = expandedCategories.has(catIdx);
          const catPacked = category.items?.filter((i) => i.packed)?.length || 0;
          const catTotal = category.items?.length || 0;

          return (
            <div
              key={`cat-${catIdx}`}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
              }}
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(catIdx)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-primary)',
                  fontFamily: 'inherit',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Package size={14} color="var(--color-primary)" />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>
                    {category.category}
                  </span>
                  <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)' }}>
                    {catPacked}/{catTotal}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronDown size={14} color="var(--color-text-muted)" />
                ) : (
                  <ChevronRight size={14} color="var(--color-text-muted)" />
                )}
              </button>

              {/* Items */}
              {isExpanded && (
                <div style={{ padding: '0 1rem 0.75rem' }}>
                  {category.items?.map((item, itemIdx) => (
                    <motion.div
                      key={`${catIdx}-${itemIdx}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: itemIdx * 0.02 }}
                      onClick={() => togglePacked(catIdx, itemIdx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.625rem',
                        padding: '0.5rem 0',
                        cursor: 'pointer',
                        borderBottom:
                          itemIdx < (category.items?.length || 0) - 1
                            ? '1px solid rgba(255, 255, 255, 0.04)'
                            : 'none',
                      }}
                    >
                      {/* Checkbox */}
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 'var(--radius-sm)',
                          border: `1.5px solid ${
                            item.packed ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.15)'
                          }`,
                          background: item.packed ? 'rgba(39, 242, 255, 0.15)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 200ms',
                          flexShrink: 0,
                        }}
                      >
                        {item.packed && <Check size={10} color="var(--color-primary)" />}
                      </div>

                      {/* Label */}
                      <span
                        style={{
                          fontSize: '0.8125rem',
                          color: item.packed ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                          textDecoration: item.packed ? 'line-through' : 'none',
                          flex: 1,
                        }}
                      >
                        {item.item}
                      </span>

                      {/* Essential badge */}
                      {item.essential && !item.packed && (
                        <span
                          style={{
                            fontSize: '0.5625rem',
                            fontWeight: 700,
                            color: 'var(--color-warning)',
                            background: 'rgba(255, 181, 71, 0.1)',
                            padding: '0.125rem 0.375rem',
                            borderRadius: 'var(--radius-full)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.03em',
                          }}
                        >
                          Essential
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
