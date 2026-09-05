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

export interface AppState {
  weeks: { [weekKey: string]: WeekData };
  events: AppEvent[];
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
