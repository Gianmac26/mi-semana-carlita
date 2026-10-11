'use client';
import { useMemo, useState } from 'react';
import { AppState, DayState } from '@/lib/types';
import type { DbTask, TaskCompletion } from '@/lib/types';
import { DAY_KEYS, DayKey, getDayCompletion, getSkippedSlugs, getTasksForDayFromList } from '@/lib/tasks';
import { getMondayOfWeek, formatWeekKey, getTodayDayKey } from '@/lib/utils';
import WeekSelector from './WeekSelector';
import DayChips from './DayChips';
import TaskItem from './TaskItem';

interface Props {
  weeks: AppState['weeks'];
  tasks: DbTask[];
  /** Completions del hijo activo (todas las semanas cargadas); se filtran por la semana visible. */
  completions: TaskCompletion[];
  role: 'padre' | 'hijo';
  onChange: (weekKey: string, day: string, dayState: DayState) => void;
  onToggleTask: (taskId: string, weekKey: string, day: DayKey, currentlyDone: boolean) => void;
  onOpenDetail: (task: DbTask, weekKey: string, day: DayKey) => void;
  childDisplayName?: string;
  rulesSlot?: React.ReactNode;
}

const DAY_LABELS: Record<string, string> = { mon: 'Lunes', tue: 'Martes', wed: 'Miércoles', thu: 'Jueves', fri: 'Viernes', sat: 'Sábado', sun: 'Domingo' };

const INPUT: React.CSSProperties = {
  width: '100%', padding: '9px 11px', borderRadius: 10,
  border: '1.5px solid var(--line)', background: 'var(--bg-card)',
  color: 'var(--ink)', fontFamily: 'var(--font-body)', fontSize: 15,
  outline: 'none',
};

export default function WeekTab({
  weeks, tasks, completions, role, onChange, onToggleTask, onOpenDetail, childDisplayName, rulesSlot,
}: Props) {
  const todayKey = getTodayDayKey();
  const [monday, setMonday] = useState<Date>(() => getMondayOfWeek(new Date()));
  const [selectedDay, setSelectedDay] = useState<DayKey>(() => {
    const t = getTodayDayKey();
    return (DAY_KEYS.includes(t as DayKey) ? t : 'mon') as DayKey;
  });

  const weekKey  = formatWeekKey(monday);
  const weekData = weeks[weekKey] ?? {};
  const dayState = (weekData[selectedDay] ?? {}) as DayState;
  const dayTasks = getTasksForDayFromList(tasks, selectedDay);
  const isWeekday = !['sat', 'sun'].includes(selectedDay);

  // Clave `${task_id}__${day}` → acceso O(1). Solo la semana visible.
  const completionsMap = useMemo(() => {
    const map = new Map<string, TaskCompletion>();
    for (const c of completions) {
      if (c.week_key === weekKey) map.set(`${c.task_id}__${c.day}`, c);
    }
    return map;
  }, [completions, weekKey]);

  const skippedMap = (dayState.skipped ?? {}) as Record<string, boolean>;
  const pct = getDayCompletion(
    new Set(dayTasks.filter(t => completionsMap.has(`${t.id}__${selectedDay}`)).map(t => t.id)),
    getSkippedSlugs(dayState as Record<string, unknown>),
    dayTasks,
  );

  const updateDay = (patch: Partial<DayState>) => {
    onChange(weekKey, selectedDay, { ...dayState, ...patch } as DayState);
  };

  const toggleSkip = (id: string) => {
    const prev = (dayState.skipped ?? {}) as Record<string, boolean>;
    updateDay({ skipped: { ...prev, [id]: !prev[id] } });
  };

  const handleNotes = (val: string) => updateDay({ notes: val });

  const notesHeader = childDisplayName
    ? `¿Qué estudió ${childDisplayName} hoy?`
    : '¿Qué estudió hoy?';

  return (
    <div>
      <WeekSelector monday={monday} onChange={setMonday} />
      <DayChips
        weekKey={weekKey}
        weekData={weekData}
        tasks={tasks}
        completions={completions}
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
              const skipped = !!skippedMap[task.slug];
              const completion = completionsMap.get(`${task.id}__${selectedDay}`) ?? null;
              return (
                <TaskItem
                  key={task.slug}
                  task={task}
                  completion={completion}
                  skipped={skipped}
                  role={role}
                  onToggle={() => onToggleTask(task.id, weekKey, selectedDay, completion !== null)}
                  onSkip={() => toggleSkip(task.slug)}
                  onOpenDetail={() => onOpenDetail(task, weekKey, selectedDay)}
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
                    border: 'none', background: 'var(--accent)', color: 'var(--on-accent)',
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
            🌴 Domingo libre — ¡descansa!
          </div>
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
              📝 {notesHeader}
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

        {rulesSlot}
      </div>
    </div>
  );
}
