'use client';
import type { EmotionTrend, EmotionTrendLabel } from '@/lib/types';

interface Props {
  trend: EmotionTrend;
  childName: string;
}

const LABEL_TEXT: Record<EmotionTrendLabel, string> = {
  'tranquila':       'Semana tranquila',
  'mixta':           'Semana con altibajos',
  'dificil':         'Semana difícil',
  'muy-dificil':     'Semana muy difícil',
  'pocos-registros': 'Pocos registros',
  'sin-registros':   'Sin registros',
};

// Fondos suaves, texto siempre --ink / --ink-soft: nunca rojo/verde ni --accent.
const LABEL_STYLE: Record<EmotionTrendLabel, React.CSSProperties> = {
  'tranquila':       { background: 'var(--ok-soft)',     color: 'var(--ink)' },
  'mixta':           { background: 'var(--lilac-soft)',  color: 'var(--ink)' },
  'dificil':         { background: 'var(--yellow-soft)', color: 'var(--ink)' },
  'muy-dificil':     { background: 'var(--error-soft)',  color: 'var(--ink)' },
  'pocos-registros': { background: 'var(--bg)', border: '1px solid var(--line)', color: 'var(--ink-soft)' },
  'sin-registros':   { background: 'var(--bg)', border: '1px solid var(--line)', color: 'var(--ink-soft)' },
};

// Fechas 'YYYY-MM-DD' interpretadas en UTC: no dependen de la zona horaria del dispositivo.
const fmtShortParts = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const fmtLongMonth  = new Intl.DateTimeFormat('es-PE', { month: 'long', timeZone: 'UTC' });

function utc(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00Z');
}

/** { day: '12', month: 'oct' } — sin el punto final que agrega es-PE ("oct."). */
function shortParts(dateStr: string): { day: string; month: string } {
  const parts = fmtShortParts.formatToParts(utc(dateStr));
  const day   = parts.find(p => p.type === 'day')?.value ?? '';
  const month = (parts.find(p => p.type === 'month')?.value ?? '').replace(/\.$/, '');
  return { day, month };
}

/** "12–18 oct" o "28 set – 4 oct". */
function formatRange(start: string, end: string): string {
  const a = shortParts(start);
  const b = shortParts(end);
  return a.month === b.month
    ? `${a.day}–${b.day} ${b.month}`
    : `${a.day} ${a.month} – ${b.day} ${b.month}`;
}

/** "Semana del 12 al 18 de octubre" o "Semana del 28 de setiembre al 4 de octubre". */
function formatRangeLong(start: string, end: string): string {
  const da = String(utc(start).getUTCDate());
  const db = String(utc(end).getUTCDate());
  const ma = fmtLongMonth.format(utc(start)).toLowerCase();
  const mb = fmtLongMonth.format(utc(end)).toLowerCase();
  return ma === mb
    ? `Semana del ${da} al ${db} de ${mb}`
    : `Semana del ${da} de ${ma} al ${db} de ${mb}`;
}

// Tendencia agregada para el padre (RPC get_emotion_trend): solo etiquetas por semana.
export default function EmotionTrendCard({ trend, childName }: Props) {
  if (trend.weeks.every(w => w.label === 'sin-registros')) return null;

  // El RPC devuelve weeks[0] = semana actual. Se muestra de la más antigua a la más reciente.
  const currentStart = trend.weeks[0]?.week_start;
  const ordered = [...trend.weeks].reverse();
  const recentHard = trend.weeks.slice(0, 2).some(w => w.label === 'dificil' || w.label === 'muy-dificil');

  return (
    <section aria-labelledby="emotion-trend-title" style={{
      background: 'var(--bg-card)', border: '1.5px solid var(--line)',
      borderRadius: 16, padding: '14px 16px', marginBottom: 16,
    }}>
      <h4 id="emotion-trend-title" style={{
        fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 15,
        color: 'var(--ink)', margin: '0 0 10px',
      }}>
        💭 Tendencia emocional · {childName}
      </h4>

      <div role="list" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {ordered.map(w => {
          const isCurrent = w.week_start === currentStart;
          const text = LABEL_TEXT[w.label];
          return (
            <div
              key={w.week_start}
              role="listitem"
              aria-label={`${formatRangeLong(w.week_start, w.week_end)}${isCurrent ? ' (en curso)' : ''}: ${text.toLowerCase()}`}
              style={{
                flex: '1 1 120px', minWidth: 0,
                display: 'flex', flexDirection: 'column', gap: 6,
                padding: '8px 10px', borderRadius: 12,
                border: '1px solid var(--line)', background: 'var(--bg-card)',
              }}
            >
              <div aria-hidden="true">
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)' }}>
                  {formatRange(w.week_start, w.week_end)}
                </div>
                {isCurrent && (
                  <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>(en curso)</div>
                )}
              </div>
              <span aria-hidden="true" style={{
                ...LABEL_STYLE[w.label],
                alignSelf: 'flex-start', padding: '4px 10px', borderRadius: 20,
                fontSize: 12.5, fontWeight: 600, lineHeight: 1.3,
              }}>
                {text}
              </span>
            </div>
          );
        })}
      </div>

      {recentHard && (
        <p style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5, marginTop: 12 }}>
          Una conversación tranquila puede ayudar. Evita preguntarle por sus registros: son privados.
        </p>
      )}

      <p style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.45, marginTop: 10 }}>
        Solo se muestra la tendencia. Los registros y notas de tu hijo/a son privados.
      </p>
    </section>
  );
}
