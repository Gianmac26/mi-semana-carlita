'use client';
import { addDays } from '@/lib/gamification';
import { getEmotionMeta } from '@/lib/emotions';
import type { EmotionLog } from '@/lib/types';

interface Props {
  logs: EmotionLog[];
  /** hoyLima() — 'YYYY-MM-DD'. */
  todayKey: string;
}

const DAY_LETTERS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];   // getUTCDay: 0 = domingo
const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Últimos 7 días móviles terminando HOY (no semana calendario).
// Solo addDays + 'T00:00:00Z': nada depende de la zona horaria del dispositivo.
export default function EmotionWeeklyRow({ logs, todayKey }: Props) {
  const dias: { key: string; dow: number; log: EmotionLog | null }[] = [];
  for (let i = 6; i >= 0; i--) {
    const key = addDays(todayKey, -i);
    const dow = new Date(key + 'T00:00:00Z').getUTCDay();
    const log = logs.find(l => l.log_date === key) ?? null;
    dias.push({ key, dow, log });
  }
  const allEmpty = dias.every(d => d.log === null);

  return (
    <section style={{ marginBottom: 16 }}>
      <h4 id="emotion-week-title" style={{
        fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 15,
        color: 'var(--ink)', margin: '0 0 10px',
      }}>
        Tus últimos 7 días
      </h4>

      <div aria-labelledby="emotion-week-title" role="list" style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 4,
      }}>
        {dias.map(({ key, dow, log }) => {
          const isToday = key === todayKey;
          const dayNum = String(Number(key.slice(8, 10)));
          const meta = log ? getEmotionMeta(log.emotion) : null;
          const label = log && meta
            ? `${DAY_NAMES[dow]} ${dayNum}: ${meta.label.toLowerCase()}, intensidad ${log.intensity} de 5`
            : `${DAY_NAMES[dow]} ${dayNum}: sin registro`;
          return (
            <div
              key={key}
              role="listitem"
              aria-label={label}
              style={{
                minHeight: 56, minWidth: 0, borderRadius: 12,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                background: isToday ? 'var(--accent-soft)' : log ? 'var(--bg-card)' : 'var(--bg)',
                border: `1.5px solid ${isToday ? 'var(--accent)' : 'var(--line)'}`,
              }}
            >
              <span aria-hidden="true" style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-soft)' }}>
                {DAY_LETTERS[dow]}
              </span>
              <span aria-hidden="true" style={{ fontSize: 20, lineHeight: 1, color: 'var(--ink-soft)' }}>
                {meta ? meta.emoji : '–'}
              </span>
            </div>
          );
        })}
      </div>

      {allEmpty && (
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', fontStyle: 'italic', marginTop: 8 }}>
          Aún no tienes registros en los últimos 7 días.
        </p>
      )}
    </section>
  );
}
