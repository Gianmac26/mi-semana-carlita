'use client';
import BottomSheet from '@/components/BottomSheet';
import type { WellnessCategory, WellnessResource } from '@/lib/types';

export interface WellnessCategoryMeta {
  key: WellnessCategory;
  emoji: string;
  title: string;
  color: string;
  colorSoft: string;
}

interface WellnessCategorySheetProps {
  category: WellnessCategoryMeta | null;
  resources: WellnessResource[];
  onClose: () => void;
  onSelect: (resource: WellnessResource) => void;
}

export default function WellnessCategorySheet({ category, resources, onClose, onSelect }: WellnessCategorySheetProps) {
  return (
    <BottomSheet
      open={category !== null}
      onClose={onClose}
      zIndex={200}
      title={category ? `${category.emoji} ${category.title}` : ''}
      ariaLabel={category?.title ?? 'Categoría'}
    >
      {category && (
        resources.length === 0 ? (
          <p style={{ fontSize: 14.5, color: 'var(--ink-soft)', textAlign: 'center', padding: '24px 0' }}>
            Pronto habrá fichas en esta categoría.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {resources.map(r => (
              <button
                key={r.id}
                onClick={() => onSelect(r)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12, textAlign: 'left',
                  width: '100%', minHeight: 72, padding: '14px 16px', borderRadius: 16,
                  border: `1.5px solid color-mix(in srgb, ${category.color} 25%, transparent)`,
                  background: 'var(--bg-card)', cursor: 'pointer',
                }}
              >
                <span style={{
                  flexShrink: 0, width: 44, height: 44, borderRadius: 12,
                  background: category.colorSoft, fontSize: 22,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {r.emoji}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{
                    display: 'block', fontFamily: 'var(--font-title)', fontWeight: 700,
                    fontSize: 15.5, color: 'var(--ink)', lineHeight: 1.3,
                  }}>
                    {r.title}
                  </span>
                  {r.summary && (
                    <span style={{
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.45, marginTop: 4,
                    }}>
                      {r.summary}
                    </span>
                  )}
                </span>
                <span aria-hidden style={{ flexShrink: 0, alignSelf: 'center', color: 'var(--ink-soft)', fontSize: 18 }}>›</span>
              </button>
            ))}
          </div>
        )
      )}
    </BottomSheet>
  );
}
