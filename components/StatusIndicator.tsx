'use client';
import { SaveStatus } from '@/lib/types';

const MAP: Record<SaveStatus, { text: string; color: string } | null> = {
  idle:   null,
  saving: { text: '⏳ Guardando...', color: 'var(--yellow)' },
  saved:  { text: '✓ Guardado', color: 'var(--ok)' },
  error:  { text: '⚠ Sin conexión, reintentando...', color: 'var(--pink)' },
};

export default function StatusIndicator({ status }: { status: SaveStatus }) {
  const entry = MAP[status];
  if (!entry) return null;
  return (
    <div style={{
      position: 'fixed', top: 12, right: 12, zIndex: 100,
      background: 'var(--bg-card)',
      border: `2px solid ${entry.color}`,
      borderRadius: 10, padding: '6px 12px',
      fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
      color: entry.color,
      boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
    }}>
      {entry.text}
    </div>
  );
}
