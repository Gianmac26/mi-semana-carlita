export interface DayState {
  notes?: string;
  skipped?: Record<string, boolean>;
  [taskId: string]: boolean | string | Record<string, boolean> | undefined;
}

export interface WeekData {
  [day: string]: DayState;
}

export interface AppEvent {
  id: string;
  date: string;
  time: string;
  label: string;
}

export interface MiMundo {
  padres?: string;      // Lo que me gustaría hacer con mis padres
  cancion?: string;     // La canción que más me gusta ahora
  risa?: string;        // Lo que más me hizo reír esta semana
  aprendi?: string;     // Algo que aprendí de la vida
  preocupa?: string;    // Algo que me da vueltas en la cabeza
  meta?: string;        // Una meta que tengo para este mes
  pedido?: string;      // Si pudiera pedirle algo a mis papás
}

export interface MiMundoEntry {
  id: string;
  family_id: string;
  author_id: string;
  key: string;
  value: string;
  week_key: string;
  created_at: string;
  updated_at: string;
}

// Respuestas agrupadas por key, ordenadas por week_key DESC
export type MiMundoHistory = Record<string, MiMundoEntry[]>;

export interface AppState {
  weeks: { [weekKey: string]: WeekData };
  events: AppEvent[];
  miMundo?: MiMundo;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface Profile {
  id: string;
  family_id: string;
  role: 'padre' | 'hijo';
  display_name: string;
  email: string;
}

export interface DbTask {
  id: string;
  family_id: string;
  slug: string;
  days: string[];
  icon: string;
  label: string;
  time: string;
  skippable: boolean;
  sort_order: number;
  active: boolean;
}

export interface InviteCode {
  id: string;
  family_id: string;
  code: string;
  role: 'padre' | 'hijo';
  expires_at: string;
  used_by: string | null;
}

export interface UserPreferences {
  user_id: string;
  theme_palette: string;
  theme_mode: 'light' | 'dark' | 'auto';
  avatar_url: string | null;
  avatar_type: 'preset' | 'photo';
  updated_at: string;
}

// ── Bienestar (Módulo 2 — Fase 3) ────────────────────────────────────────────

export type WellnessCategory = 'crisis' | 'tca' | 'bullying' | 'violencia' | 'emociones' | 'valores';

export interface HelplineRef {
  label: string;
  tel?: string;
  url?: string;
  note?: string;
}

export interface WellnessResource {
  id: string;
  slug: string;
  category: WellnessCategory;
  title: string;
  emoji: string;
  summary: string;
  body_markdown: string;
  action_steps: string[];
  helpline_refs: HelplineRef[];
  sort_order: number;
}

export interface GlobalResource {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body_markdown: string;
  emoji: string;
}

// ── Task completions (Módulo 1 — Fase 1) ─────────────────────────────────────

export type CompletionStatus = 'done' | 'approved' | 'rejected';

export interface TaskCompletion {
  id: string;
  task_id: string;
  family_id: string;
  user_id: string;
  week_key: string;
  day: string;
  status: CompletionStatus;
  evidence_url: string | null;
  notes: string | null;
  completed_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  /** Feedback del padre al aprobar/rechazar (migración 007). */
  comment: string | null;
  created_at: string;
  updated_at: string;
}

// ── Gamificación (Fase 3 — migración 008) ────────────────────────────────────

export type PointReason =
  | 'task_approved'
  | 'streak_bonus'
  | 'badge_earned'
  | 'contract_signed'
  | 'emotion_logged';

export interface PointsLedgerEntry {
  id: string;
  user_id: string;
  family_id: string;
  amount: number;
  reason: PointReason;
  ref_id: string | null;
  created_at: string;
}

export interface Streak {
  user_id: string;
  family_id: string;
  current: number;
  best: number;
  last_active_date: string | null;
  updated_at: string;
}

export interface BadgeEntry {
  id: string;
  user_id: string;
  family_id: string;
  badge_slug: string;
  earned_at: string;
  notified_at: string | null;
}

// ── Contrato familiar (Fase 4 — migración 009) ───────────────────────────────

export interface FamilyContract {
  id: string;
  family_id: string;
  version: number;
  intro_text: string;
  rules_snapshot: { emoji: string; text: string }[];
  active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface ContractSignature {
  id: string;
  contract_id: string;
  family_id: string;
  user_id: string;
  signed_at: string;
}

// ── Tracking emocional (Módulo 2, Fase 4 — migración 010) ────────────────────

// Las 6 emociones básicas de Ekman (migración 011).
export type EmotionLabel =
  | 'alegria' | 'tristeza' | 'miedo' | 'ira' | 'asco' | 'sorpresa';

export interface EmotionLog {
  id: string;
  user_id: string;
  family_id: string;
  log_date: string;
  /** Intensidad de la emoción elegida, 1-5 (no es bienestar; ver emotionWellbeing). */
  intensity: number;
  emotion: EmotionLabel;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export type EmotionTrendLabel =
  | 'sin-registros'
  | 'pocos-registros'
  | 'tranquila'
  | 'mixta'
  | 'dificil'
  | 'muy-dificil';

export interface EmotionTrendWeek {
  week_start: string;
  week_end: string;
  label: EmotionTrendLabel;
}

export interface EmotionTrend {
  user_id: string;
  weeks: EmotionTrendWeek[];
}
