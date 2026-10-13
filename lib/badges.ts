// Catálogo de insignias. Vive en código (no en DB): no cambia dinámicamente.
// Los slugs deben coincidir con los que otorga award_on_approval() (migración 008).

export type BadgeSlug =
  | 'first_task'
  | 'week_complete'
  | '7_day_streak'
  | '30_day_streak'
  | 'contract_signed'
  | 'first_emotion_log'
  | 'helpline_aware';

export interface BadgeDef {
  slug: BadgeSlug;
  emoji: string;
  title: string;
  description: string;
  active: boolean;
}

export const BADGES: BadgeDef[] = [
  { slug: 'first_task',        emoji: '🌱', title: 'Primer paso',         description: 'Tu primera tarea aprobada',                      active: true },
  { slug: 'week_complete',     emoji: '📅', title: 'Semana completa',     description: '5 tareas aprobadas en una semana',               active: true },
  { slug: '7_day_streak',      emoji: '🔥', title: 'Una semana fuerte',   description: '7 días consecutivos con al menos 1 aprobación',  active: true },
  { slug: '30_day_streak',     emoji: '🏆', title: 'Constancia total',    description: '30 días consecutivos con al menos 1 aprobación', active: true },
  { slug: 'contract_signed',   emoji: '🤝', title: 'Compromiso familiar', description: 'Firmaste el contrato familiar',                  active: false },
  { slug: 'first_emotion_log', emoji: '💭', title: 'Primer registro',     description: 'Registraste tu primera emoción',                 active: false },
  { slug: 'helpline_aware',    emoji: '💙', title: 'Sé pedir ayuda',      description: 'Conoces las líneas de ayuda disponibles',        active: false },
];

export function getBadge(slug: BadgeSlug): BadgeDef | undefined {
  return BADGES.find(b => b.slug === slug);
}
