'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { MiMundoEntry, MiMundoHistory } from '@/lib/types';
import { getMondayOfWeek, formatWeekKey } from '@/lib/utils';

interface Props { familyId: string; role: string; }

interface PromptDef {
  key: string;
  emoji: string;
  title: string;
  placeholder: string;
  color: string;
  colorSoft: string;
}

const PROMPTS: PromptDef[] = [
  { key: 'padres',   emoji: '🫶', title: 'Lo que me gustaría hacer con mis papás',
    placeholder: 'Un viaje, una película, una tarde juntos... lo que sea que quieras compartir con ellos.',
    color: 'var(--accent)', colorSoft: 'var(--accent-soft)' },
  { key: 'cancion',  emoji: '🎵', title: 'La canción que más me gusta ahora',
    placeholder: 'Artista, nombre de la canción, y si quieres cuenta por qué te llegó...',
    color: 'var(--lilac)', colorSoft: 'var(--lilac-soft)' },
  { key: 'risa',     emoji: '😂', title: 'Lo que más me hizo reír esta semana',
    placeholder: 'Un momento, una conversación, algo que pasó... cuéntalo aquí.',
    color: 'var(--yellow)', colorSoft: 'var(--yellow-soft)' },
  { key: 'aprendi',  emoji: '🌱', title: 'Algo que aprendí esta semana — de la vida, no del cole',
    placeholder: 'Puede ser algo pequeño. A veces las cosas más simples enseñan más.',
    color: 'var(--teal)', colorSoft: 'var(--teal-soft)' },
  { key: 'preocupa', emoji: '💭', title: 'Algo que me da vueltas en la cabeza',
    placeholder: 'No tiene que ser grave. Si algo te preocupa o te pesa, aquí puedes escribirlo.',
    color: 'var(--lilac)', colorSoft: 'var(--lilac-soft)' },
  { key: 'meta',     emoji: '🎯', title: 'Una meta que tengo para este mes',
    placeholder: 'Puede ser del cole, del baile, personal... algo concreto que quieras lograr.',
    color: 'var(--teal)', colorSoft: 'var(--teal-soft)' },
  { key: 'pedido',   emoji: '💌', title: 'Si pudiera pedirle algo a mis papás, sería...',
    placeholder: 'Escríbelo con confianza. Esto también lo leen ellos.',
    color: 'var(--accent)', colorSoft: 'var(--accent-soft)' },
];

function formatWeek(weekKey: string): string {
  const d = new Date(weekKey + 'T12:00:00Z');
  return 'Semana del ' + new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short' }).format(d);
}

function getCurrentWeekKey() {
  return formatWeekKey(getMondayOfWeek(new Date()));
}

type AuthorData = { displayName: string; history: MiMundoHistory };

export default function MiMundoTab({ familyId, role }: Props) {
  const [supabase] = useState(() => createBrowserClient());

  // ── Hijo state ──────────────────────────────────────────────────────────────
  const [userId,     setUserId]     = useState<string | null>(null);
  const [history,    setHistory]    = useState<MiMundoHistory>({});
  const [drafts,     setDrafts]     = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({});
  const [expanded,   setExpanded]   = useState<Set<string>>(new Set());
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [editDraft,  setEditDraft]  = useState('');

  // ── Padre state ──────────────────────────────────────────────────────────────
  const [mundoByAuthor,  setMundoByAuthor]  = useState<Record<string, AuthorData>>({});
  const [expandedPadre,  setExpandedPadre]  = useState<Set<string>>(new Set());

  useEffect(() => {
    if (role === 'padre') loadPadre();
    else loadHijo();
  }, [familyId, role]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Load ──────────────────────────────────────────────────────────────────

  async function loadHijo() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    const { data } = await supabase
      .from('mi_mundo_entries')
      .select('id, family_id, author_id, key, value, week_key, created_at, updated_at')
      .eq('family_id', familyId)
      .eq('author_id', user.id)
      .order('week_key', { ascending: false })
      .limit(84); // 7 keys × up to 12 each
    const grouped: MiMundoHistory = {};
    for (const row of (data ?? [])) {
      if (!grouped[row.key]) grouped[row.key] = [];
      grouped[row.key].push(row as MiMundoEntry);
    }
    setHistory(grouped);
  }

  async function loadPadre() {
    const { data: entries } = await supabase
      .from('mi_mundo_entries')
      .select('id, family_id, author_id, key, value, week_key, created_at, updated_at')
      .eq('family_id', familyId)
      .order('week_key', { ascending: false });
    if (!entries?.length) { setMundoByAuthor({}); return; }
    const authorIds = [...new Set(entries.map(e => e.author_id as string))];
    const { data: profiles } = await supabase
      .from('profiles').select('id, display_name').in('id', authorIds);
    const nameMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.display_name as string]));
    const grouped: Record<string, AuthorData> = {};
    for (const row of entries) {
      if (!grouped[row.author_id])
        grouped[row.author_id] = { displayName: nameMap[row.author_id] ?? 'Hijo/a', history: {} };
      const h = grouped[row.author_id].history;
      if (!h[row.key]) h[row.key] = [];
      h[row.key].push(row as MiMundoEntry);
    }
    setMundoByAuthor(grouped);
  }

  // ─── Hijo actions ──────────────────────────────────────────────────────────

  async function handleSave(key: string) {
    if (!userId || !drafts[key]?.trim()) return;
    setSaveStatus(s => ({ ...s, [key]: 'saving' }));
    try {
      const { error } = await supabase.from('mi_mundo_entries').upsert(
        {
          family_id: familyId,
          author_id: userId,
          key,
          value: drafts[key].trim(),
          week_key: getCurrentWeekKey(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'family_id,author_id,key,week_key' }
      );
      if (error) throw error;
      setDrafts(d => ({ ...d, [key]: '' }));
      setSaveStatus(s => ({ ...s, [key]: 'saved' }));
      await loadHijo();
      setTimeout(() => setSaveStatus(s => ({ ...s, [key]: 'idle' })), 2000);
    } catch {
      setSaveStatus(s => ({ ...s, [key]: 'error' }));
    }
  }

  async function handleUpdate(entry: MiMundoEntry) {
    if (!editDraft.trim()) return;
    await supabase
      .from('mi_mundo_entries')
      .update({ value: editDraft.trim(), updated_at: new Date().toISOString() })
      .eq('id', entry.id);
    setEditingId(null);
    setEditDraft('');
    await loadHijo();
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Borrar esta respuesta?')) return;
    await supabase.from('mi_mundo_entries').delete().eq('id', id);
    await loadHijo();
  }

  function toggleExpanded(key: string) {
    setExpanded(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; });
  }

  function toggleExpandedPadre(combo: string) {
    setExpandedPadre(prev => { const s = new Set(prev); s.has(combo) ? s.delete(combo) : s.add(combo); return s; });
  }

  // ─── PADRE view ─────────────────────────────────────────────────────────────
  if (role === 'padre') {
    return (
      <div>
        <div style={{
          background: 'linear-gradient(135deg, var(--accent-soft), var(--lilac-soft))',
          borderRadius: 20, padding: '18px 20px', marginBottom: 24,
          border: '1.5px solid var(--line)',
        }}>
          <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 20, color: 'var(--accent)', marginBottom: 4 }}>
            💜 Mi mundo
          </h3>
          <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
            Solo lectura — solo tu hijo/a puede editar esto. 🌸
          </p>
        </div>

        {Object.keys(mundoByAuthor).length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--ink-soft)', fontStyle: 'italic', padding: '32px 0' }}>
            Tu hijo/a todavía no ha escrito nada.
          </p>
        ) : Object.entries(mundoByAuthor).map(([authorId, { displayName, history: ah }]) => (
          <div key={authorId} style={{ marginBottom: 32 }}>
            {Object.keys(mundoByAuthor).length > 1 && (
              <h4 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 15, color: 'var(--accent)', marginBottom: 12 }}>
                {displayName}
              </h4>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {PROMPTS.map(p => {
                const entries = ah[p.key] ?? [];
                const latest  = entries[0];
                const combo    = `${authorId}__${p.key}`;
                const isOpen   = expandedPadre.has(combo);
                return (
                  <div key={p.key} style={{
                    borderRadius: 18, overflow: 'hidden',
                    border: '1.5px solid var(--line)', background: 'var(--bg-card)',
                    boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
                  }}>
                    <div style={{ background: p.colorSoft, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 20 }}>{p.emoji}</span>
                      <span style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 13.5, color: p.color, lineHeight: 1.3, flex: 1 }}>
                        {p.title}
                      </span>
                    </div>
                    <div style={{ padding: '12px 16px' }}>
                      {!latest ? (
                        <div style={{ fontSize: 14, color: 'var(--ink-soft)', fontStyle: 'italic' }}>(sin responder todavía)</div>
                      ) : (
                        <>
                          <div style={{ fontSize: 11, color: 'var(--ink-soft)', fontWeight: 600, marginBottom: 4 }}>
                            {formatWeek(latest.week_key)}
                          </div>
                          <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.6 }}>{latest.value}</div>
                          {entries.length > 1 && (
                            <button onClick={() => toggleExpandedPadre(combo)}
                              style={{ marginTop: 10, background: 'none', border: 'none', color: p.color, fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                              {isOpen ? '▲ Ocultar anteriores' : `▼ Ver histórico (${entries.length - 1} más)`}
                            </button>
                          )}
                          {isOpen && (
                            <div style={{ marginTop: 12, borderTop: '1px solid var(--line)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {entries.slice(1).map(e => (
                                <div key={e.id} style={{ borderRadius: 10, background: 'var(--bg)', padding: '8px 12px' }}>
                                  <div style={{ fontSize: 11, color: 'var(--ink-soft)', fontWeight: 600, marginBottom: 3 }}>{formatWeek(e.week_key)}</div>
                                  <div style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.55 }}>{e.value}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ─── HIJO view ──────────────────────────────────────────────────────────────
  const currentWeekKey = getCurrentWeekKey();
  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, var(--accent-soft), var(--lilac-soft))',
        borderRadius: 20, padding: '18px 20px', marginBottom: 24,
        border: '1.5px solid var(--line)',
      }}>
        <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 20, color: 'var(--accent)', marginBottom: 6 }}>
          💜 Mi mundo
        </h3>
        <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
          Este espacio es tuyo. Escribe lo que quieras — tus papás también lo leen,
          así que es una forma bonita de que te conozcan mejor. 🌸
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {PROMPTS.map(p => {
          const entries       = history[p.key] ?? [];
          const thisWeekEntry = entries.find(e => e.week_key === currentWeekKey) ?? null;
          const olderEntries  = entries.filter(e => e.week_key !== currentWeekKey);
          const isExpanded    = expanded.has(p.key);
          const draft         = drafts[p.key] ?? '';
          const status        = saveStatus[p.key] ?? 'idle';

          return (
            <div key={p.key} style={{
              borderRadius: 18, overflow: 'hidden',
              border: '1.5px solid var(--line)', background: 'var(--bg-card)',
              boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
            }}>
              {/* Card header */}
              <div style={{ background: p.colorSoft, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>{p.emoji}</span>
                <span style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 14.5, color: p.color, lineHeight: 1.3 }}>
                  {p.title}
                </span>
              </div>

              {/* Input area */}
              <div style={{ padding: '12px 14px' }}>
                <textarea
                  value={draft}
                  onChange={e => setDrafts(d => ({ ...d, [p.key]: e.target.value }))}
                  placeholder={p.placeholder}
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 12px', boxSizing: 'border-box',
                    borderRadius: 10, border: '1.5px solid var(--line)',
                    background: 'var(--bg)', color: 'var(--ink)',
                    fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.6,
                    outline: 'none', resize: 'vertical',
                  }}
                />

                {/* Save button */}
                <button
                  onClick={() => handleSave(p.key)}
                  disabled={!draft.trim() || status === 'saving'}
                  style={{
                    marginTop: 8, width: '100%', minHeight: 48,
                    borderRadius: 12, border: 'none',
                    background: (!draft.trim() || status === 'saving') ? 'var(--line)' : 'var(--accent)',
                    color:      (!draft.trim() || status === 'saving') ? 'var(--ink-soft)' : 'var(--on-accent)',
                    fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 14,
                    cursor: (!draft.trim() || status === 'saving') ? 'default' : 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  {status === 'saving' ? '⏳ Guardando...' :
                   status === 'saved'  ? '✓ ¡Guardado!' :
                   status === 'error'  ? '⚠ Error — intenta de nuevo' :
                   thisWeekEntry ? 'Actualizar respuesta de esta semana' : 'Guardar respuesta'}
                </button>

                {/* History */}
                {entries.length > 0 ? (
                  <div style={{ marginTop: 12 }}>
                    {/* This week's saved entry */}
                    {thisWeekEntry && (
                      <div style={{ marginBottom: olderEntries.length ? 8 : 0 }}>
                        {editingId === thisWeekEntry.id ? (
                          <InlineEdit
                            value={editDraft} onChange={setEditDraft}
                            onSave={() => handleUpdate(thisWeekEntry)}
                            onCancel={() => { setEditingId(null); setEditDraft(''); }}
                          />
                        ) : (
                          <EntryCard
                            entry={thisWeekEntry}
                            label={`${formatWeek(thisWeekEntry.week_key)} · esta semana`}
                            labelColor={p.color}
                            bg={p.colorSoft}
                            onEdit={() => { setEditingId(thisWeekEntry.id); setEditDraft(thisWeekEntry.value); }}
                            onDelete={() => handleDelete(thisWeekEntry.id)}
                          />
                        )}
                      </div>
                    )}

                    {/* Older entries */}
                    {olderEntries.length > 0 && (
                      <>
                        <button onClick={() => toggleExpanded(p.key)}
                          style={{ background: 'none', border: 'none', color: 'var(--ink-soft)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12.5, cursor: 'pointer', padding: 0 }}>
                          {isExpanded ? '▲ Ocultar anteriores' : `▼ Ver anteriores (${olderEntries.length})`}
                        </button>
                        {isExpanded && (
                          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {olderEntries.map(e => (
                              editingId === e.id ? (
                                <InlineEdit key={e.id}
                                  value={editDraft} onChange={setEditDraft}
                                  onSave={() => handleUpdate(e)}
                                  onCancel={() => { setEditingId(null); setEditDraft(''); }}
                                />
                              ) : (
                                <EntryCard key={e.id}
                                  entry={e}
                                  label={formatWeek(e.week_key)}
                                  labelColor="var(--ink-soft)"
                                  bg="var(--bg)"
                                  border="1px solid var(--line)"
                                  onEdit={() => { setEditingId(e.id); setEditDraft(e.value); }}
                                  onDelete={() => handleDelete(e.id)}
                                />
                              )
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontStyle: 'italic', margin: '8px 0 0' }}>
                    Aún no has respondido esta pregunta antes.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface EntryCardProps {
  entry: MiMundoEntry;
  label: string;
  labelColor: string;
  bg: string;
  border?: string;
  onEdit: () => void;
  onDelete: () => void;
}

function EntryCard({ entry, label, labelColor, bg, border, onEdit, onDelete }: EntryCardProps) {
  return (
    <div style={{ borderRadius: 10, background: bg, border: border ?? 'none', padding: '8px 12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: labelColor, fontWeight: 600 }}>{label}</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={onEdit} aria-label="Editar"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: '2px 4px' }}>✏️</button>
          <button onClick={onDelete} aria-label="Borrar"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: '2px 4px' }}>🗑</button>
        </div>
      </div>
      <div style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.55 }}>{entry.value}</div>
    </div>
  );
}

interface InlineEditProps {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

function InlineEdit({ value, onChange, onSave, onCancel }: InlineEditProps) {
  return (
    <div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={3}
        style={{
          width: '100%', padding: '8px 10px', boxSizing: 'border-box',
          borderRadius: 10, border: '1.5px solid var(--accent)',
          background: 'var(--bg)', color: 'var(--ink)',
          fontFamily: 'var(--font-body)', fontSize: 13.5, lineHeight: 1.6,
          outline: 'none', resize: 'vertical',
        }}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <button onClick={onSave} disabled={!value.trim()}
          style={{ flex: 1, minHeight: 40, borderRadius: 8, border: 'none', background: 'var(--accent)', color: 'var(--on-accent)', fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: value.trim() ? 1 : 0.5 }}>
          Guardar
        </button>
        <button onClick={onCancel}
          style={{ flex: 1, minHeight: 40, borderRadius: 8, border: '1.5px solid var(--line)', background: 'var(--bg-card)', color: 'var(--ink-soft)', fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer' }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
