import type { DbTask } from '@/lib/types';

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

/** Calculates completion % for one day given dynamic tasks from DB. */
export function getDayCompletion(
  dayState: Record<string, unknown> | undefined,
  tasks: DbTask[],
): number {
  if (!tasks.length || !dayState) return 0;
  const skipped = (dayState.skipped ?? {}) as Record<string, boolean>;
  const active = tasks.filter(t => !skipped[t.slug]);
  if (!active.length) return 100;
  const done = active.filter(t => dayState[t.slug] === true).length;
  return Math.round((done / active.length) * 100);
}
