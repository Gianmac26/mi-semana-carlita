'use client';
import { BADGES } from '@/lib/badges';
import type { BadgeEntry } from '@/lib/types';

interface Props {
  earnedBadges: BadgeEntry[];
}

const fmtShort = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short' });

// Grid fijo de 3 columnas: .main-content tiene maxWidth 480, así que un breakpoint
// de 4 columnas desde 768px nunca llegaría a verse.
export default function BadgeGallery({ earnedBadges }: Props) {
  const earnedMap = new Map(earnedBadges.map(b => [b.badge_slug, b]));

  return (
    <section style={{ marginTop: 28 }}>
      <h3 style={{
        fontFamily: 'var(--font-title)', fontWeight: 700,
        fontSize: 17, color: 'var(--lilac)', marginBottom: 12,
      }}>
        🏅 Insignias
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10,
      }}>
        {BADGES.map(def => {
          const earned = earnedMap.get(def.slug);
          const state = earned
            ? 'earned'
            : def.active ? 'pending' : 'placeholder';

          return (
            <div key={def.slug} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '12px 8px', borderRadius: 14,
              background: 'var(--bg-card)', border: '1.5px solid var(--line)',
              textAlign: 'center',
              opacity: state === 'earned' ? 1 : state === 'pending' ? 0.4 : 0.25,
              filter: state === 'earned' ? 'none' : 'grayscale(1)',
            }}>
              <span style={{ fontSize: 32, lineHeight: 1 }}>{def.emoji}</span>
              <span style={{
                fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 11,
                color: 'var(--ink)', lineHeight: 1.2,
              }}>
                {def.title}
              </span>
              <span style={{ fontSize: 10, color: 'var(--ink-soft)' }}>
                {earned
                  ? `Ganada el ${fmtShort.format(new Date(earned.earned_at)).replace(/\.$/, '')}`
                  : def.active ? 'Por ganar' : 'Próximamente'}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
