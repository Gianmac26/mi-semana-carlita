'use client';
import { DAY_KEYS, DAY_LABELS, DayKey, getDayCompletion, getTasksForDay } from '@/lib/tasks';
import { WeekData } from '@/lib/types';

interface Props {
  weekData: WeekData;
  selected: DayKey;
  onSelect: (d: DayKey) => void;
  todayKey: string;
}

export default function DayChips({ weekData, selected, onSelect, todayKey }: Props) {
  return (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '0 2px 6px' }}>
      {DAY_KEYS.map(day => {
        const pct = getDayCompletion(weekData[day] as Record<string, unknown>, day);
        const tasks = getTasksForDay(day);
        const isToday = day === todayKey;
        const isSel = selected === day;
        const dotColor = !tasks.length
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
              background: isSel ? 'var(--pink)' : isToday ? 'var(--pink-soft)' : 'var(--bg-card)',
              color: isSel ? '#fff' : isToday ? 'var(--pink)' : 'var(--ink-soft)',
              border: isToday && !isSel ? '2px solid var(--pink)' : '2px solid var(--line)',
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
