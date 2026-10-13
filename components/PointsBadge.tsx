'use client';
import { formatPoints } from '@/lib/gamification';

interface Props {
  points: number;
  /** Racha "viva" (getCurrentStreak). 0 → no se muestra el 🔥. */
  streak: number;
}

export default function PointsBadge({ points, streak }: Props) {
  const label =
    `${points} ${points === 1 ? 'punto' : 'puntos'}` +
    (streak > 0 ? `, racha de ${streak} ${streak === 1 ? 'día' : 'días'}` : '');

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      style={{
        display: 'inline-flex', gap: 8, alignItems: 'center',
        padding: '2px 9px', borderRadius: 20,
        background: 'var(--bg-card)', border: '1.5px solid var(--line)',
        fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 13, lineHeight: 1.4,
        // El color lo ponen los emojis: --yellow sobre fondo claro no llega a 4.5:1.
        color: 'var(--ink)',
        whiteSpace: 'nowrap', flexShrink: 0,
      }}
    >
      <span>⭐ {formatPoints(points)}</span>
      {streak > 0 && <span>🔥 {streak}</span>}
    </span>
  );
}
