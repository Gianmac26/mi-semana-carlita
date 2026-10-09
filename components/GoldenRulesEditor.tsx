'use client';
import { useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';

export interface FamilyRule {
  id: string;
  family_id: string;
  emoji: string;
  text: string;
  sort_order: number;
  active: boolean;
}

interface Props {
  familyId: string;
  rules: FamilyRule[];
  onRulesChange: (rules: FamilyRule[]) => void;
}

const supabase = createBrowserClient();

const INPUT: React.CSSProperties = {
  padding: '8px 10px', borderRadius: 10,
  border: '1.5px solid var(--line)', background: 'var(--bg-card)',
  color: 'var(--ink)', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none',
};

const EMOJI_PRESETS = ['⭐', '📵', '🛏️', '⏰', '🍽️', '🏡', '💪', '📚', '🧹', '🐶', '💜', '🌙', '🎯', '🤝', '🏃'];

export default function GoldenRulesEditor({ familyId, rules, onRulesChange }: Props) {
  const [newEmoji, setNewEmoji] = useState('⭐');
  const [newText,  setNewText]  = useState('');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const sortedRules = [...rules].sort((a, b) => a.sort_order - b.sort_order);

  async function addRule() {
    if (!newText.trim()) return;
    setSaving(true);
    setError('');
    const maxOrder = rules.reduce((m, r) => Math.max(m, r.sort_order), -1);
    const { data, error: err } = await supabase
      .from('family_rules')
      .insert({ family_id: familyId, emoji: newEmoji, text: newText.trim(), sort_order: maxOrder + 1, active: true })
      .select().single();
    if (err || !data) {
      setError('Error al guardar la regla. Intenta de nuevo.');
    } else {
      onRulesChange([...rules, data as FamilyRule]);
      setNewText('');
      setNewEmoji('⭐');
    }
    setSaving(false);
  }

  async function deleteRule(id: string) {
    await supabase.from('family_rules').delete().eq('id', id);
    onRulesChange(rules.filter(r => r.id !== id));
  }

  async function updateRuleText(id: string, text: string) {
    onRulesChange(rules.map(r => r.id === id ? { ...r, text } : r));
    await supabase.from('family_rules').update({ text }).eq('id', id);
  }

  async function updateRuleEmoji(id: string, emoji: string) {
    onRulesChange(rules.map(r => r.id === id ? { ...r, emoji } : r));
    await supabase.from('family_rules').update({ emoji }).eq('id', id);
  }

  async function moveRule(id: string, direction: 'up' | 'down') {
    const idx = sortedRules.findIndex(r => r.id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sortedRules.length) return;

    const a = sortedRules[idx];
    const b = sortedRules[swapIdx];
    const newRules = rules.map(r => {
      if (r.id === a.id) return { ...r, sort_order: b.sort_order };
      if (r.id === b.id) return { ...r, sort_order: a.sort_order };
      return r;
    });
    onRulesChange(newRules);
    await Promise.all([
      supabase.from('family_rules').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('family_rules').update({ sort_order: a.sort_order }).eq('id', b.id),
    ]);
  }

  return (
    <div style={{ marginTop: 28 }}>
      <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 17, color: 'var(--lilac)', marginBottom: 12 }}>
        ⭐ Reglas de oro
      </h3>

      {/* Lista editable */}
      {sortedRules.length === 0 && (
        <p style={{ color: 'var(--ink-soft)', fontSize: 14, fontStyle: 'italic', marginBottom: 12 }}>
          Aún no hay reglas. Agrega la primera abajo.
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {sortedRules.map((r, idx) => (
          <div key={r.id} style={{
            background: 'var(--lilac-soft)', borderRadius: 14, padding: '10px 12px',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <input
              value={r.emoji}
              onChange={e => updateRuleEmoji(r.id, e.target.value)}
              style={{ ...INPUT, width: 44, textAlign: 'center', fontSize: 18, flexShrink: 0 }}
            />
            <input
              value={r.text}
              onChange={e => updateRuleText(r.id, e.target.value)}
              style={{ ...INPUT, flex: 1, minWidth: 0 }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
              <button onClick={() => moveRule(r.id, 'up')} disabled={idx === 0}
                style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', color: idx === 0 ? 'var(--line)' : 'var(--ink-soft)', fontSize: 14, lineHeight: 1, padding: '2px 4px' }}>▲</button>
              <button onClick={() => moveRule(r.id, 'down')} disabled={idx === sortedRules.length - 1}
                style={{ background: 'none', border: 'none', cursor: idx === sortedRules.length - 1 ? 'default' : 'pointer', color: idx === sortedRules.length - 1 ? 'var(--line)' : 'var(--ink-soft)', fontSize: 14, lineHeight: 1, padding: '2px 4px' }}>▼</button>
            </div>
            <button onClick={() => deleteRule(r.id)}
              style={{ background: 'none', border: 'none', color: 'var(--ink-soft)', cursor: 'pointer', fontSize: 16, padding: 4, flexShrink: 0 }}>🗑</button>
          </div>
        ))}
      </div>

      {/* Nueva regla */}
      <div style={{ background: 'var(--lilac-soft)', borderRadius: 14, padding: 14 }}>
        <p style={{ fontSize: 12, color: 'var(--lilac)', fontWeight: 700, margin: '0 0 8px', fontFamily: 'var(--font-title)' }}>
          Nueva regla
        </p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {EMOJI_PRESETS.map(em => (
            <button key={em} onClick={() => setNewEmoji(em)}
              style={{ width: 34, height: 34, borderRadius: 8, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `2px solid ${newEmoji === em ? 'var(--lilac)' : 'transparent'}`,
                background: newEmoji === em ? 'rgba(var(--lilac-rgb,150,100,220),0.15)' : 'var(--bg-card)' }}>
              {em}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={newEmoji} onChange={e => setNewEmoji(e.target.value)}
            placeholder="emoji" style={{ ...INPUT, width: 52, textAlign: 'center', fontSize: 18, flexShrink: 0 }} />
          <input value={newText} onChange={e => setNewText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addRule()}
            placeholder="Texto de la regla" style={{ ...INPUT, flex: 1, minWidth: 0 }} />
          <button onClick={addRule} disabled={saving || !newText.trim()}
            style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: 'var(--lilac)', color: 'var(--on-accent)', fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 13, cursor: saving || !newText.trim() ? 'not-allowed' : 'pointer', opacity: saving || !newText.trim() ? 0.6 : 1, flexShrink: 0 }}>
            {saving ? '...' : '+ Agregar'}
          </button>
        </div>
        {error && <p style={{ color: 'var(--error)', fontSize: 12, marginTop: 6 }}>{error}</p>}
      </div>
    </div>
  );
}
