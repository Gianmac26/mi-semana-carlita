export interface EnsayoState {
  start: string;
  end: string;
}

export interface DayState {
  notes?: string;
  ensayo?: EnsayoState;
  skipped?: Record<string, boolean>;
  [taskId: string]: boolean | string | EnsayoState | Record<string, boolean> | undefined;
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

export interface AppState {
  weeks: { [weekKey: string]: WeekData };
  events: AppEvent[];
  miMundo?: MiMundo;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
