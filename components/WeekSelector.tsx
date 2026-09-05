'use client';
import { formatDateRange } from '@/lib/utils';

interface Props {
  monday: Date;
  onChange: (monday: Date) => void;
}

export default function WeekSelector({ monday, onChange }: Props) {
  const go = (dir: number) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + dir * 7);
    onChange(d);
  };
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 12, margin: '16px 0',
    }}>
      <button onClick={() => go(-1)} style={btnStyle}>‹</button>
      <span style={{
        fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 15,
        color: 'var(--ink-soft)', textAlign: 'center',
      }}>
        Semana del {formatDateRange(monday)}
      </span>
      <button onClick={() => go(1)} style={btnStyle}>›</button>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: 'var(--pink-soft)', border: 'none', borderRadius: 8,
  width: 32, height: 32, fontSize: 20, cursor: 'pointer',
  color: 'var(--pink)', fontWeight: 700,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
};
