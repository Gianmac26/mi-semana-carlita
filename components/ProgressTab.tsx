'use client';
import { useState } from 'react';
import { AppState } from '@/lib/types';
import { DAY_KEYS, DayKey, getDayCompletion, getTasksForDay } from '@/lib/tasks';
import { getMondayOfWeek, formatWeekKey, formatDateRange } from '@/lib/utils';

interface Props { state: AppState }

const CHART_DAYS: DayKey[]  = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const CHART_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const NOTE_DAYS: DayKey[]   = ['mon', 'tue', 'wed', 'thu', 'fri'];
const NOTE_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

function weekAvg(wd: Record<string, unknown>, upToIdx: number | null): number {
  const days: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const slice = upToIdx === null ? days : days.slice(0, upToIdx + 1);
  const withTasks = slice.filter(d => getTasksForDay(d).length > 0);
  if (!withTasks.length) return 0;
  const sum = withTasks.reduce((acc, d) => acc + getDayCompletion(wd[d] as Record<string, unknown>, d), 0);
  return Math.round(sum / withTasks.length);
}

export default function ProgressTab({ state }: Props) {
  const today = new Date();
  const [monday] = useState(() => getMondayOfWeek(today));
  const weekKey  = formatWeekKey(monday);
  const weekData = (state.weeks[weekKey] ?? {}) as Record<string, unknown>;

  // today's index in chart (0=Mon…5=Sat, -1=Sun)
  const rawDay = today.getDay(); // 0=Sun,1=Mon…6=Sat
  const todayChartIdx = rawDay === 0 ? -1 : rawDay - 1;

  // Past weeks (up to 6 that have any data)
  const pastWeeks = Array.from({ length: 6 }, (_, i) => {
    const m = new Date(monday);
    m.setDate(m.getDate() - (i + 1) * 7);
    const wk = formatWeekKey(m);
    const wd = (state.weeks[wk] ?? {}) as Record<string, unknown>;
    return { monday: m, weekKey: wk, wd, avg: weekAvg(wd, null) };
  }).filter(w => Object.keys(w.wd).length > 0);

  return (
    <div>
      {/* Bar chart */}
      <section style={{ marginBottom: 28 }}>
        <h3 style={{
          fontFamily: 'var(--font-title)', fontWeight: 700,
          fontSize: 17, color: 'var(--pink)', marginBottom: 16,
        }}>
          Esta semana, día por día
        </h3>
        <div style={{
          display: 'flex', alignItems: 'flex-end',
          gap: 8, height: 140,
          background: 'var(--bg-card)', borderRadius: 16,
          padding: '16px 12px 8px', border: '1.5px solid var(--line)',
        }}>
          {CHART_DAYS.map((day, i) => {
            const isPastOrToday = i <= todayChartIdx;
            const pct = isPastOrToday
              ? getDayCompletion(weekData[day] as Record<string, unknown>, day)
              : null;
            const barH = pct !== null ? Math.max(4, pct) : 0;
            const barColor = pct === null ? 'transparent'
              : pct === 100 ? 'var(--ok)'
              : pct > 0 ? 'var(--yellow)'
              : 'var(--line)';
            const isToday = i === todayChartIdx;
            return (
              <div key={day} style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'flex-end', gap: 4, height: '100%',
              }}>
                {pct !== null && (
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: pct === 100 ? 'var(--ok)' : 'var(--ink-soft)',
                  }}>
                    {pct}%
                  </span>
                )}
                <div style={{
                  width: '100%', height: `${barH}%`,
                  borderRadius: '6px 6px 0 0',
                  background: barColor,
                  minHeight: pct !== null && pct === 0 ? 4 : undefined,
                  transition: 'height 0.4s ease',
                }} />
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  color: isToday ? 'var(--pink)' : 'var(--ink-soft)',
                }}>
                  {CHART_LABELS[i]}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Study notes */}
      <section style={{ marginBottom: 28 }}>
        <h3 style={{
          fontFamily: 'var(--font-title)', fontWeight: 700,
          fontSize: 17, color: 'var(--teal)', marginBottom: 12,
        }}>
          📝 Notas de estudio de la semana
        </h3>
        {NOTE_DAYS.map((day, i) => {
          const note = (weekData[day] as { notes?: string } | undefined)?.notes;
          return (
            <div key={day} style={{
              marginBottom: 8, padding: '10px 14px',
              background: 'var(--bg-card)', borderRadius: 12,
              border: '1.5px solid var(--line)',
            }}>
              <div style={{
                fontWeight: 700, fontSize: 13,
                color: 'var(--ink-soft)', marginBottom: 4,
              }}>
                {NOTE_LABELS[i]}
              </div>
              <div style={{
                fontSize: 14,
                color: note ? 'var(--ink)' : 'var(--ink-soft)',
                fontStyle: note ? 'normal' : 'italic',
              }}>
                {note || 'Sin nota todavía'}
              </div>
            </div>
          );
        })}
      </section>

      {/* Past weeks */}
      {pastWeeks.length > 0 && (
        <section>
          <h3 style={{
            fontFamily: 'var(--font-title)', fontWeight: 700,
            fontSize: 17, color: 'var(--lilac)', marginBottom: 12,
          }}>
            Últimas semanas
          </h3>
          {pastWeeks.map(w => (
            <div key={w.weekKey} style={{
              marginBottom: 10, padding: '12px 14px',
              background: 'var(--bg-card)', borderRadius: 14,
              border: '1.5px solid var(--line)',
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', marginBottom: 6,
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)' }}>
                  {formatDateRange(w.monday)}
                </span>
                <span style={{
                  fontSize: 13, fontWeight: 700,
                  color: w.avg === 100 ? 'var(--ok)' : 'var(--ink)',
                }}>
                  {w.avg}%
                </span>
              </div>
              <div style={{ background: 'var(--line)', borderRadius: 4, height: 6 }}>
                <div style={{
                  width: `${w.avg}%`, height: 6, borderRadius: 4,
                  background: w.avg === 100 ? 'var(--ok)' : 'var(--lilac)',
                  transition: 'width 0.4s ease',
                }} />
              </div>
            </div>
          ))}
        </section>
      )}

      {pastWeeks.length === 0 && Object.keys(weekData).length === 0 && (
        <p style={{
          textAlign: 'center', color: 'var(--ink-soft)',
          fontStyle: 'italic', padding: '24px 0',
        }}>
          Aún no hay datos registrados. ¡Empieza marcando tus tareas! ✨
        </p>
      )}
    </div>
  );
}
