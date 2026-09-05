'use client';
import { useState, useCallback, useRef } from 'react';
import { AppState, DayState, EnsayoState } from '@/lib/types';
import { DAY_KEYS, DayKey, getTasksForDay, getDayCompletion } from '@/lib/tasks';
import { getMondayOfWeek, formatWeekKey, getTodayDayKey } from '@/lib/utils';
import WeekSelector from './WeekSelector';
import DayChips from './DayChips';
import TaskItem from './TaskItem';
import GoldenRules from './GoldenRules';

interface Props {
  state: AppState;
  onChange: (newState: AppState) => void;
}

const INPUT: React.CSSProperties = {
  width: '100%', padding: '9px 11px', borderRadius: 10,
  border: '1.5px solid var(--line)', background: 'var(--bg-card)',
  color: 'var(--ink)', fontFamily: 'var(--font-body)', fontSize: 15,
  outline: 'none',
};

export default function WeekTab({ state, onChange }: Props) {
  const todayKey = getTodayDayKey();
  const [monday, setMonday] = useState<Date>(() => getMondayOfWeek(new Date()));
  const [selectedDay, setSelectedDay] = useState<DayKey>(() => {
    const t = getTodayDayKey();
    return (DAY_KEYS.includes(t as DayKey) ? t : 'mon') as DayKey;
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const weekKey  = formatWeekKey(monday);
  const weekData = state.weeks[weekKey] ?? {};
  const dayState = (weekData[selectedDay] ?? {}) as DayState;
  const tasks    = getTasksForDay(selectedDay);
  const pct      = getDayCompletion(dayState as Record<string, unknown>, selectedDay);
  const isWeekday = !['sat', 'sun'].includes(selectedDay);

  const updateDay = useCallback((patch: Partial<DayState>) => {
    onChange({
      ...state,
      weeks: {
        ...state.weeks,
        [weekKey]: {
          ...weekData,
          [selectedDay]: { ...dayState, ...patch },
        },
      },
    });
  }, [state, onChange, weekKey, weekData, selectedDay, dayState]);

  const toggleTask = (id: string) => updateDay({ [id]: !dayState[id] });

  const toggleSkip = (id: string) => {
    const prev = (dayState.skipped ?? {}) as Record<string, boolean>;
    updateDay({ skipped: { ...prev, [id]: !prev[id] } });
  };

  const handleNotes = (val: string) => {
    updateDay({ notes: val });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {}, 1000);
  };

  const handleEnsayo = (field: 'start' | 'end', val: string) => {
    const prev = (dayState.ensayo ?? { start: '', end: '' }) as EnsayoState;
    updateDay({ ensayo: { ...prev, [field]: val } });
  };

  return (
    <div>
      <WeekSelector monday={monday} onChange={setMonday} />
      <DayChips
        weekData={weekData}
        selected={selectedDay}
        onSelect={setSelectedDay}
        todayKey={todayKey}
      />

      <div style={{ marginTop: 20 }}>
        {/* Tasks */}
        {tasks.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', marginBottom: 12,
            }}>
              <span style={{
                fontFamily: 'var(--font-title)', fontWeight: 700,
                fontSize: 16, color: 'var(--ink)',
              }}>
                Tareas del día
              </span>
              <span style={{
                background: pct === 100 ? 'var(--ok-soft)' : 'var(--yellow-soft)',
                color: pct === 100 ? 'var(--ok)' : 'var(--yellow)',
                borderRadius: 20, padding: '4px 12px',
                fontWeight: 700, fontSize: 13,
                fontFamily: 'var(--font-title)',
              }}>
                {pct}% cumplido
              </span>
            </div>
            {tasks.map(task => {
              const skipped = !!((dayState.skipped as Record<string,boolean> | undefined)?.[task.id]);
              return (
                <TaskItem
                  key={task.id}
                  task={task}
                  checked={!!dayState[task.id]}
                  skipped={skipped}
                  onToggle={() => toggleTask(task.id)}
                  onSkip={() => toggleSkip(task.id)}
                />
              );
            })}
          </div>
        )}

        {selectedDay === 'sun' && (
          <div style={{
            textAlign: 'center', padding: '32px 0',
            color: 'var(--ink-soft)', fontStyle: 'italic', fontSize: 15,
          }}>
            🌴 Domingo libre — ¡descansa, Carlita!
          </div>
        )}

        {/* Ensayo — always visible */}
        <div style={{
          background: 'var(--teal-soft)', borderRadius: 18,
          padding: 16, marginBottom: 12,
        }}>
          <h3 style={{
            fontFamily: 'var(--font-title)', fontWeight: 700,
            fontSize: 16, color: 'var(--teal)', marginBottom: 12,
          }}>
            🎭 Ensayo con Elvis
          </h3>
          <div style={{ display: 'flex', gap: 12 }}>
            {(['start', 'end'] as const).map(f => {
              const ensayo = (dayState.ensayo ?? { start: '', end: '' }) as EnsayoState;
              return (
                <div key={f} style={{ flex: 1 }}>
                  <label style={{
                    fontSize: 12, color: 'var(--ink-soft)',
                    fontWeight: 600, display: 'block', marginBottom: 4,
                  }}>
                    {f === 'start' ? 'Inicio' : 'Término'}
                  </label>
                  <input
                    type="time"
                    value={ensayo[f]}
                    onChange={e => handleEnsayo(f, e.target.value)}
                    style={INPUT}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Notes — weekdays only */}
        {isWeekday && (
          <div style={{
            background: 'var(--yellow-soft)', borderRadius: 18,
            padding: 16, marginBottom: 20,
          }}>
            <h3 style={{
              fontFamily: 'var(--font-title)', fontWeight: 700,
              fontSize: 16, color: 'var(--yellow)', marginBottom: 10,
            }}>
              📝 ¿Qué estudió Carlita hoy?
            </h3>
            <textarea
              value={(dayState.notes as string) ?? ''}
              onChange={e => handleNotes(e.target.value)}
              onBlur={e => handleNotes(e.target.value)}
              placeholder="Escribe aquí lo que estudió..."
              rows={3}
              style={{ ...INPUT, resize: 'vertical' }}
            />
          </div>
        )}

        <GoldenRules />
      </div>
    </div>
  );
}
