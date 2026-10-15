import type { PointsLedgerEntry, Streak } from '@/lib/types';

const LIMA_TZ = 'America/Lima';

const limaDateFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: LIMA_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** 'YYYY-MM-DD' del día actual en zona America/Lima. */
export function hoyLima(): string {
  return limaDateFmt.format(new Date());
}

/** 'YYYY-MM-DD' en zona America/Lima de un timestamp ISO arbitrario. */
export function limaDateOf(iso: string): string {
  return limaDateFmt.format(new Date(iso));
}

/** Días entre dos fechas 'YYYY-MM-DD' (b - a). Mediodía para esquivar saltos de horario. */
export function diffDays(a: string, b: string): number {
  const ta = new Date(a + 'T12:00:00').getTime();
  const tb = new Date(b + 'T12:00:00').getTime();
  return Math.round((tb - ta) / (1000 * 60 * 60 * 24));
}

/** Suma de todos los puntos del ledger. */
export function getTotalPoints(ledger: PointsLedgerEntry[]): number {
  return ledger.reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Racha "viva": devuelve current si se cumple alguna de estas dos condiciones (Lima),
 * 0 si ninguna:
 *  - last_active_date (día de la TAREA, ver migración 008) es hoy o ayer.
 *  - updated_at (cuándo el trigger procesó la última aprobación) es hoy o ayer.
 * La aprobación del padre puede llegar con retraso: sin considerar updated_at, una
 * revisión tardía mostraría racha 0 aunque el trigger acabe de subirla.
 * Decisión de producto documentada (TODO.md): con un backlog viejo la racha puede
 * verse viva un par de días aunque la cadena esté rota en rigor.
 */
export function getCurrentStreak(streak: Streak | null): number {
  if (!streak || !streak.last_active_date || streak.current === 0) return 0;
  const hoy = hoyLima();
  if (diffDays(streak.last_active_date, hoy) <= 1) return streak.current;
  if (diffDays(limaDateOf(streak.updated_at), hoy) <= 1) return streak.current;
  return 0;
}

/** Formato compacto de puntos: 1234 → "1.2k". */
export function formatPoints(n: number): string {
  if (n < 1000) return String(n);
  return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
}

/** Suma n días a una fecha 'YYYY-MM-DD' trabajando solo en UTC (no depende de la zona horaria del dispositivo). */
export function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
