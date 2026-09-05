export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatWeekKey(monday: Date): string {
  return monday.toISOString().split('T')[0];
}

export function formatDateRange(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const locale = 'es-PE';
  return `${monday.toLocaleDateString(locale, opts)} – ${sunday.toLocaleDateString(locale, opts)}`;
}

export function getTodayDayKey(): string {
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return days[new Date().getDay()];
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function formatEventDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
}
