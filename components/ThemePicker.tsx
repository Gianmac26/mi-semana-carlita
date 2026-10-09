'use client';
import { useRef, useState } from 'react';
import { PALETTES, DEFAULT_PALETTE } from '@/lib/themes';
import type { PaletteId } from '@/lib/themes';
import { createBrowserClient } from '@/lib/supabase/client';

interface Props {
  userId?: string;
}

function applyPalette(id: PaletteId) {
  document.documentElement.setAttribute('data-palette', id);
}

export default function ThemePicker({ userId }: Props) {
  const [selected, setSelected] = useState<PaletteId>(() => {
    try {
      return (localStorage.getItem('mi-semana-palette') as PaletteId) ?? DEFAULT_PALETTE;
    } catch {
      return DEFAULT_PALETTE;
    }
  });
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabaseRef = useRef(createBrowserClient());

  function selectPalette(id: PaletteId) {
    setSelected(id);
    applyPalette(id);
    try { localStorage.setItem('mi-semana-palette', id); } catch {}

    if (userId) {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          // Si el usuario no tiene profile (admin_global), la FK rechaza el upsert. Ignoramos.
          await supabaseRef.current.from('user_preferences').upsert(
            { user_id: userId, theme_palette: id, updated_at: new Date().toISOString() },
            { onConflict: 'user_id' }
          );
        } catch { /* FK violation for admin_global — safe to ignore */ }
      }, 800);
    }
  }

  return (
    <div style={{ paddingTop: 4 }}>
      <h2 style={{
        fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 20,
        color: 'var(--ink)', marginBottom: 4,
      }}>
        🎨 Tu paleta
      </h2>
      <p style={{
        color: 'var(--ink-soft)', fontSize: 13, marginBottom: 20,
        fontFamily: 'var(--font-body)',
      }}>
        El cambio es inmediato. Se guarda automáticamente.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 12,
      }}>
        {PALETTES.map(palette => {
          const t = palette.light;
          const isSelected = selected === palette.id;

          return (
            <button
              key={palette.id}
              onClick={() => selectPalette(palette.id)}
              aria-pressed={isSelected}
              aria-label={`Paleta ${palette.name}`}
              style={{
                border: isSelected
                  ? '2.5px solid var(--accent)'
                  : '1.5px solid var(--line)',
                borderRadius: 16,
                overflow: 'hidden',
                background: t.bg,
                cursor: 'pointer',
                textAlign: 'left',
                padding: 0,
                minHeight: 130,
                boxShadow: isSelected
                  ? '0 0 0 3px var(--accent-soft)'
                  : '0 1px 4px rgba(0,0,0,0.06)',
                transition: 'box-shadow 0.15s, border-color 0.15s',
              }}
            >
              {/* Mini dashboard preview */}
              <div style={{ padding: '10px 10px 6px' }}>
                <div style={{
                  background: t['bg-card'],
                  borderRadius: 10,
                  border: `1px solid ${t.line}`,
                  padding: '8px 10px',
                }}>
                  <div style={{
                    height: 7, width: '68%', borderRadius: 4,
                    background: t.ink, marginBottom: 5, opacity: 0.85,
                  }} />
                  <div style={{
                    height: 6, width: '44%', borderRadius: 4,
                    background: t['ink-soft'], marginBottom: 8, opacity: 0.7,
                  }} />
                  <div style={{
                    display: 'inline-block',
                    background: t.accent,
                    borderRadius: 6,
                    padding: '3px 9px',
                    fontSize: 10,
                    fontFamily: 'var(--font-title)',
                    fontWeight: 700,
                    color: t['on-accent'],
                  }}>
                    Acento
                  </div>
                </div>
              </div>

              {/* Label row */}
              <div style={{
                display: 'flex', alignItems: 'center',
                padding: '6px 12px 10px',
                gap: 6,
              }}>
                <span style={{ fontSize: 16, lineHeight: 1 }}>{palette.emoji}</span>
                <span style={{
                  fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 13,
                  color: t.ink, flex: 1,
                }}>
                  {palette.name}
                </span>
                {isSelected && (
                  <span style={{
                    width: 18, height: 18, borderRadius: '50%',
                    background: t.accent, color: t['on-accent'],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, flexShrink: 0,
                    lineHeight: 1,
                  }}>
                    ✓
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
