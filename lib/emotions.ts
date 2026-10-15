import type { EmotionLabel, EmotionLog } from '@/lib/types';
import { hoyLima, diffDays } from '@/lib/gamification';

export interface EmotionMeta {
  key: EmotionLabel | null;
  emoji: string;
  label: string;
  /** Palabras cercanas para ayudar a elegir ("contento, orgulloso, tranquilo"). */
  examples: string;
}

// Las 6 emociones básicas de Ekman.
export const EMOTIONS: (EmotionMeta & { key: EmotionLabel })[] = [
  { key: 'alegria',  emoji: '😊', label: 'Alegría',  examples: 'contento, orgulloso, tranquilo'  },
  { key: 'tristeza', emoji: '😢', label: 'Tristeza', examples: 'desanimado, solo, decepcionado'  },
  { key: 'miedo',    emoji: '😨', label: 'Miedo',    examples: 'nervioso, preocupado, ansioso'   },
  { key: 'ira',      emoji: '😠', label: 'Ira',      examples: 'enojado, frustrado, molesto'     },
  { key: 'asco',     emoji: '🤢', label: 'Asco',     examples: 'desagrado, rechazo, incomodidad' },
  { key: 'sorpresa', emoji: '😮', label: 'Sorpresa', examples: 'asombro, sorprendido'            },
];

export const EMOTION_FALLBACK: EmotionMeta = { key: null, emoji: '❔', label: 'Sin registrar', examples: '' };

export function getEmotionMeta(key: EmotionLabel): EmotionMeta {
  return EMOTIONS.find(e => e.key === key) ?? EMOTION_FALLBACK;
}

/**
 * Bienestar derivado (1-5) a partir de emoción + intensidad.
 * Debe coincidir con emotion_wellbeing() en 011_emotion_ekman.sql.
 * Tabla provisional, pendiente de validar con un psicólogo.
 *   tristeza, miedo, ira, asco: intensidad 1-2 → 3 · 3-4 → 2 · 5 → 1
 *   alegria:                    intensidad 1-2 → 4 · 3-5 → 5
 *   sorpresa:                   cualquier intensidad → 3
 */
export function emotionWellbeing(emotion: EmotionLabel, intensity: number): number {
  switch (emotion) {
    case 'tristeza':
    case 'miedo':
    case 'ira':
    case 'asco':
      return intensity <= 2 ? 3 : intensity <= 4 ? 2 : 1;
    case 'alegria':
      return intensity <= 2 ? 4 : 5;
    default:
      return 3;
  }
}

/**
 * Devuelve true si los 3 registros más recientes dentro de los últimos 7 días
 * (Lima) tienen bienestar <= 2 (emotionWellbeing). Se permiten días sin registro entre ellos.
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
  return enVentana.slice(0, 3).every(l => emotionWellbeing(l.emotion, l.intensity) <= 2);
}
