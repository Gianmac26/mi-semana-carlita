'use client';
import BottomSheet from '@/components/BottomSheet';
import { getBadge, type BadgeSlug } from '@/lib/badges';
import type { BadgeEntry } from '@/lib/types';

interface Props {
  badges: BadgeEntry[];
  onMarkNotified: (ids: string[]) => void;
}

export default function BadgeToast({ badges, onMarkNotified }: Props) {
  const newBadges = badges.filter(b => b.notified_at === null);
  const open = newBadges.length > 0;

  function handleClose() {
    onMarkNotified(newBadges.map(b => b.id));
  }

  return (
    <BottomSheet
      open={open}
      onClose={handleClose}
      zIndex={450}
      title="🎉 ¡Nuevas insignias!"
      ariaLabel="Insignias desbloqueadas"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {newBadges.map(b => {
          // badge_slug es text libre en DB; un slug que no está en el catálogo se ignora.
          const def = getBadge(b.badge_slug as BadgeSlug);
          if (!def) return null;
          return (
            <div key={b.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 14px', borderRadius: 16,
              background: 'var(--lilac-soft)', border: '1.5px solid var(--lilac)',
            }}>
              <span style={{ fontSize: 40, lineHeight: 1, flexShrink: 0 }}>{def.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'var(--font-title)', fontWeight: 700,
                  fontSize: 15, color: 'var(--lilac)', marginBottom: 2,
                }}>
                  {def.title}
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.4 }}>
                  {def.description}
                </div>
              </div>
            </div>
          );
        })}

        <button
          onClick={handleClose}
          style={{
            width: '100%', minHeight: 52, marginTop: 4,
            borderRadius: 16, border: 'none',
            background: 'var(--lilac)', color: 'var(--on-accent)',
            fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 16,
            cursor: 'pointer',
          }}
        >
          ¡Genial!
        </button>
      </div>
    </BottomSheet>
  );
}
