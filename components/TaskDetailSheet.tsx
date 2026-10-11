'use client';
import BottomSheet from '@/components/BottomSheet';
import type { DbTask, TaskCompletion } from '@/lib/types';

interface Props {
  task: DbTask | null;
  day: string | null;
  role: 'padre' | 'hijo';
  completion: TaskCompletion | null;
  /** "Me quedé en casa": la tarea no se puede marcar (igual que en la lista). */
  skipped: boolean;
  onClose: () => void;
  onToggle: () => void;
}

const DAY_NAMES: Record<string, string> = {
  mon: 'Lunes', tue: 'Martes', wed: 'Miércoles', thu: 'Jueves', fri: 'Viernes', sat: 'Sábado', sun: 'Domingo',
};

const fmtDay  = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short' });
const fmtHour = new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
const fmtFull = new Intl.DateTimeFormat('es-PE', { dateStyle: 'long', timeStyle: 'short' });

/** "10 oct" (es-PE devuelve "10 oct.", quitamos el punto final). */
function shortDate(iso: string) {
  return fmtDay.format(new Date(iso)).replace(/\.$/, '');
}

const sectionLabel = {
  fontSize: 11, color: 'var(--ink-soft)', fontWeight: 700,
  textTransform: 'uppercase' as const, letterSpacing: 0.5, margin: '20px 0 8px',
};

export default function TaskDetailSheet({ task, day, role, completion, skipped, onClose, onToggle }: Props) {
  if (!task || !day) return null;

  const done = completion !== null;

  return (
    <BottomSheet
      open
      onClose={onClose}
      zIndex={300}
      title={`${task.icon} ${task.label}`}
      ariaLabel={task.label}
    >
      {/* Día + horario */}
      <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: 0 }}>
        {DAY_NAMES[day] ?? day}{task.time ? ` · ${task.time}` : ''}
      </p>

      {/* Estado */}
      <p style={sectionLabel}>Estado</p>
      <div
        role="status"
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 16px', borderRadius: 16,
          background: skipped ? 'var(--teal-soft)' : done ? 'var(--ok-soft)' : 'var(--bg)',
          color: skipped ? 'var(--teal)' : done ? 'var(--ok)' : 'var(--ink-soft)',
          fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 15.5, lineHeight: 1.35,
        }}
      >
        {skipped
          ? <>🏠 {role === 'padre' ? 'Se quedó en casa' : 'Me quedé en casa'} (no cuenta para el %)</>
          : done
            ? <>✓ Completada el {shortDate(completion.completed_at)} a las {fmtHour.format(new Date(completion.completed_at))}</>
            : <>○ Pendiente</>}
      </div>

      {/* Notas */}
      {completion?.notes && (
        <>
          <p style={sectionLabel}>Notas</p>
          <div style={{
            padding: '12px 14px', borderRadius: 14, background: 'var(--bg)',
            fontSize: 14.5, lineHeight: 1.5, color: 'var(--ink)', whiteSpace: 'pre-wrap',
          }}>
            {completion.notes}
          </div>
        </>
      )}

      {/* Acción — solo el hijo; el padre solo lee hasta Fase 2 */}
      {role === 'hijo' && !skipped && (
        <button
          onClick={onToggle}
          style={{
            width: '100%', minHeight: 56, marginTop: 24, borderRadius: 16, cursor: 'pointer',
            border: done ? '1.5px solid var(--line)' : 'none',
            background: done ? 'var(--bg-card)' : 'var(--ok)',
            color: done ? 'var(--ink-soft)' : 'var(--on-accent)',
            fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 16,
          }}
        >
          {done ? 'Desmarcar' : '✓ Marcar como completada'}
        </button>
      )}

      {/* Timestamp completo */}
      {completion && (
        <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', textAlign: 'center', margin: '16px 0 0' }}>
          Última actualización: {fmtFull.format(new Date(completion.updated_at))}
        </p>
      )}
    </BottomSheet>
  );
}
