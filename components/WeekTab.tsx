'use client';
import { useState, useEffect } from 'react';
import { AppState, DayState, EnsayoState } from '@/lib/types';
import type { DbTask } from '@/lib/types';
import { DAY_KEYS, DayKey, getTasksForDayFromList, getDayCompletion } from '@/lib/tasks';
import { getMondayOfWeek, formatWeekKey, getTodayDayKey } from '@/lib/utils';
import WeekSelector from './WeekSelector';
import DayChips from './DayChips';
import TaskItem from './TaskItem';
import GoldenRules from './GoldenRules';

interface Props {
  weeks: AppState['weeks'];
  tasks: DbTask[];
  onChange: (weekKey: string, day: string, dayState: DayState) => void;
}

const INPUT: React.CSSProperties = {
  width: '100%', padding: '9px 11px', borderRadius: 10,
  border: '1.5px solid var(--line)', background: 'var(--bg-card)',
  color: 'var(--ink)', fontFamily: 'var(--font-body)', fontSize: 15,
  outline: 'none',
};

export default function WeekTab({ weeks, tasks, onChange }: Props) {
  const todayKey = getTodayDayKey();
  const [monday, setMonday] = useState<Date>(() => getMondayOfWeek(new Date()));
  const [selectedDay, setSelectedDay] = useState<DayKey>(() => {
    const t = getTodayDayKey();
    return (DAY_KEYS.includes(t as DayKey) ? t : 'mon') as DayKey;
  });
  const [showEnsayo, setShowEnsayo] = useState<boolean>(false);
  useEffect(() => { setShowEnsayo(false); }, [selectedDay]);

  const weekKey  = formatWeekKey(monday);
  const weekData = weeks[weekKey] ?? {};
  const dayState = (weekData[selectedDay] ?? {}) as DayState;
  const dayTasks = getTasksForDayFromList(tasks, selectedDay);
  const pct      = getDayCompletion(dayState as Record<string, unknown>, dayTasks);
  const isWeekday = !['sat', 'sun'].includes(selectedDay);

  const ensayo = (dayState.ensayo ?? { start: '', end: '' }) as EnsayoState;
  const hasEnsayoData = !!(ensayo.start || ensayo.end);

  const updateDay = (patch: Partial<DayState>) => {
    onChange(weekKey, selectedDay, { ...dayState, ...patch } as DayState);
  };

  const toggleTask = (id: string) => updateDay({ [id]: !dayState[id] });

  const toggleSkip = (id: string) => {
    const prev = (dayState.skipped ?? {}) as Record<string, boolean>;
    updateDay({ skipped: { ...prev, [id]: !prev[id] } });
  };

  const handleNotes = (val: string) => updateDay({ notes: val });

  const handleEnsayo = (field: 'start' | 'end', val: string) => {
    const prev = (dayState.ensayo ?? { start: '', end: '' }) as EnsayoState;
    updateDay({ ensayo: { ...prev, [field]: val } });
  };

  return (
    <div>
      <WeekSelector monday={monday} onChange={setMonday} />
      <DayChips
        weekData={weekData}
        tasks={tasks}
        selected={selectedDay}
        onSelect={setSelectedDay}
        todayKey={todayKey}
      />

      <div style={{ marginTop: 20 }}>
        {/* Tasks */}
        {dayTasks.length > 0 ? (
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
            {dayTasks.map(task => {
              const skipped = !!((dayState.skipped as Record<string,boolean> | undefined)?.[task.slug]);
              return (
                <TaskItem
                  key={task.slug}
                  task={task}
                  checked={!!dayState[task.slug]}
                  skipped={skipped}
                  onToggle={() => toggleTask(task.slug)}
                  onSkip={() => toggleSkip(task.slug)}
                />
              );
            })}
          </div>
        ) : selectedDay !== 'sun' && (() => {
          const otherDay = DAY_KEYS.filter(d => d !== selectedDay && d !== 'sun')
            .find(d => getTasksForDayFromList(tasks, d).length > 0);
          return (
            <div style={{
              background: 'var(--bg-card)', borderRadius: 16,
              border: '1.5px dashed var(--line)', padding: '20px 16px',
              marginBottom: 20, textAlign: 'center',
            }}>
              <p style={{ color: 'var(--ink-soft)', fontSize: 14, margin: 0 }}>
                📋 Sin tareas para este día.
                {otherDay && (
                  <><br /><span style={{ fontSize: 13 }}>Hay tareas en otros días de la semana.</span></>
                )}
              </p>
              {otherDay && (
                <button
                  onClick={() => setSelectedDay(otherDay)}
                  style={{
                    marginTop: 10, padding: '7px 16px', borderRadius: 10,
                    border: 'none', background: 'var(--pink)', color: '#fff',
                    fontFamily: 'var(--font-title)', fontWeight: 700,
                    fontSize: 13, cursor: 'pointer',
                  }}
                >
                  Ver tareas del {DAY_LABELS[otherDay]}
                </button>
              )}
            </div>
          );
        })()}

        {selectedDay === 'sun' && (
          <div style={{
            textAlign: 'center', padding: '32px 0',
            color: 'var(--ink-soft)', fontStyle: 'italic', fontSize: 15,
          }}>
            🌴 Domingo libre — ¡descansa, Carlita!
          </div>
        )}

        {/* Ensayo — visible only when data exists or user opens it */}
        {(hasEnsayoData || showEnsayo) ? (
          <div style={{
            background: 'var(--teal-soft)', borderRadius: 18,
            padding: 16, marginBottom: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{
                fontFamily: 'var(--font-title)', fontWeight: 700,
                fontSize: 16, color: 'var(--teal)', margin: 0,
              }}>
                🎭 Ensayo con Elvis
              </h3>
              {!hasEnsayoData && (
                <button
                  onClick={() => setShowEnsayo(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)', fontSize: 18, lineHeight: 1, padding: 2 }}
                  title="Cerrar"
                >×</button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {(['start', 'end'] as const).map(f => (
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
              ))}
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowEnsayo(true)}
            style={{
              width: '100%', padding: '10px 14px', marginBottom: 12,
              background: 'var(--teal-soft)', borderRadius: 18,
              border: '1.5px dashed var(--teal)', cursor: 'pointer',
              color: 'var(--teal)', fontFamily: 'var(--font-title)',
              fontWeight: 600, fontSize: 14, textAlign: 'left',
            }}
          >
            🎭 Registrar ensayo con Elvis
          </button>
        )}

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
