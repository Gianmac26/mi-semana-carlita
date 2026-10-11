'use client';
import { useMemo } from 'react';
import {
  DAY_KEYS, DAY_LABELS, DayKey, EMPTY_SET,
  completedIdsByDay, getDayCompletion, getSkippedSlugs, getTasksForDayFromList,
} from '@/lib/tasks';
import type { DbTask, TaskCompletion, WeekData } from '@/lib/types';

interface Props {
  weekKey: string;
  weekData: WeekData;
  tasks: DbTask[];
  /** Completions del hijo activo; se filtran por weekKey. */
  completions: TaskCompletion[];
  selected: DayKey;
  onSelect: (d: DayKey) => void;
  todayKey: string;
}

export default function DayChips({ weekKey, weekData, tasks, completions, selected, onSelect, todayKey }: Props) {
  const doneByDay = useMemo(() => completedIdsByDay(completions, weekKey), [completions, weekKey]);

  return (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '0 2px 6px' }}>
      {DAY_KEYS.map(day => {
        const dayTasks = getTasksForDayFromList(tasks, day);
        const pct = getDayCompletion(
          doneByDay.get(day) ?? EMPTY_SET,
          getSkippedSlugs(weekData[day] as Record<string, unknown> | undefined),
          dayTasks,
        );
        const isToday = day === todayKey;
        const isSel = selected === day;
        const dotColor = !dayTasks.length
          ? 'var(--line)'
          : pct === 100 ? 'var(--ok)'
          : pct > 0 ? 'var(--yellow)'
          : 'var(--line)';

        return (
          <button
            key={day}
            onClick={() => onSelect(day)}
            style={{
              flexShrink: 0,
              background: isSel ? 'var(--accent)' : isToday ? 'var(--accent-soft)' : 'var(--bg-card)',
              color: isSel ? 'var(--on-accent)' : isToday ? 'var(--accent)' : 'var(--ink-soft)',
              border: isToday && !isSel ? '2px solid var(--accent)' : '2px solid var(--line)',
              borderRadius: 12, padding: '8px 12px',
              fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 14,
              cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              transition: 'all 0.15s',
            }}
          >
            {DAY_LABELS[day]}
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: isSel ? 'rgba(255,255,255,0.7)' : dotColor,
              display: 'block',
            }} />
          </button>
        );
      })}
    </div>
  );
}
