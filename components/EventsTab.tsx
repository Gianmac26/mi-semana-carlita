'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { formatEventDate } from '@/lib/utils';

interface DbEvent { id: string; date: string; time: string; label: string }
interface Props { familyId: string; role: 'padre' | 'hijo' }

const supabase = createBrowserClient();

const INPUT: React.CSSProperties = {
  width: '100%', padding: '9px 11px', borderRadius: 10,
  border: '1.5px solid var(--line)', background: 'var(--bg-card)',
  color: 'var(--ink)', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none',
};
const LABEL: React.CSSProperties = {
  fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600, display: 'block', marginBottom: 4,
};

export default function EventsTab({ familyId, role }: Props) {
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [date,  setDate]   = useState('');
  const [time,  setTime]   = useState('');
  const [label, setLabel]  = useState('');

  useEffect(() => {
    supabase
      .from('events').select('id, date, time, label')
      .eq('family_id', familyId).order('date', { ascending: true })
      .then(({ data }) => setEvents((data as DbEvent[]) ?? []));
  }, [familyId]);

  const canAdd = role === 'padre' && date.trim() !== '' && label.trim() !== '';

  const addEvent = async () => {
    if (!canAdd) return;
    const { data } = await supabase
      .from('events').insert({ family_id: familyId, date, time, label: label.trim() })
      .select('id, date, time, label').single();
    if (data) {
      setEvents(prev => [...prev, data as DbEvent]);
      setDate(''); setTime(''); setLabel('');
    }
  };

  const removeEvent = async (id: string) => {
    await supabase.from('events').delete().eq('id', id);
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const sorted = [...events].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  return (
    <div>
      <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 17, color: 'var(--pink)', marginBottom: 16 }}>
        🎈 Divertikids — Próximos eventos
      </h3>

      {role === 'padre' && (
        <div style={{ background: 'var(--pink-soft)', borderRadius: 18, padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div><label style={LABEL}>Fecha</label><input type="date" value={date} onChange={e => setDate(e.target.value)} style={INPUT} /></div>
            <div><label style={LABEL}>Hora</label><input type="time" value={time} onChange={e => setTime(e.target.value)} style={INPUT} /></div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={LABEL}>¿Qué es?</label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addEvent()}
              placeholder="Ej: Cumpleaños de Sofi 🎂" style={INPUT} />
          </div>
          <button onClick={addEvent} disabled={!canAdd}
            style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: canAdd ? 'var(--pink)' : 'var(--line)', color: canAdd ? '#fff' : 'var(--ink-soft)', fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 15, cursor: canAdd ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}>
            Agregar evento
          </button>
        </div>
      )}

      {sorted.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--ink-soft)', fontStyle: 'italic', padding: '24px 0' }}>Aún no hay eventos agregados.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sorted.map(ev => (
            <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-card)', borderRadius: 14, border: '1.5px solid var(--line)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{ev.label}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>{formatEventDate(ev.date)}{ev.time ? ` · ${ev.time}` : ''}</div>
              </div>
              {role === 'padre' && (
                <button onClick={() => removeEvent(ev.id)} style={{ background: 'var(--line)', border: 'none', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', color: 'var(--ink-soft)', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>✕</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
