'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

// ── Líneas de ayuda verificadas ────────────────────────────────────────────

interface Helpline {
  emoji: string;
  name: string;
  org: string;
  description: string;
  phone?: string;
  phoneTel?: string;
  note: string;
  whatsapp?: Array<{ display: string; tel: string }>;
  chat?: string;
  email?: string;
  color: string;
  colorSoft: string;
}

const HELPLINES: Helpline[] = [
  {
    emoji: '🧠',
    name: 'Línea 113 — opción 5',
    org: 'MINSA',
    description: 'Crisis emocional · Suicidio · Bullying · TCA',
    phone: '113', phoneTel: '113',
    note: 'Gratuita · 24 h · 365 días',
    whatsapp: [
      { display: '955 557 000', tel: '51955557000' },
      { display: '952 842 623', tel: '51952842623' },
    ],
    color: 'var(--teal)',
    colorSoft: 'var(--teal-soft)',
  },
  {
    emoji: '🏠',
    name: 'Línea 100',
    org: 'MIMP',
    description: 'Violencia familiar y sexual',
    phone: '100', phoneTel: '100',
    note: 'Gratuita · Confidencial · 24 h',
    chat: 'https://chat100.warminan.gob.pe',
    color: 'var(--accent)',
    colorSoft: 'var(--accent-soft)',
  },
  {
    emoji: '🏫',
    name: 'SíseVe',
    org: 'Minedu',
    description: 'Bullying y violencia escolar',
    phone: '0800-76888', phoneTel: '080076888',
    note: 'Reporte gratuito',
    whatsapp: [{ display: '991 410 000', tel: '51991410000' }],
    chat: 'https://www.siseve.minedu.gob.pe',
    color: 'var(--lilac)',
    colorSoft: 'var(--lilac-soft)',
  },
  {
    emoji: '💙',
    name: 'Educación Te Escucha',
    org: 'Minedu',
    description: 'Soporte socioemocional · 10 a 18 años',
    note: 'WhatsApp · Correo',
    whatsapp: [{ display: '983 098 972', tel: '51983098972' }],
    email: 'educacionteescucha@minedu.gob.pe',
    color: 'var(--yellow)',
    colorSoft: 'var(--yellow-soft)',
  },
];

// ── Respiración 4-7-8 ─────────────────────────────────────────────────────

interface BreathPhase {
  label: string;
  hint: string;
  duration: number;
  scale: number;
}

const BREATH_SEQ: BreathPhase[] = [
  { label: 'Inhala',  hint: 'por la nariz, suavemente',  duration: 4, scale: 1    },
  { label: 'Sostén',  hint: 'mantén el aire con calma',  duration: 7, scale: 1    },
  { label: 'Exhala',  hint: 'por la boca, lentamente',   duration: 8, scale: 0.45 },
];

function BreathingGuide({ onStop }: { onStop: () => void }) {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [countdown, setCountdown] = useState(BREATH_SEQ[0].duration);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAll = useCallback(() => {
    if (timerRef.current)  clearTimeout(timerRef.current);
    if (countRef.current)  clearInterval(countRef.current);
  }, []);

  const startPhase = useCallback((idx: number) => {
    clearAll();
    const phase = BREATH_SEQ[idx];
    let remaining = phase.duration;
    setCountdown(remaining);
    countRef.current = setInterval(() => {
      remaining--;
      setCountdown(remaining);
      if (remaining <= 0) clearInterval(countRef.current!);
    }, 1000);
    timerRef.current = setTimeout(() => {
      const next = (idx + 1) % BREATH_SEQ.length;
      setPhaseIdx(next);
      startPhase(next);
    }, phase.duration * 1000);
  }, [clearAll]);

  const handleStart = () => {
    setRunning(true);
    setPhaseIdx(0);
    startPhase(0);
  };

  useEffect(() => () => clearAll(), [clearAll]);

  const phase = BREATH_SEQ[phaseIdx];
  const circleSize = running ? (phase.scale === 1 ? 150 : 70) : 100;
  const circleColor = phaseIdx === 0 ? 'var(--teal)' : phaseIdx === 1 ? 'var(--lilac)' : 'var(--accent)';

  return (
    <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
      <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 17, color: 'var(--ink)', marginBottom: 6 }}>
        🌬️ Respira conmigo
      </h3>
      <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginBottom: 24, lineHeight: 1.5 }}>
        La técnica 4-7-8 calma el sistema nervioso en menos de 2 minutos.
      </p>

      {/* Animated circle */}
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: 180, marginBottom: 20,
      }}>
        <div style={{
          width: circleSize, height: circleSize,
          borderRadius: '50%',
          background: `${circleColor}33`,
          border: `3px solid ${circleColor}`,
          transition: 'width 0.8s ease-in-out, height 0.8s ease-in-out, background 1s, border-color 1s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 4,
        }}>
          {running && (
            <>
              <span style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 28, color: circleColor, lineHeight: 1 }}>
                {countdown}
              </span>
              <span style={{ fontSize: 11, color: circleColor, fontWeight: 700 }}>seg</span>
            </>
          )}
        </div>
      </div>

      {/* Phase label */}
      <div style={{ marginBottom: 24, minHeight: 44 }}>
        {running ? (
          <>
            <p style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 22, color: circleColor, marginBottom: 4 }}>
              {phase.label}
            </p>
            <p style={{ fontSize: 14, color: 'var(--ink-soft)' }}>{phase.hint}</p>
          </>
        ) : (
          <p style={{ fontSize: 14, color: 'var(--ink-soft)' }}>
            Toca "Empezar" cuando estés lista
          </p>
        )}
      </div>

      {/* Cycle indicators */}
      {running && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
          {BREATH_SEQ.map((p, i) => (
            <div key={i} style={{
              padding: '4px 12px', borderRadius: 20,
              background: i === phaseIdx ? circleColor : 'var(--line)',
              color: i === phaseIdx ? 'var(--on-accent)' : 'var(--ink-soft)',
              fontSize: 11, fontFamily: 'var(--font-title)', fontWeight: 700,
              transition: 'all 0.3s',
            }}>
              {p.label} {p.duration}s
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        {!running ? (
          <button
            onClick={handleStart}
            style={{
              padding: '14px 32px', borderRadius: 16, border: 'none',
              background: 'var(--teal)', color: 'var(--on-accent)',
              fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 16,
              cursor: 'pointer', minHeight: 52, minWidth: 160,
            }}
          >
            Empezar
          </button>
        ) : (
          <button
            onClick={() => { clearAll(); setRunning(false); setCountdown(BREATH_SEQ[0].duration); setPhaseIdx(0); }}
            style={{
              padding: '14px 24px', borderRadius: 16,
              border: '1.5px solid var(--line)', background: 'var(--bg-card)',
              color: 'var(--ink-soft)', fontFamily: 'var(--font-title)',
              fontWeight: 700, fontSize: 15, cursor: 'pointer', minHeight: 52,
            }}
          >
            Pausar
          </button>
        )}
        <button
          onClick={onStop}
          style={{
            padding: '14px 24px', borderRadius: 16,
            border: '1.5px solid var(--line)', background: 'var(--bg-card)',
            color: 'var(--ink-soft)', fontFamily: 'var(--font-title)',
            fontWeight: 700, fontSize: 15, cursor: 'pointer', minHeight: 52,
          }}
        >
          Ver líneas de ayuda
        </button>
      </div>
    </div>
  );
}

// ── Helpline card ──────────────────────────────────────────────────────────

function HelplineCard({ line }: { line: Helpline }) {
  return (
    <div style={{
      borderRadius: 18, overflow: 'hidden',
      border: `1.5px solid ${line.color}33`,
      background: 'var(--bg-card)',
    }}>
      {/* Header */}
      <div style={{
        background: line.colorSoft, padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>{line.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-title)', fontWeight: 700,
            fontSize: 15, color: line.color, lineHeight: 1.2,
          }}>
            {line.name}
            <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.75, marginLeft: 6 }}>
              {line.org}
            </span>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 2 }}>
            {line.description}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 11, color: 'var(--ink-soft)', fontWeight: 600, marginBottom: 2 }}>
          {line.note}
        </div>

        {/* Call button */}
        {line.phoneTel && (
          <a
            href={`tel:${line.phoneTel}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              minHeight: 52, padding: '12px 16px', borderRadius: 14,
              background: line.color, color: 'var(--on-accent)', textDecoration: 'none',
              fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 16,
            }}
          >
            📞 Llamar: {line.phone}
          </a>
        )}

        {/* WhatsApp buttons */}
        {line.whatsapp && line.whatsapp.map(wa => (
          <a
            key={wa.tel}
            href={`https://wa.me/${wa.tel}`}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              minHeight: 48, padding: '10px 16px', borderRadius: 14,
              background: '#25D366', color: '#fff', textDecoration: 'none',
              fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 15,
            }}
          >
            💬 WhatsApp {wa.display}
          </a>
        ))}

        {/* Chat / web link */}
        {line.chat && (
          <a
            href={line.chat}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              minHeight: 48, padding: '10px 16px', borderRadius: 14,
              border: `1.5px solid ${line.color}`,
              background: line.colorSoft, color: line.color, textDecoration: 'none',
              fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 14,
            }}
          >
            🌐 Chat online
          </a>
        )}

        {/* Email */}
        {line.email && (
          <a
            href={`mailto:${line.email}`}
            style={{
              fontSize: 13, color: 'var(--ink-soft)', textDecoration: 'none',
              display: 'block', padding: '4px 0',
            }}
          >
            ✉️ {line.email}
          </a>
        )}
      </div>
    </div>
  );
}

// ── Main HelpButton component ──────────────────────────────────────────────

export default function HelpButton() {
  const [open, setOpen]         = useState(false);
  const [breathMode, setBrMode] = useState(false);

  const close = () => { setOpen(false); setBrMode(false); };

  // Cache helpline data in localStorage for offline access
  useEffect(() => {
    try {
      localStorage.setItem('helplines_cached', JSON.stringify(HELPLINES));
    } catch { /* storage unavailable */ }
  }, []);

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Abrir recursos de ayuda"
        aria-haspopup="dialog"
        style={{
          position: 'fixed',
          bottom: 'calc(56px + env(safe-area-inset-bottom) + 14px)',
          right: 18,
          width: 56, height: 56,
          borderRadius: '50%',
          background: 'var(--lilac)',
          color: 'var(--on-accent)',
          border: 'none',
          boxShadow: '0 4px 18px rgba(155,107,242,0.45)',
          fontSize: 22,
          cursor: 'pointer',
          zIndex: 90,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
      >
        💙
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={close}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(2px)',
            zIndex: 300,
          }}
        />
      )}

      {/* Bottom sheet */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Recursos de ayuda"
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: 'var(--bg-card)',
            borderRadius: '24px 24px 0 0',
            paddingBottom: 'env(safe-area-inset-bottom)',
            zIndex: 301,
            maxHeight: '90dvh',
            overflowY: 'auto',
            boxShadow: '0 -8px 40px rgba(0,0,0,0.22)',
          }}
        >
          {/* Handle */}
          <div style={{
            display: 'flex', justifyContent: 'center',
            padding: '12px 0 8px',
          }}>
            <div style={{
              width: 40, height: 4, borderRadius: 2,
              background: 'var(--line)',
            }} />
          </div>

          <div style={{ padding: '4px 20px 32px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 20, color: 'var(--ink)', margin: 0 }}>
                💙 No estás sola
              </h3>
              <button
                onClick={close}
                aria-label="Cerrar"
                style={{
                  background: 'var(--line)', border: 'none', borderRadius: '50%',
                  width: 32, height: 32, cursor: 'pointer',
                  color: 'var(--ink-soft)', fontSize: 18, lineHeight: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>

            {breathMode ? (
              <BreathingGuide onStop={() => setBrMode(false)} />
            ) : (
              <>
                {/* Empathetic message */}
                <div style={{
                  background: 'var(--lilac-soft)', borderRadius: 16,
                  padding: '14px 16px', marginBottom: 16,
                }}>
                  <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--ink)', margin: 0 }}>
                    Buscar ayuda es un acto de valentía.{' '}
                    <strong>Si estás pasando un momento difícil, hay personas capacitadas esperando tu llamada.</strong>{' '}
                    No tienes que manejarlo sola.
                  </p>
                </div>

                {/* Breathing button — first option */}
                <button
                  onClick={() => setBrMode(true)}
                  style={{
                    width: '100%', minHeight: 56, padding: '14px 16px', marginBottom: 20,
                    borderRadius: 16, border: '1.5px solid var(--teal)',
                    background: 'var(--teal-soft)',
                    color: 'var(--teal)',
                    fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 15,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}
                >
                  <span style={{ fontSize: 24 }}>🌬️</span>
                  <div style={{ textAlign: 'left' }}>
                    <div>Necesito calmarme</div>
                    <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.8 }}>Respiración guiada 4-7-8 · 1 minuto</div>
                  </div>
                </button>

                {/* Helplines */}
                <p style={{
                  fontSize: 11, color: 'var(--ink-soft)', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12,
                }}>
                  Líneas de ayuda gratuitas
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {HELPLINES.map((line, i) => (
                    <HelplineCard key={i} line={line} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
