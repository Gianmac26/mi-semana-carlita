'use client';
import { useRef } from 'react';
import { AppState, MiMundo } from '@/lib/types';

interface Props {
  state: AppState;
  onChange: (s: AppState) => void;
}

interface Prompt {
  key: keyof MiMundo;
  emoji: string;
  title: string;
  placeholder: string;
  color: string;
  colorSoft: string;
}

const PROMPTS: Prompt[] = [
  {
    key: 'padres',
    emoji: '🫶',
    title: 'Lo que me gustaría hacer con mis papás',
    placeholder: 'Un viaje, una película, una tarde juntos... lo que sea que quieras compartir con ellos.',
    color: 'var(--pink)',
    colorSoft: 'var(--pink-soft)',
  },
  {
    key: 'cancion',
    emoji: '🎵',
    title: 'La canción que más me gusta ahora',
    placeholder: 'Artista, nombre de la canción, y si quieres cuenta por qué te llegó...',
    color: 'var(--lilac)',
    colorSoft: 'var(--lilac-soft)',
  },
  {
    key: 'risa',
    emoji: '😂',
    title: 'Lo que más me hizo reír esta semana',
    placeholder: 'Un momento, una conversación, algo que pasó... cuéntalo aquí.',
    color: 'var(--yellow)',
    colorSoft: 'var(--yellow-soft)',
  },
  {
    key: 'aprendi',
    emoji: '🌱',
    title: 'Algo que aprendí esta semana — de la vida, no del cole',
    placeholder: 'Puede ser algo pequeño. A veces las cosas más simples enseñan más.',
    color: 'var(--teal)',
    colorSoft: 'var(--teal-soft)',
  },
  {
    key: 'preocupa',
    emoji: '💭',
    title: 'Algo que me da vueltas en la cabeza',
    placeholder: 'No tiene que ser grave. Si algo te preocupa o te pesa, aquí puedes escribirlo.',
    color: 'var(--lilac)',
    colorSoft: 'var(--lilac-soft)',
  },
  {
    key: 'meta',
    emoji: '🎯',
    title: 'Una meta que tengo para este mes',
    placeholder: 'Puede ser del cole, del baile, personal... algo concreto que quieras lograr.',
    color: 'var(--teal)',
    colorSoft: 'var(--teal-soft)',
  },
  {
    key: 'pedido',
    emoji: '💌',
    title: 'Si pudiera pedirle algo a mis papás, sería...',
    placeholder: 'Escríbelo con confianza. Esto también lo leen ellos.',
    color: 'var(--pink)',
    colorSoft: 'var(--pink-soft)',
  },
];

export default function MiMundoTab({ state, onChange }: Props) {
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const handleChange = (key: keyof MiMundo, value: string) => {
    const newState: AppState = {
      ...state,
      miMundo: { ...(state.miMundo ?? {}), [key]: value },
    };
    onChange(newState);

    // Debounce per-field (save 1s after typing stops)
    if (timers.current[key]) clearTimeout(timers.current[key]);
    timers.current[key] = setTimeout(() => {}, 1000);
  };

  const mundo = state.miMundo ?? {};

  return (
    <div>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--pink-soft), var(--lilac-soft))',
        borderRadius: 20, padding: '18px 20px', marginBottom: 24,
        border: '1.5px solid var(--line)',
      }}>
        <h3 style={{
          fontFamily: 'var(--font-title)', fontWeight: 700,
          fontSize: 20, color: 'var(--pink)', marginBottom: 6,
        }}>
          💜 Mi mundo
        </h3>
        <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
          Este espacio es tuyo. Escribe lo que quieras — tus papás también lo leen,
          así que es una forma bonita de que te conozcan mejor. 🌸
        </p>
      </div>

      {/* Prompt cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {PROMPTS.map(p => (
          <div
            key={p.key}
            style={{
              borderRadius: 18, overflow: 'hidden',
              border: `1.5px solid var(--line)`,
              background: 'var(--bg-card)',
              boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
            }}
          >
            {/* Card header */}
            <div style={{
              background: p.colorSoft,
              padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 22 }}>{p.emoji}</span>
              <span style={{
                fontFamily: 'var(--font-title)', fontWeight: 700,
                fontSize: 14.5, color: p.color, lineHeight: 1.3,
              }}>
                {p.title}
              </span>
            </div>

            {/* Textarea */}
            <div style={{ padding: '12px 14px' }}>
              <textarea
                value={mundo[p.key] ?? ''}
                onChange={e => handleChange(p.key, e.target.value)}
                placeholder={p.placeholder}
                rows={3}
                style={{
                  width: '100%', padding: '10px 12px',
                  borderRadius: 10, border: '1.5px solid var(--line)',
                  background: 'var(--bg)',
                  color: 'var(--ink)', fontFamily: 'var(--font-body)',
                  fontSize: 14, lineHeight: 1.6,
                  outline: 'none', resize: 'vertical',
                }}
              />
              {mundo[p.key] && (
                <div style={{
                  fontSize: 11, color: p.color, fontWeight: 600,
                  marginTop: 4, textAlign: 'right',
                }}>
                  ✓ guardado
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <p style={{
        textAlign: 'center', fontSize: 13, color: 'var(--ink-soft)',
        marginTop: 28, fontStyle: 'italic',
      }}>
        Todo lo que escribas aquí se guarda automáticamente. 💾
      </p>
    </div>
  );
}
