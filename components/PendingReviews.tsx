'use client';
import { useMemo, useRef, useState } from 'react';
import BottomSheet from '@/components/BottomSheet';
import type { DbTask, Profile, TaskCompletion } from '@/lib/types';

interface Props {
  pendingReviews: TaskCompletion[];
  tasks: DbTask[];
  childrenProfiles: Profile[];
  onApproveCompletion: (id: string, comment?: string) => Promise<void>;
  onRejectCompletion: (id: string, comment: string) => Promise<void>;
}

const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_NAMES: Record<string, string> = {
  mon: 'Lunes', tue: 'Martes', wed: 'Miércoles', thu: 'Jueves', fri: 'Viernes', sat: 'Sábado', sun: 'Domingo',
};

const fmtDay  = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short' });
const fmtHour = new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
const shortDate = (d: Date) => fmtDay.format(d).replace(/\.$/, '');

/** Fecha del día dentro de la semana: week_key es el lunes (YYYY-MM-DD). */
function dateOfDay(weekKey: string, day: string): Date {
  const d = new Date(weekKey + 'T12:00:00');
  d.setDate(d.getDate() + Math.max(0, DAY_ORDER.indexOf(day)));
  return d;
}

interface Group { key: string; userId: string; weekKey: string; day: string; items: TaskCompletion[] }

const BTN_BASE: React.CSSProperties = {
  minHeight: 44, borderRadius: 12, cursor: 'pointer',
  fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 14,
};

export default function PendingReviews({ pendingReviews, tasks, childrenProfiles, onApproveCompletion, onRejectCompletion }: Props) {
  // Requests en vuelo por completion id: el ref es el guard síncrono contra doble tap
  // (mismo patrón que togglesInFlight); busyIds es su espejo en state para renderizar los disabled.
  const inFlight = useRef<Set<string>>(new Set());
  const [busyIds, setBusyIds] = useState<ReadonlySet<string>>(new Set());

  const [rejecting, setRejecting] = useState<TaskCompletion | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [rejectError, setRejectError] = useState('');

  const taskById = useMemo(() => new Map(tasks.map(t => [t.id, t])), [tasks]);
  const nameById = useMemo(() => new Map(childrenProfiles.map(p => [p.id, p.display_name])), [childrenProfiles]);

  // pendingReviews ya viene ordenado por completed_at desc → los grupos quedan
  // ordenados por su completion más reciente, y los items dentro también.
  const groups = useMemo(() => {
    const map = new Map<string, Group>();
    for (const c of pendingReviews) {
      const key = `${c.user_id}__${c.week_key}__${c.day}`;
      const g = map.get(key) ?? { key, userId: c.user_id, weekKey: c.week_key, day: c.day, items: [] };
      g.items.push(c);
      map.set(key, g);
    }
    return [...map.values()];
  }, [pendingReviews]);

  async function run(ids: string[], action: (id: string) => Promise<void>) {
    const free = ids.filter(id => !inFlight.current.has(id));
    if (!free.length) return;
    free.forEach(id => inFlight.current.add(id));
    setBusyIds(new Set(inFlight.current));
    try {
      await Promise.all(free.map(action));
    } finally {
      free.forEach(id => inFlight.current.delete(id));
      setBusyIds(new Set(inFlight.current));
    }
  }

  const approve    = (id: string) => run([id], i => onApproveCompletion(i));
  const approveAll = (g: Group)   => run(g.items.map(c => c.id), i => onApproveCompletion(i));

  function openReject(c: TaskCompletion) {
    setRejecting(c);
    setRejectComment('');
    setRejectError('');
  }

  function confirmReject() {
    if (!rejecting) return;
    const comment = rejectComment.trim();
    if (!comment) { setRejectError('Escribe el motivo: tu hijo/a lo va a ver.'); return; }
    const id = rejecting.id;
    setRejecting(null);
    run([id], i => onRejectCompletion(i, comment));
  }

  const rejectingTask = rejecting ? taskById.get(rejecting.task_id) : undefined;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h4 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 16, color: 'var(--ink)', margin: 0 }}>
          ✓ Por revisar
        </h4>
        <span style={{
          minWidth: 28, padding: '3px 10px', borderRadius: 20, textAlign: 'center',
          background: pendingReviews.length ? 'var(--yellow-soft)' : 'var(--ok-soft)',
          color: pendingReviews.length ? 'var(--yellow)' : 'var(--ok)',
          fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 13,
        }}>
          {pendingReviews.length}
        </span>
      </div>

      {/* Estado vacío */}
      {groups.length === 0 && (
        <div style={{
          background: 'var(--bg-card)', border: '1.5px solid var(--line)', borderRadius: 16,
          padding: '28px 16px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>😌</div>
          <p style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 15, color: 'var(--ok)', margin: 0 }}>
            ✓ Todo al día.
          </p>
          <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', margin: '4px 0 0' }}>
            No hay tareas por revisar.
          </p>
        </div>
      )}

      {/* Grupos (hijo + día) */}
      {groups.map(g => {
        const pendingInGroup = g.items.filter(c => !busyIds.has(c.id)).length;
        return (
          <section key={g.key} style={{
            border: '1.5px solid var(--line)', borderRadius: 16, overflow: 'hidden',
            marginBottom: 14, background: 'var(--bg-card)',
          }}>
            <header style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap',
              padding: '10px 12px 10px 14px', background: 'var(--bg)', borderBottom: '1.5px solid var(--line)',
            }}>
              <span style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>
                {nameById.get(g.userId) ?? 'Hijo/a'} · {DAY_NAMES[g.day] ?? g.day} {shortDate(dateOfDay(g.weekKey, g.day))}
              </span>
              {g.items.length > 1 && (
                <button
                  onClick={() => approveAll(g)}
                  disabled={pendingInGroup === 0}
                  style={{
                    ...BTN_BASE, padding: '0 14px', border: '1.5px solid var(--ok)',
                    background: 'var(--ok-soft)', color: 'var(--ok)', fontSize: 13,
                    opacity: pendingInGroup === 0 ? 0.5 : 1,
                  }}
                >
                  Aprobar todas ({g.items.length})
                </button>
              )}
            </header>

            {g.items.map((c, i) => {
              const task = taskById.get(c.task_id);
              const busy = busyIds.has(c.id);
              const completed = new Date(c.completed_at);
              return (
                <div key={c.id} style={{
                  padding: '12px 14px', borderTop: i === 0 ? 'none' : '1px solid var(--line)',
                  opacity: busy ? 0.55 : 1, transition: 'opacity 0.15s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{task?.icon ?? '📋'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>
                        {task?.label ?? 'Tarea eliminada'}
                        {task?.time && <span style={{ fontWeight: 500, fontSize: 12, color: 'var(--ink-soft)' }}> · {task.time}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>
                        Completada el {shortDate(completed)} a las {fmtHour.format(completed)}
                      </div>
                    </div>
                  </div>

                  {c.notes && (
                    <p style={{
                      fontSize: 13.5, color: 'var(--ink)', background: 'var(--bg)', borderRadius: 10,
                      padding: '8px 10px', margin: '0 0 10px', whiteSpace: 'pre-wrap',
                    }}>
                      {c.notes}
                    </p>
                  )}

                  {/* 2 columnas; se apilan solas cuando no entran 2×140px (pantallas < ~360px) */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
                    <button
                      onClick={() => approve(c.id)}
                      disabled={busy}
                      style={{ ...BTN_BASE, border: 'none', background: 'var(--ok)', color: 'var(--on-accent)', cursor: busy ? 'default' : 'pointer' }}
                    >
                      ✓ Aprobar
                    </button>
                    <button
                      onClick={() => openReject(c)}
                      disabled={busy}
                      aria-haspopup="dialog"
                      style={{ ...BTN_BASE, border: '1.5px solid var(--error)', background: 'var(--bg-card)', color: 'var(--error)', cursor: busy ? 'default' : 'pointer' }}
                    >
                      ✗ Rechazar
                    </button>
                  </div>
                </div>
              );
            })}
          </section>
        );
      })}

      {/* Rechazo: comentario obligatorio */}
      <BottomSheet
        open={rejecting !== null}
        onClose={() => setRejecting(null)}
        zIndex={300}
        title={`Rechazar ${rejectingTask?.label ?? 'tarea'}`}
        ariaLabel="Rechazar tarea"
      >
        <label htmlFor="reject-comment" style={{ display: 'block', fontSize: 13.5, color: 'var(--ink-soft)', marginBottom: 8 }}>
          Motivo (obligatorio)
        </label>
        <textarea
          id="reject-comment"
          value={rejectComment}
          onChange={e => { setRejectComment(e.target.value); if (rejectError) setRejectError(''); }}
          placeholder="¿Por qué lo rechazas? El hijo verá este mensaje."
          rows={4}
          aria-invalid={rejectError ? true : undefined}
          aria-describedby={rejectError ? 'reject-error' : undefined}
          style={{
            width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 12, resize: 'vertical',
            border: `1.5px solid ${rejectError ? 'var(--error)' : 'var(--line)'}`,
            background: 'var(--bg-card)', color: 'var(--ink)', fontFamily: 'var(--font-body)', fontSize: 15, outline: 'none',
          }}
        />
        {rejectError && (
          <p id="reject-error" role="alert" style={{ color: 'var(--error)', fontSize: 13, margin: '6px 0 0' }}>
            {rejectError}
          </p>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginTop: 16 }}>
          <button
            onClick={() => setRejecting(null)}
            style={{ ...BTN_BASE, minHeight: 48, border: '1.5px solid var(--line)', background: 'var(--bg-card)', color: 'var(--ink-soft)' }}
          >
            Cancelar
          </button>
          <button
            onClick={confirmReject}
            style={{ ...BTN_BASE, minHeight: 48, border: 'none', background: 'var(--error)', color: 'var(--on-accent)' }}
          >
            Rechazar
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
