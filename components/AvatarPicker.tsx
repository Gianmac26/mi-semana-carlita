'use client';
import { useRef, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';

// Los fondos de avatar son colores propios del avatar, NO tokens de paleta.
// Intencional: los avatares no cambian con la paleta activa (un zorro naranja sigue naranja en modo nocturno).
export const PRESET_AVATARS: { emoji: string; bg: string }[] = [
  { emoji: '🦊', bg: '#FFE0B2' },
  { emoji: '🐼', bg: '#E0F7FA' },
  { emoji: '🦉', bg: '#E8EAF6' },
  { emoji: '🐙', bg: '#FCE4EC' },
  { emoji: '🦁', bg: '#FFF9C4' },
  { emoji: '🐸', bg: '#E8F5E9' },
  { emoji: '🐨', bg: '#ECEFF1' },
  { emoji: '🦄', bg: '#F3E5F5' },
  { emoji: '🐧', bg: '#E3F2FD' },
  { emoji: '🦋', bg: '#FFF3E0' },
  { emoji: '🌟', bg: '#FFFDE7' },
  { emoji: '🚀', bg: '#E8EAF6' },
];

interface Props {
  userId?: string;
  initialAvatar?: string | null;
  onAvatarChange?: (emoji: string) => void;
}

export default function AvatarPicker({ userId, initialAvatar, onAvatarChange }: Props) {
  const [selected, setSelected] = useState<string>(initialAvatar ?? '');
  const saveTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabaseRef = useRef(createBrowserClient());

  const selectedEntry = PRESET_AVATARS.find(a => a.emoji === selected);

  function selectAvatar(emoji: string) {
    setSelected(emoji);
    try { localStorage.setItem('mi-semana-avatar', emoji); } catch {}
    onAvatarChange?.(emoji);

    if (userId) {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          // admin_global no tiene fila en profiles → FK rechaza → ignorar
          await supabaseRef.current.from('user_preferences').upsert(
            { user_id: userId, avatar_url: emoji, avatar_type: 'preset',
              updated_at: new Date().toISOString() },
            { onConflict: 'user_id' }
          );
        } catch { /* FK violation for admin_global — safe to ignore */ }
      }, 800);
    }
  }

  return (
    <div>
      <h2 style={{
        fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 20,
        color: 'var(--ink)', marginBottom: 4,
      }}>
        👤 Tu avatar
      </h2>
      <p style={{
        color: 'var(--ink-soft)', fontSize: 13, marginBottom: 16,
        fontFamily: 'var(--font-body)',
      }}>
        Se muestra en el encabezado. Cambio inmediato.
      </p>

      {/* Preview grande del seleccionado */}
      {selectedEntry && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          marginBottom: 20, padding: '14px 16px',
          background: 'var(--bg-card)', borderRadius: 16,
          border: '1.5px solid var(--line)',
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
            background: selectedEntry.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 40,
          }}>
            {selectedEntry.emoji}
          </div>
          <div>
            <p style={{
              fontFamily: 'var(--font-title)', fontWeight: 700,
              fontSize: 16, color: 'var(--ink)', margin: 0,
            }}>
              Avatar seleccionado
            </p>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 13,
              color: 'var(--ink-soft)', margin: '4px 0 0',
            }}>
              Se guarda automáticamente
            </p>
          </div>
        </div>
      )}

      {/* Grid 4 cols — minHeight 72px garantiza touch target ≥60px + margen */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 10,
      }}>
        {PRESET_AVATARS.map(({ emoji, bg }) => {
          const isSelected = selected === emoji;
          return (
            <button
              key={emoji}
              onClick={() => selectAvatar(emoji)}
              aria-pressed={isSelected}
              aria-label={`Avatar ${emoji}`}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: 72, borderRadius: 16, cursor: 'pointer',
                background: bg,
                border: isSelected
                  ? '2.5px solid var(--accent)'
                  : '2px solid transparent',
                outline: isSelected ? '3px solid var(--accent-soft)' : 'none',
                transition: 'border-color 0.15s, outline 0.15s',
                padding: 0,
              }}
            >
              <span style={{ fontSize: 36, lineHeight: 1 }}>{emoji}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
