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
  const isDone     = completion?.status === 'done';
  const isApproved = completion?.status === 'approved';
  const isRejected = completion?.status === 'rejected';
  // Rechazada NO cuenta como marcada: el hijo la vuelve a marcar (fresh start).
  const checked   = isDone || isApproved;
  // Aprobada queda fija: no se puede desmarcar (el trigger/RLS también lo impiden).
  const canToggle = role === 'hijo' && !skipped && !isApproved;

  // Franja izquierda solo para estados revisados; sin cambios de fondo.
  const accent = skipped ? null : isApproved ? 'var(--ok)' : isRejected ? 'var(--yellow)' : null;

  const statusLabel = isApproved ? 'aprobada' : isRejected ? 'rechazada, revisa el motivo' : null;

  return (
    <div style={{ marginBottom: 8 }}>
      <div
        onClick={() => canToggle && onToggle()}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          // Con franja de 4px se compensa el padding para que el contenido no se mueva.
          padding: accent ? '14px 16px 14px 13.5px' : '14px 16px',
          borderRadius: skipped ? '16px 16px 0 0' : 16,
          background: skipped ? 'var(--line)' : 'var(--bg-card)',
          border: '1.5px solid var(--line)',
          borderLeft: accent ? `4px solid ${accent}` : undefined,
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
          aria-label={statusLabel ? `${task.label} (${statusLabel})` : task.label}
          aria-disabled={role === 'padre' || isApproved ? true : undefined}
          style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            border: skipped ? '2.5px solid var(--line)'
              : checked ? 'none'
              : isRejected ? '2px solid var(--yellow)'
              : '2.5px solid var(--line)',
            background: skipped ? 'transparent'
              : checked ? 'var(--ok)'
              : isRejected ? 'var(--yellow-soft)'
              : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
            pointerEvents: role === 'padre' ? 'none' : undefined,
            opacity: role === 'padre' ? 0.7 : undefined,
          }}
        >
          {!skipped && isDone && (
            <span style={{ color: 'var(--on-accent)', fontSize: 16, lineHeight: 1 }}>✓</span>
          )}
          {!skipped && isApproved && (
            <span style={{ color: 'var(--on-accent)', fontSize: 13, lineHeight: 1, letterSpacing: -4, marginLeft: -4 }}>✓✓</span>
          )}
          {!skipped && isRejected && (
            <span style={{ color: 'var(--yellow)', fontSize: 14, lineHeight: 1 }}>⚠</span>
          )}
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
          {!skipped && isRejected && (
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--yellow)', marginTop: 2 }}>
              Rechazada · toca ⓘ para ver por qué
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

      {/* "Me quedé en casa" toggle — solo tareas skippable, solo el hijo y nunca en aprobadas */}
      {task.skippable && role === 'hijo' && !isApproved && (
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

      {/* Solo lectura de "Me quedé en casa" (cierra la fila redondeada):
          siempre para el padre; para el hijo solo si la tarea ya está aprobada. */}
      {task.skippable && skipped && (role === 'padre' || isApproved) && (
        <div style={{
          padding: '7px 16px', borderRadius: '0 0 16px 16px',
          border: '1.5px solid var(--line)', borderTop: 'none',
          background: 'var(--teal-soft)', color: 'var(--teal)',
          fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span>✓</span>
          {role === 'padre' ? 'Se quedó en casa' : 'Te quedaste en casa'} (no cuenta para el %)
        </div>
      )}
    </div>
  );
}
