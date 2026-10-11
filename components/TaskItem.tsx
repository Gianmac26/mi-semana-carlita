'use client';
import type { TaskCompletion } from '@/lib/types';

interface TaskShape { slug: string; icon: string; label: string; time: string; skippable?: boolean }

interface Props {
  task: TaskShape;
  completion: TaskCompletion | null;
  skipped: boolean;
  role: 'padre' | 'hijo';
  onToggle: () => void;
  onSkip: () => void;
  onOpenDetail: () => void;
}

export default function TaskItem({ task, completion, skipped, role, onToggle, onSkip, onOpenDetail }: Props) {
  const checked = completion !== null;
  const canToggle = role === 'hijo' && !skipped;

  return (
    <div style={{ marginBottom: 8 }}>
      <div
        onClick={() => canToggle && onToggle()}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px', borderRadius: skipped ? '16px 16px 0 0' : 16,
          background: skipped ? 'var(--line)' : 'var(--bg-card)',
          border: '1.5px solid var(--line)',
          borderBottom: skipped ? 'none' : undefined,
          cursor: canToggle ? 'pointer' : 'default',
          opacity: skipped ? 0.6 : checked ? 0.55 : 1,
          transition: 'all 0.15s',
          boxShadow: skipped ? 'none' : '0 1px 4px rgba(0,0,0,0.05)',
          userSelect: 'none',
        }}
      >
        {/* Checkbox (para el padre es solo indicador de estado: no interactivo y atenuado) */}
        <div
          role="checkbox"
          aria-checked={checked && !skipped}
          aria-label={task.label}
          aria-disabled={role === 'padre' ? true : undefined}
          style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            border: (checked && !skipped) ? 'none' : '2.5px solid var(--line)',
            background: (checked && !skipped) ? 'var(--ok)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
            pointerEvents: role === 'padre' ? 'none' : undefined,
            opacity: role === 'padre' ? 0.7 : undefined,
          }}
        >
          {checked && !skipped && <span style={{ color: 'var(--on-accent)', fontSize: 16, lineHeight: 1 }}>✓</span>}
        </div>

        <span style={{ fontSize: 20, lineHeight: 1 }}>{task.icon}</span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 600, fontSize: 15,
            textDecoration: (checked && !skipped) ? 'line-through' : 'none',
            color: 'var(--ink)',
          }}>
            {task.label}
          </div>
          {task.time && (
            <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>
              {task.time}
            </div>
          )}
        </div>

        {skipped && (
          <span style={{
            fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)',
            background: 'var(--bg-card)', borderRadius: 6, padding: '2px 7px',
            flexShrink: 0,
          }}>
            N/A
          </span>
        )}

        {/* Detalle — target de 44px; margen negativo para no agrandar la fila */}
        <button
          onClick={e => { e.stopPropagation(); onOpenDetail(); }}
          aria-label={`Ver detalle de ${task.label}`}
          aria-haspopup="dialog"
          style={{
            width: 44, height: 44, flexShrink: 0, margin: '-8px -10px -8px -4px',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <span style={{
            width: 24, height: 24, borderRadius: '50%',
            border: '1.5px solid var(--line)', color: 'var(--ink-soft)',
            fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 13, lineHeight: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            i
          </span>
        </button>
      </div>

      {/* "Me quedé en casa" toggle — solo tareas skippable y solo el hijo */}
      {task.skippable && role === 'hijo' && (
        <button
          onClick={onSkip}
          style={{
            width: '100%', padding: '7px 16px',
            borderRadius: '0 0 16px 16px',
            border: '1.5px solid var(--line)', borderTop: 'none',
            background: skipped ? 'var(--teal-soft)' : 'var(--bg-card)',
            color: skipped ? 'var(--teal)' : 'var(--ink-soft)',
            fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12,
            cursor: 'pointer', textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.15s',
          }}
        >
          <span>{skipped ? '✓' : '🏠'}</span>
          {skipped ? 'Me quedé en casa (no cuenta para el %)'  : 'Me quedé en casa'}
        </button>
      )}

      {/* Padre: estado de "Me quedé en casa" en solo lectura (cierra la fila redondeada) */}
      {task.skippable && role === 'padre' && skipped && (
        <div style={{
          padding: '7px 16px', borderRadius: '0 0 16px 16px',
          border: '1.5px solid var(--line)', borderTop: 'none',
          background: 'var(--teal-soft)', color: 'var(--teal)',
          fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span>✓</span>
          Se quedó en casa (no cuenta para el %)
        </div>
      )}
    </div>
  );
}
