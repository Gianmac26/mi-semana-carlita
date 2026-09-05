export interface Task {
  id: string;
  icon: string;
  label: string;
  time: string;
}

export const WEEKDAY_TASKS: Task[] = [
  { id: 'llegada_cole', icon: '🏫', label: 'Llegada al cole a tiempo', time: '7:45 am' },
  { id: 'llegada',      icon: '🏠', label: 'Llegada a casa a tiempo', time: '2:20 pm' },
  { id: 'almuerzo',     icon: '🍽️', label: 'Cambio de ropa + almuerzo', time: '2:30–3:00 pm' },
  { id: 'ducha',        icon: '🚿', label: 'Ducha y lista para estudiar', time: '3:30 pm' },
  { id: 'estudio',      icon: '📖', label: 'Estudio sin celular', time: '4:00–5:30 pm' },
  { id: 'regreso',      icon: '🌟', label: 'Regreso de salir con amigas', time: '7:30 pm' },
  { id: 'dormir',       icon: '🌙', label: 'Celular fuera de la cama y a dormir', time: '10:00 pm' },
];

export const SATURDAY_TASKS: Task[] = [
  { id: 'cuadernos',   icon: '📓', label: 'Revisión de cuadernos con mamá', time: '' },
  { id: 'regreso_sab', icon: '🌆', label: 'Regreso de salir con amigas', time: '8:00 pm' },
];

export const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type DayKey = typeof DAY_KEYS[number];

export const DAY_LABELS: Record<DayKey, string> = {
  mon: 'Lun', tue: 'Mar', wed: 'Mié', thu: 'Jue', fri: 'Vie', sat: 'Sáb', sun: 'Dom',
};

export function getTasksForDay(day: DayKey): Task[] {
  if (day === 'sat') return SATURDAY_TASKS;
  if (day === 'sun') return [];
  return WEEKDAY_TASKS;
}

export function getDayCompletion(
  dayState: Record<string, unknown> | undefined,
  day: DayKey,
): number {
  const tasks = getTasksForDay(day);
  if (!tasks.length || !dayState) return 0;
  const done = tasks.filter(t => dayState[t.id] === true).length;
  return Math.round((done / tasks.length) * 100);
}
