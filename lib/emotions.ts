import type { EmotionLabel, EmotionLog } from '@/lib/types';
import { hoyLima, diffDays } from '@/lib/gamification';

export interface EmotionMeta {
  key: EmotionLabel | null;
  emoji: string;
  label: string;
}

export const EMOTIONS: EmotionMeta[] = [
  { key: 'alegria',   emoji: '😊', label: 'Alegría'   },
  { key: 'tristeza',  emoji: '😢', label: 'Tristeza'  },
  { key: 'enojo',     emoji: '😠', label: 'Enojo'     },
  { key: 'miedo',     emoji: '😨', label: 'Miedo'     },
  { key: 'calma',     emoji: '😌', label: 'Calma'     },
  { key: 'ansiedad',  emoji: '😰', label: 'Ansiedad'  },
  { key: 'orgullo',   emoji: '😎', label: 'Orgullo'   },
  { key: 'cansancio', emoji: '😩', label: 'Cansancio' },
];

// Emojis distintos de los de EMOTIONS para no confundir escala y emoción.
export const MOOD_FACES = ['😞', '😕', '😐', '🙂', '😄'];

export const EMOTION_FALLBACK: EmotionMeta = { key: null, emoji: '❔', label: 'Sin registrar' };

export function getEmotionMeta(key: EmotionLabel): EmotionMeta {
  return EMOTIONS.find(e => e.key === key) ?? EMOTION_FALLBACK;
}

export function getMoodFace(mood: number): string {
  const idx = Math.min(4, Math.max(0, mood - 1));
  return MOOD_FACES[idx];
}

/**
 * Devuelve true si los 3 registros más recientes dentro de los últimos 7 días
 * (Lima) tienen mood <= 2. Se permiten días sin registro entre ellos.
 * Si hay menos de 3 registros en la ventana, devuelve false.
 * log_date ya es fecha Lima ('YYYY-MM-DD'): se compara como texto, sin Date.
 */
export function needsSupportCard(recentLogs: EmotionLog[]): boolean {
  const hoy = hoyLima();

  // Ventana: hoy (0) + 6 días hacia atrás. Fechas futuras (d < 0) quedan fuera.
  const enVentana = recentLogs
    .filter(l => {
      const d = diffDays(l.log_date, hoy);
      return d >= 0 && d <= 6;
    })
    .sort((a, b) => b.log_date.localeCompare(a.log_date));

  if (enVentana.length < 3) return false;
  return enVentana.slice(0, 3).every(l => l.mood <= 2);
}
