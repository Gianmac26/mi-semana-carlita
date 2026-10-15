'use client';
import { useState } from 'react';
import type { EmotionLabel, EmotionLog } from '@/lib/types';
import { EMOTIONS } from '@/lib/emotions';

interface Props {
  /** Registro de hoy (Lima) si existe. Solo se usa como valor inicial. */
  initialLog: EmotionLog | null;
  onSave: (emotion: EmotionLabel, intensity: number, note: string) => Promise<boolean>;
}

const INTENSITY_VALUES = [1, 2, 3, 4, 5];
const INTENSITY_ARIA = [
  'Intensidad 1 de 5: un poquito', 'Intensidad 2 de 5', 'Intensidad 3 de 5',
  'Intensidad 4 de 5', 'Intensidad 5 de 5: muchísimo',
];

const INTENSITY_TITLE: Record<EmotionLabel, string> = {
  alegria:  '2. ¿Cuánta alegría sientes?',
  tristeza: '2. ¿Cuánta tristeza sientes?',
  miedo:    '2. ¿Cuánto miedo sientes?',
  ira:      '2. ¿Cuánta ira sientes?',
  asco:     '2. ¿Cuánto asco sientes?',
  sorpresa: '2. ¿Cuánta sorpresa sientes?',
};

const NOTE_MAX = 500;

const stepTitle: React.CSSProperties = {
  fontSize: 13, fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px',
};

// Registro diario en 3 pasos: emoción → intensidad (1-5) → nota opcional → Guardar.
export default function EmotionTracker({ initialLog, onSave }: Props) {
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionLabel | null>(initialLog?.emotion ?? null);
  const [intensity,       setIntensity]       = useState<number | null>(initialLog?.intensity ?? null);
  const [note,            setNote]            = useState(initialLog?.note ?? '');
  const [saving,          setSaving]          = useState(false);
  const [status,          setStatus]          = useState<'idle' | 'saved' | 'error'>('idle');
  const [hasToday,        setHasToday]        = useState(initialLog !== null);

  const canSave = selectedEmotion !== null && intensity !== null && !saving;

  // Explica por qué el botón está deshabilitado (no aplica mientras guarda).
  const missingHint =
    selectedEmotion === null && intensity === null ? 'Elige una emoción y su intensidad para guardar.'
    : selectedEmotion === null                     ? 'Elige una emoción para guardar.'
    : intensity === null                           ? 'Elige la intensidad para guardar.'
    : null;

  // Cualquier cambio después de guardar vuelve al estado normal del botón.
  function touch() {
    if (status !== 'idle') setStatus('idle');
  }

  async function handleSave() {
    if (!canSave || selectedEmotion === null || intensity === null) return;
    setSaving(true);
    setStatus('idle');
    const ok = await onSave(selectedEmotion, intensity, note);
    setSaving(false);
    if (ok) {
      setStatus('saved');
      setHasToday(true);
    } else {
      setStatus('error');
    }
  }

  return (
    <section style={{
      background: 'var(--bg-card)', border: '1.5px solid var(--line)',
      borderRadius: 20, padding: '16px 16px 18px', marginBottom: 16,
    }}>
      {/* Título + chip de privacidad */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <h4 style={{
          fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 17,
          color: 'var(--ink)', margin: 0,
        }}>
          💭 ¿Cómo te sientes hoy?
        </h4>
        <span style={{
          flexShrink: 0, padding: '4px 10px', borderRadius: 20,
          background: 'var(--bg)', border: '1px solid var(--line)',
          fontSize: 11.5, fontWeight: 600, color: 'var(--ink-soft)',
        }}>
          🔒 Privado
        </span>
      </div>

      {/* Transparencia */}
      <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.45, margin: '6px 0 14px' }}>
        Tu familia solo ve una tendencia semanal (tranquila, difícil…), nunca tus registros ni tus notas.
      </p>

      {/* 1. Emoción (3×2) */}
      <p id="emotion-step-emotion" style={stepTitle}>1. ¿Qué emoción sientes más?</p>
      <div role="group" aria-labelledby="emotion-step-emotion" style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6,
      }}>
        {EMOTIONS.map(e => {
          const selected = selectedEmotion === e.key;
          return (
            <button
              key={e.key}
              type="button"
              aria-pressed={selected}
              onClick={() => { setSelectedEmotion(e.key); touch(); }}
              style={{
                minHeight: 44, minWidth: 0, padding: '8px 4px', borderRadius: 12, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: 3,
                textAlign: 'center',
                background: selected ? 'var(--accent)' : 'var(--bg-card)',
                color: selected ? 'var(--on-accent)' : 'var(--ink)',
                border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--line)'}`,
              }}
            >
              <span style={{ fontSize: 22, lineHeight: 1 }}>{e.emoji}</span>
              <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{e.label}</span>
              <span style={{
                fontSize: 11, lineHeight: 1.25,
                color: selected ? 'var(--on-accent)' : 'var(--ink-soft)',
              }}>
                {e.examples}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. Intensidad 1-5 */}
      <p id="emotion-step-intensity" style={{ ...stepTitle, marginTop: 16 }}>
        {selectedEmotion ? INTENSITY_TITLE[selectedEmotion] : '2. ¿Con qué intensidad?'}
      </p>
      <div role="group" aria-labelledby="emotion-step-intensity" style={{ display: 'flex', gap: 6 }}>
        {INTENSITY_VALUES.map((value, i) => {
          const selected = intensity === value;
          return (
            <button
              key={value}
              type="button"
              aria-label={INTENSITY_ARIA[i]}
              aria-pressed={selected}
              onClick={() => { setIntensity(value); touch(); }}
              style={{
                flex: 1, minWidth: 0, minHeight: 48, borderRadius: 14, cursor: 'pointer', padding: 0,
                fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 18, color: 'var(--ink)',
                background: selected ? 'var(--accent-soft)' : 'var(--bg-card)',
                border: `2px solid ${selected ? 'var(--accent)' : 'var(--line)'}`,
              }}
            >
              {value}
            </button>
          );
        })}
      </div>
      <div aria-hidden="true" style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 11, color: 'var(--ink-soft)', margin: '4px 0 0',
      }}>
        <span>1 = un poquito</span>
        <span>5 = muchísimo</span>
      </div>

      {/* 3. Nota opcional (siempre visible) */}
      <label htmlFor="emotion-note" style={{ ...stepTitle, display: 'block', marginTop: 16 }}>
        3. ¿Quieres contar algo más? (opcional)
      </label>
      <textarea
        id="emotion-note"
        value={note}
        onChange={ev => { setNote(ev.target.value); touch(); }}
        maxLength={NOTE_MAX}
        rows={3}
        placeholder="Tu familia no puede ver esta nota."
        aria-describedby="emotion-note-count"
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '10px 12px', borderRadius: 12,
          border: '1.5px solid var(--line)', background: 'var(--bg)',
          color: 'var(--ink)', fontFamily: 'var(--font-body)', fontSize: 16, lineHeight: 1.5,
          outline: 'none', resize: 'vertical',
        }}
      />
      <p id="emotion-note-count" style={{ fontSize: 11, color: 'var(--ink-soft)', textAlign: 'right', margin: '2px 0 0' }}>
        {note.length}/{NOTE_MAX}
      </p>

      {/* Guardar / Editar */}
      <button
        type="button"
        onClick={handleSave}
        disabled={!canSave}
        aria-describedby={missingHint ? 'emotion-save-hint' : undefined}
        style={{
          width: '100%', minHeight: 48, marginTop: 12, borderRadius: 14, border: 'none',
          background: 'var(--accent)', color: 'var(--on-accent)',
          fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 15,
          cursor: canSave ? 'pointer' : 'default',
          opacity: canSave ? 1 : 0.5,
        }}
      >
        {saving ? 'Guardando...' : hasToday ? 'Editar el registro de hoy' : 'Guardar'}
      </button>

      {missingHint && (
        <p id="emotion-save-hint" style={{ marginTop: 8, textAlign: 'center', fontSize: 12.5, color: 'var(--ink-soft)' }}>
          {missingHint}
        </p>
      )}
      {status === 'saved' && (
        <p style={{ marginTop: 8, textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--ink-soft)' }}>
          ✓ Guardado hoy
        </p>
      )}
      {status === 'error' && (
        <p role="alert" style={{
          marginTop: 8, padding: '8px 12px', borderRadius: 10,
          background: 'var(--error-soft)', color: 'var(--error)',
          fontSize: 13, fontWeight: 600, textAlign: 'center',
        }}>
          No se pudo guardar. Intenta de nuevo.
        </p>
      )}
    </section>
  );
}
