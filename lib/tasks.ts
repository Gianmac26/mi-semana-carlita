import type { DbTask, TaskCompletion } from '@/lib/types';

// Legacy seed data — used only by the migration script
export interface Task {
  id: string;
  icon: string;
  label: string;
  time: string;
  skippable?: boolean;
}

export const WEEKDAY_TASKS: Task[] = [
  { id: 'llegada_cole', icon: '🏫', label: 'Llegada al cole a tiempo', time: '7:45 am' },
  { id: 'llegada',      icon: '🏠', label: 'Llegada a casa a tiempo', time: '2:20 pm' },
  { id: 'almuerzo',     icon: '🍽️', label: 'Cambio de ropa + almuerzo', time: '2:30–3:00 pm' },
  { id: 'ducha',        icon: '🚿', label: 'Ducha y lista para estudiar', time: '3:30 pm' },
  { id: 'estudio',      icon: '📖', label: 'Estudio sin celular', time: '4:00–5:30 pm' },
  { id: 'regreso',      icon: '🌟', label: 'Regreso de salir con amigas', time: '7:30 pm', skippable: true },
  { id: 'dormir',       icon: '🌙', label: 'Celular fuera de la cama y a dormir', time: '10:00 pm' },
];

export const SATURDAY_TASKS: Task[] = [
  { id: 'cuadernos',   icon: '📓', label: 'Revisión de cuadernos con mamá', time: '' },
  { id: 'regreso_sab', icon: '🌆', label: 'Regreso de salir con amigas', time: '8:00 pm', skippable: true },
];

export const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type DayKey = typeof DAY_KEYS[number];

export const DAY_LABELS: Record<DayKey, string> = {
  mon: 'Lun', tue: 'Mar', wed: 'Mié', thu: 'Jue', fri: 'Vie', sat: 'Sáb', sun: 'Dom',
};

/** Returns the subset of tasks that apply to a given day. */
export function getTasksForDayFromList(tasks: DbTask[], day: DayKey): DbTask[] {
  return tasks.filter(t => t.active && t.days.includes(day));
}

/**
 * % de cumplimiento de un día (0..100).
 * - Sin tareas → 0.
 * - Las saltadas ("Me quedé en casa") no cuentan; si todas están saltadas → 100.
 * - Hechas = las que están en completedTaskIds (task_completions).
 */
export function getDayCompletion(
  completedTaskIds: ReadonlySet<string>,
  skippedTaskSlugs: ReadonlySet<string>,
  tasks: DbTask[],
): number {
  if (!tasks.length) return 0;
  const active = tasks.filter(t => !skippedTaskSlugs.has(t.slug));
  if (!active.length) return 100;
  const done = active.filter(t => completedTaskIds.has(t.id)).length;
  return Math.round((done / active.length) * 100);
}

/** Agrupa las completions de UNA semana por día: day → Set<task_id>. */
export function completedIdsByDay(completions: TaskCompletion[], weekKey: string): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const c of completions) {
    if (c.week_key !== weekKey) continue;
    const set = map.get(c.day) ?? new Set<string>();
    set.add(c.task_id);
    map.set(c.day, set);
  }
  return map;
}

/** Slugs saltados de un día, leídos del JSONB de weekly_state (`skipped` sigue ahí). */
export function getSkippedSlugs(dayState: Record<string, unknown> | undefined): Set<string> {
  const skipped = (dayState?.skipped ?? {}) as Record<string, boolean>;
  return new Set(Object.keys(skipped).filter(slug => skipped[slug]));
}

export const EMPTY_SET: ReadonlySet<string> = new Set<string>();
