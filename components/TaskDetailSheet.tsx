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

/** "10 oct a las 14:23" */
function dateAndHour(iso: string) {
  return `${shortDate(iso)} a las ${fmtHour.format(new Date(iso))}`;
}

const sectionLabel = {
  fontSize: 11, color: 'var(--ink-soft)', fontWeight: 700,
  textTransform: 'uppercase' as const, letterSpacing: 0.5, margin: '20px 0 8px',
};

const reviewBox = {
  padding: '12px 14px', borderRadius: 14, fontSize: 13.5, lineHeight: 1.5,
};

export default function TaskDetailSheet({ task, day, role, completion, skipped, onClose, onToggle }: Props) {
  if (!task || !day) return null;

  const status     = completion?.status ?? null;
  const isDone     = status === 'done';
  const isApproved = status === 'approved';
  const isRejected = status === 'rejected';
  // Hecha = done o approved (rejected no cuenta, igual que en TaskItem y el %).
  const counts     = isDone || isApproved;

  // El hijo puede actuar salvo en saltadas y aprobadas.
  const canAct = role === 'hijo' && !skipped && !isApproved;
  const actionLabel = isDone ? 'Desmarcar' : isRejected ? '✓ Marcar otra vez' : '✓ Marcar como completada';

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
          background: skipped ? 'var(--teal-soft)' : counts ? 'var(--ok-soft)' : 'var(--bg)',
          color: skipped ? 'var(--teal)' : counts ? 'var(--ok)' : 'var(--ink-soft)',
          fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 15.5, lineHeight: 1.35,
        }}
      >
        {skipped
          ? <>🏠 {role === 'padre' ? 'Se quedó en casa' : 'Me quedé en casa'} (no cuenta para el %)</>
          : counts && completion
            ? <>✓ Completada el {dateAndHour(completion.completed_at)}</>
            : isRejected && completion
              ? <>○ Marcada el {dateAndHour(completion.completed_at)}, falta rehacerla</>
              : <>○ Pendiente</>}
      </div>

      {/* Revisión del padre (Fase 2) */}
      {!skipped && completion && (
        <>
          <p style={sectionLabel}>Revisión</p>

          {isDone && (
            <div style={{ ...reviewBox, background: 'var(--bg)', color: 'var(--ink-soft)' }}>
              ⏳ {role === 'padre' ? 'Esperando tu revisión (desde Admin → Revisar)' : 'Esperando revisión de papá/mamá'}
            </div>
          )}

          {isApproved && (
            <div style={{ ...reviewBox, background: 'var(--ok-soft)', color: 'var(--ok)' }}>
              <div style={{ fontWeight: 700 }}>
                ✓✓ Aprobada{role === 'hijo' ? ' por papá/mamá' : ''}
                {completion.reviewed_at && <> el {dateAndHour(completion.reviewed_at)}</>}
              </div>
              {completion.comment && (
                <p style={{ margin: '6px 0 0', color: 'var(--ink)', whiteSpace: 'pre-wrap' }}>
                  “{completion.comment}”
                </p>
              )}
            </div>
          )}

          {isRejected && (
            <div style={{
              ...reviewBox, background: 'var(--yellow-soft)', color: 'var(--yellow)',
              border: '1.5px solid var(--yellow)',
            }}>
              <div style={{ fontWeight: 700 }}>
                ⚠ Rechazada
                {completion.reviewed_at && <> el {dateAndHour(completion.reviewed_at)}</>}
              </div>
              {completion.comment && (
                <p style={{ margin: '6px 0 0', color: 'var(--ink)', whiteSpace: 'pre-wrap' }}>
                  “{completion.comment}”
                </p>
              )}
              {role === 'hijo' && (
                <p style={{ margin: '8px 0 0', fontSize: 12.5, color: 'var(--ink-soft)' }}>
                  Cuando la rehagas, vuelve a marcarla.
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* Notas del hijo */}
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

      {/* Acción — solo el hijo, nunca en saltadas ni aprobadas; el padre revisa desde Admin */}
      {canAct && (
        <button
          onClick={onToggle}
          style={{
            width: '100%', minHeight: 56, marginTop: 24, borderRadius: 16, cursor: 'pointer',
            border: isDone ? '1.5px solid var(--line)' : 'none',
            background: isDone ? 'var(--bg-card)' : 'var(--ok)',
            color: isDone ? 'var(--ink-soft)' : 'var(--on-accent)',
            fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 16,
          }}
        >
          {actionLabel}
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
