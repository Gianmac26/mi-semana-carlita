'use client';
import { needsSupportCard } from '@/lib/emotions';
import type { EmotionLog } from '@/lib/types';

interface Props {
  logs: EmotionLog[];
  onOpenHelp: () => void;
}

// Aparece solo si los 3 registros más recientes de los últimos 7 días tienen bienestar <= 2
// (emotionWellbeing: emoción + intensidad).
// Tono: cálido, sin diagnóstico ni alarma, sin prometer compañía que no existe.
export default function EmotionSupportCard({ logs, onOpenHelp }: Props) {
  if (!needsSupportCard(logs)) return null;

  return (
    <section
      role="region"
      aria-labelledby="support-card-title"
      style={{
        background: 'var(--lilac-soft)', border: '1.5px solid var(--lilac)',
        borderRadius: 16, padding: '14px 16px', marginBottom: 16,
      }}
    >
      <h4 id="support-card-title" style={{
        fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 15,
        color: 'var(--ink)', margin: 0, lineHeight: 1.35,
      }}>
        Parece que estos días han sido difíciles.
      </h4>
      <p style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.5, marginTop: 6 }}>
        No tienes que poder con todo solo/a. Hablar con alguien de confianza también ayuda: tu papá, tu mamá, un profe o un amigo.
      </p>
      <button
        type="button"
        onClick={onOpenHelp}
        style={{
          width: '100%', minHeight: 48, marginTop: 12, borderRadius: 12, border: 'none',
          background: 'var(--accent)', color: 'var(--on-accent)',
          fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 15, cursor: 'pointer',
        }}
      >
        Hablar con alguien ahora
      </button>
      <a href="tel:113" style={{ display: 'block', fontSize: 12, color: 'var(--ink)', textAlign: 'center', marginTop: 8, textDecoration: 'underline' }}>
        Línea 113, opción 5 · gratis, 24 horas
      </a>
    </section>
  );
}
