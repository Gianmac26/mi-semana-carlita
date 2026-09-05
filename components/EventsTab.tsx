'use client';
import { useState } from 'react';
import { AppState, AppEvent } from '@/lib/types';
import { generateId, formatEventDate } from '@/lib/utils';

interface Props {
  state: AppState;
  onChange: (s: AppState) => void;
}

const INPUT: React.CSSProperties = {
  width: '100%', padding: '9px 11px', borderRadius: 10,
  border: '1.5px solid var(--line)', background: 'var(--bg-card)',
  color: 'var(--ink)', fontFamily: 'var(--font-body)', fontSize: 14,
  outline: 'none',
};

const LABEL: React.CSSProperties = {
  fontSize: 12, color: 'var(--ink-soft)',
  fontWeight: 600, display: 'block', marginBottom: 4,
};

export default function EventsTab({ state, onChange }: Props) {
  const [date,  setDate]  = useState('');
  const [time,  setTime]  = useState('');
  const [label, setLabel] = useState('');

  const events = [...(state.events ?? [])].sort(
    (a, b) => (a.date + a.time).localeCompare(b.date + b.time)
  );

  const canAdd = date.trim() !== '' && label.trim() !== '';

  const addEvent = () => {
    if (!canAdd) return;
    const ev: AppEvent = { id: generateId(), date, time, label: label.trim() };
    onChange({ ...state, events: [...(state.events ?? []), ev] });
    setDate(''); setTime(''); setLabel('');
  };

  const removeEvent = (id: string) => {
    onChange({ ...state, events: (state.events ?? []).filter(e => e.id !== id) });
  };

  return (
    <div>
      <h3 style={{
        fontFamily: 'var(--font-title)', fontWeight: 700,
        fontSize: 17, color: 'var(--pink)', marginBottom: 16,
      }}>
        🎈 Divertikids — Próximos eventos
      </h3>

      {/* Form */}
      <div style={{
        background: 'var(--pink-soft)', borderRadius: 18,
        padding: 16, marginBottom: 20,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <label style={LABEL}>Fecha</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={INPUT} />
          </div>
          <div>
            <label style={LABEL}>Hora</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} style={INPUT} />
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={LABEL}>¿Qué es?</label>
          <input
            type="text"
            value={label}
            onChange={e => setLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addEvent()}
            placeholder="Ej: Cumpleaños de Sofi 🎂"
            style={INPUT}
          />
        </div>
        <button
          onClick={addEvent}
          disabled={!canAdd}
          style={{
            width: '100%', padding: '12px', borderRadius: 12, border: 'none',
            background: canAdd ? 'var(--pink)' : 'var(--line)',
            color: canAdd ? '#fff' : 'var(--ink-soft)',
            fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 15,
            cursor: canAdd ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s',
          }}
        >
          Agregar evento
        </button>
      </div>

      {/* List */}
      {events.length === 0 ? (
        <p style={{
          textAlign: 'center', color: 'var(--ink-soft)',
          fontStyle: 'italic', padding: '24px 0',
        }}>
          Aún no hay eventos agregados.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {events.map(ev => (
            <div
              key={ev.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', background: 'var(--bg-card)',
                borderRadius: 14, border: '1.5px solid var(--line)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>
                  {ev.label}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>
                  {formatEventDate(ev.date)}{ev.time ? ` · ${ev.time}` : ''}
                </div>
              </div>
              <button
                onClick={() => removeEvent(ev.id)}
                style={{
                  background: 'var(--line)', border: 'none', borderRadius: 8,
                  width: 28, height: 28, cursor: 'pointer',
                  color: 'var(--ink-soft)', fontSize: 14, fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
