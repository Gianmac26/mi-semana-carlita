'use client';
import { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { DbTask, InviteCode, MiMundo } from '@/lib/types';

interface Props {
  familyId: string;
  tasks: DbTask[];
  onTasksChange: (tasks: DbTask[]) => void;
}

type Section = 'tasks' | 'invites' | 'mundo';

const supabase = createBrowserClient();

const RESERVED_SLUGS = new Set(['ensayo', 'notes', 'skipped']);

function slugify(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 30);
}

const CARD: React.CSSProperties = {
  background: 'var(--bg-card)', borderRadius: 14,
  border: '1.5px solid var(--line)', padding: '12px 14px', marginBottom: 10,
};
const INPUT: React.CSSProperties = {
  padding: '8px 10px', borderRadius: 10, border: '1.5px solid var(--line)',
  background: 'var(--bg-card)', color: 'var(--ink)',
  fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none',
};

const MundoPrompts = [
  { key: 'padres',   title: '🫶 Con mis papás' },
  { key: 'cancion',  title: '🎵 Canción favorita' },
  { key: 'risa',     title: '😂 Lo que me hizo reír' },
  { key: 'aprendi',  title: '🌱 Algo que aprendí' },
  { key: 'preocupa', title: '💭 Me preocupa...' },
  { key: 'meta',     title: '🎯 Mi meta del mes' },
  { key: 'pedido',   title: '💌 Le pediría a mis papás...' },
];

export default function AdminTab({ familyId, tasks, onTasksChange }: Props) {
  const [section, setSection] = useState<Section>('tasks');
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [mundoByAuthor, setMundoByAuthor] = useState<Record<string, { displayName: string; answers: Record<string, string> }>>({});
  const [newTask, setNewTask] = useState({ icon: '', label: '', time: '', day_type: 'weekday' as 'weekday' | 'saturday', skippable: false });
  const [saving, setSaving] = useState(false);
  const [taskError, setTaskError] = useState('');
  const updateTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const pendingPatches = useRef<Record<string, Partial<DbTask>>>({});

  useEffect(() => {
    if (section === 'invites') loadCodes();
    if (section === 'mundo') loadMundo();
  }, [section, familyId]);

  async function loadCodes() {
    const { data } = await supabase
      .from('invite_codes').select('id, code, role, expires_at, used_by')
      .eq('family_id', familyId).is('used_by', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
    setCodes((data as InviteCode[]) ?? []);
  }

  async function loadMundo() {
    const { data: entries } = await supabase
      .from('mi_mundo_entries').select('key, value, author_id').eq('family_id', familyId);
    if (!entries || entries.length === 0) { setMundoByAuthor({}); return; }
    const authorIds = [...new Set(entries.map(e => e.author_id as string))];
    const { data: profiles } = await supabase
      .from('profiles').select('id, display_name').in('id', authorIds);
    const nameMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.display_name as string]));
    const grouped: Record<string, { displayName: string; answers: Record<string, string> }> = {};
    for (const row of entries) {
      if (!grouped[row.author_id]) {
        grouped[row.author_id] = { displayName: nameMap[row.author_id] ?? 'Hijo/a', answers: {} };
      }
      grouped[row.author_id].answers[row.key] = row.value;
    }
    setMundoByAuthor(grouped);
  }

  async function generateCode(role: 'padre' | 'hijo') {
    const res = await fetch('/api/invite', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    if (res.ok) loadCodes();
  }

  async function revokeCode(id: string) {
    await supabase.from('invite_codes').delete().eq('id', id);
    setCodes(prev => prev.filter(c => c.id !== id));
  }

  async function addTask() {
    if (!newTask.icon.trim() || !newTask.label.trim()) return;
    const slug = slugify(newTask.label);
    if (RESERVED_SLUGS.has(slug)) {
      setTaskError('Ese nombre está reservado (ensayo, notas, saltado). Elige otro nombre.');
      return;
    }
    setSaving(true);
    setTaskError('');
    const maxOrder = tasks.filter(t => t.day_type === newTask.day_type).reduce((m, t) => Math.max(m, t.sort_order), -1);
    const { data } = await supabase
      .from('tasks').insert({
        family_id: familyId, slug, day_type: newTask.day_type,
        icon: newTask.icon.trim(), label: newTask.label.trim(),
        time: newTask.time.trim(), skippable: newTask.skippable,
        sort_order: maxOrder + 1, active: true,
      }).select().single();
    if (data) onTasksChange([...tasks, data as DbTask].sort((a, b) => a.sort_order - b.sort_order));
    else setTaskError('Error al guardar la tarea. Intenta de nuevo.');
    setNewTask({ icon: '', label: '', time: '', day_type: 'weekday', skippable: false });
    setSaving(false);
  }

  function updateTask(id: string, patch: Partial<DbTask>) {
    onTasksChange(tasks.map(t => t.id === id ? { ...t, ...patch } : t));
    pendingPatches.current[id] = { ...pendingPatches.current[id], ...patch };
    if (updateTimers.current[id]) clearTimeout(updateTimers.current[id]);
    updateTimers.current[id] = setTimeout(async () => {
      const merged = pendingPatches.current[id];
      delete pendingPatches.current[id];
      if (merged) await supabase.from('tasks').update(merged).eq('id', id);
    }, 600);
  }

  async function deleteTask(id: string) {
    await supabase.from('tasks').update({ active: false }).eq('id', id);
    onTasksChange(tasks.filter(t => t.id !== id));
  }

  const weekdayTasks = tasks.filter(t => t.day_type === 'weekday');
  const saturdayTasks = tasks.filter(t => t.day_type === 'saturday');

  return (
    <div>
      <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 17, color: 'var(--pink)', marginBottom: 16 }}>
        ⚙️ Admin
      </h3>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {([['tasks', '📋 Tareas'], ['invites', '🔑 Invitaciones'], ['mundo', '💜 Mi mundo']] as [Section, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setSection(key)}
            style={{ flex: 1, padding: '9px 0', borderRadius: 12, border: `1.5px solid ${section === key ? 'var(--pink)' : 'var(--line)'}`, background: section === key ? 'var(--pink)' : 'var(--bg-card)', color: section === key ? '#fff' : 'var(--ink-soft)', fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
            {label}
          </button>
        ))}
      </div>

      {section === 'tasks' && (
        <div>
          {[{ label: 'Lun–Vie', list: weekdayTasks, type: 'weekday' as const }, { label: 'Sábado', list: saturdayTasks, type: 'saturday' as const }].map(({ label, list, type }) => (
            <div key={type} style={{ marginBottom: 24 }}>
              <h4 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 14, color: 'var(--ink-soft)', marginBottom: 10 }}>{label}</h4>
              {list.map(task => (
                <div key={task.id} style={{ ...CARD, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input value={task.icon} onChange={e => updateTask(task.id, { icon: e.target.value })} style={{ ...INPUT, width: 44, textAlign: 'center', fontSize: 18 }} />
                  <input value={task.label} onChange={e => updateTask(task.id, { label: e.target.value })} style={{ ...INPUT, flex: 1, minWidth: 120 }} />
                  <input value={task.time} onChange={e => updateTask(task.id, { time: e.target.value })} placeholder="hora" style={{ ...INPUT, width: 90 }} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--ink-soft)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={task.skippable} onChange={e => updateTask(task.id, { skippable: e.target.checked })} />
                    Saltable
                  </label>
                  <button onClick={() => deleteTask(task.id)} style={{ background: 'transparent', border: 'none', color: 'var(--ink-soft)', cursor: 'pointer', fontSize: 16, padding: 4 }}>🗑</button>
                </div>
              ))}
            </div>
          ))}
          <div style={{ background: 'var(--pink-soft)', borderRadius: 16, padding: 14, marginTop: 8 }}>
            <h4 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 13, color: 'var(--pink)', marginBottom: 12 }}>Nueva tarea</h4>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <input value={newTask.icon} onChange={e => setNewTask(p => ({ ...p, icon: e.target.value }))} placeholder="🌟" style={{ ...INPUT, width: 44, textAlign: 'center', fontSize: 18 }} />
              <input value={newTask.label} onChange={e => setNewTask(p => ({ ...p, label: e.target.value }))} placeholder="Nombre de la tarea" style={{ ...INPUT, flex: 1, minWidth: 120 }} />
              <input value={newTask.time} onChange={e => setNewTask(p => ({ ...p, time: e.target.value }))} placeholder="hora (ej: 8:00 pm)" style={{ ...INPUT, width: 120 }} />
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink-soft)', cursor: 'pointer' }}>
                <input type="radio" checked={newTask.day_type === 'weekday'} onChange={() => setNewTask(p => ({ ...p, day_type: 'weekday' }))} /> Lun–Vie
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink-soft)', cursor: 'pointer' }}>
                <input type="radio" checked={newTask.day_type === 'saturday'} onChange={() => setNewTask(p => ({ ...p, day_type: 'saturday' }))} /> Sábado
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink-soft)', cursor: 'pointer' }}>
                <input type="checkbox" checked={newTask.skippable} onChange={e => setNewTask(p => ({ ...p, skippable: e.target.checked }))} /> Saltable
              </label>
            </div>
            <button onClick={addTask} disabled={saving || !newTask.icon.trim() || !newTask.label.trim()}
              style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: 'var(--pink)', color: '#fff', fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Guardando...' : 'Agregar tarea'}
            </button>
            {taskError && <p style={{ color: 'var(--error, #e53e3e)', fontSize: 13, marginTop: 6 }}>{taskError}</p>}
          </div>
        </div>
      )}

      {section === 'invites' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <button onClick={() => generateCode('hijo')} style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: 'var(--pink)', color: '#fff', fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              + Código para hijo/a
            </button>
            <button onClick={() => generateCode('padre')} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid var(--pink)', background: 'var(--pink-soft)', color: 'var(--pink)', fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              + Código para papá/mamá
            </button>
          </div>
          {codes.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--ink-soft)', fontStyle: 'italic', padding: '20px 0' }}>No hay códigos activos.</p>
          ) : codes.map(c => (
            <div key={c.id} style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 22, letterSpacing: 4, color: 'var(--ink)' }}>{c.code}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>
                  {c.role === 'padre' ? 'Para papá/mamá' : 'Para hijo/a'} · vence {new Date(c.expires_at).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <button onClick={() => revokeCode(c.id)} style={{ background: 'var(--line)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'var(--ink-soft)', fontSize: 12, fontWeight: 700 }}>Revocar</button>
            </div>
          ))}
        </div>
      )}

      {section === 'mundo' && (
        <div>
          <p style={{ color: 'var(--ink-soft)', fontSize: 13, marginBottom: 16, fontStyle: 'italic' }}>Solo lectura — solo tu hijo/a puede editar esto.</p>
          {Object.keys(mundoByAuthor).length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--ink-soft)', fontStyle: 'italic', padding: '20px 0' }}>
              Tu hijo/a todavía no ha escrito nada.
            </p>
          ) : Object.values(mundoByAuthor).map(({ displayName, answers }) => (
            <div key={displayName} style={{ marginBottom: 24 }}>
              {Object.keys(mundoByAuthor).length > 1 && (
                <h4 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 13, color: 'var(--pink)', marginBottom: 10 }}>
                  {displayName}
                </h4>
              )}
              {MundoPrompts.map(p => (
                <div key={p.key} style={{ ...CARD }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink-soft)', marginBottom: 6 }}>{p.title}</div>
                  <div style={{ fontSize: 14, color: answers[p.key] ? 'var(--ink)' : 'var(--ink-soft)', fontStyle: answers[p.key] ? 'normal' : 'italic' }}>
                    {answers[p.key] || '(sin responder todavía)'}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
