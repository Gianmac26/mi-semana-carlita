// lib/themes.ts
// Source of truth for palette tokens. globals.css mirrors these values.
// Used by ThemePicker (Phase 3) and FOUC-prevention script (Phase 2).

export type PaletteId =
  | 'vibrante'
  | 'pastel'
  | 'nocturno'
  | 'minimalista'
  | 'deportivo'
  | 'rosa_suave'
  | 'azul_sereno'
  | 'neutro_elegante';

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface PaletteTokens {
  bg: string;
  'bg-card': string;
  ink: string;
  'ink-soft': string;
  accent: string;
  'accent-soft': string;
  teal: string;
  'teal-soft': string;
  yellow: string;
  'yellow-soft': string;
  lilac: string;
  'lilac-soft': string;
  line: string;
  ok: string;
  'ok-soft': string;
  'on-accent': string;
  error: string;
  'error-soft': string;
}

export interface Palette {
  id: PaletteId;
  name: string;
  emoji: string;
  light: PaletteTokens;
  dark: PaletteTokens;
}

// ── Contrast notes (approximate, checked against WCAG AA) ───────────────────
// accent on bg-card (text use):    ≥4.5:1 except rosa_suave (~2.8 — preserved)
// on-accent on accent (UI button): ≥3:1
// ink on bg:                       ≥7:1
// ink-soft on bg:                  ≥4.5:1

export const PALETTES: Palette[] = [
  {
    id: 'vibrante',
    name: 'Vibrante',
    emoji: '🔥',
    light: {
      bg: '#FFF7F3',        'bg-card': '#FFFFFF',
      ink: '#1A0800',       'ink-soft': '#7A4A2A',
      accent: '#D4380D',    'accent-soft': '#FFEDE6',   // accent on white: ~4.65:1 ✓AA
      teal: '#00796B',      'teal-soft': '#E0F2F0',
      yellow: '#E0900C',    'yellow-soft': '#FFF8E1',
      lilac: '#6A1B9A',     'lilac-soft': '#F3E5F5',
      line: '#F0DDD5',
      ok: '#2E7D32',        'ok-soft': '#E8F5E9',
      'on-accent': '#fff',  error: '#C62828',  'error-soft': '#FFEBEE',
    },
    dark: {
      bg: '#1A0D07',        'bg-card': '#261505',
      ink: '#FFF3EE',       'ink-soft': '#C89070',
      accent: '#FF7043',    'accent-soft': '#3D1508',
      teal: '#26A69A',      'teal-soft': '#1B3330',
      yellow: '#FFD54F',    'yellow-soft': '#332800',
      lilac: '#BA68C8',     'lilac-soft': '#2D0F40',
      line: '#3D1A08',
      ok: '#66BB6A',        'ok-soft': '#1A3020',
      'on-accent': '#1A0D07', error: '#EF9A9A',  'error-soft': '#3D1010',
    },
  },
  {
    id: 'pastel',
    name: 'Pastel',
    emoji: '🌸',
    light: {
      bg: '#FAF8FF',        'bg-card': '#FFFFFF',
      ink: '#2C1F3A',       'ink-soft': '#6058A0',
      accent: '#6B52AE',    'accent-soft': '#EEE8FF',   // ~5.65:1 ✓AA
      teal: '#2E9E92',      'teal-soft': '#E0F5F3',
      yellow: '#C89A00',    'yellow-soft': '#FFF8E0',
      lilac: '#8B6FC0',     'lilac-soft': '#EDE4FF',
      line: '#E8E0FF',
      ok: '#4CAF50',        'ok-soft': '#F1F8E9',
      'on-accent': '#fff',  error: '#B71C1C',  'error-soft': '#FEECEC',
    },
    dark: {
      bg: '#18142A',        'bg-card': '#221C3A',
      ink: '#F0ECFF',       'ink-soft': '#B8AEDD',
      accent: '#B39DDB',    'accent-soft': '#2D2350',   // on-accent dark: ~9.2:1 ✓
      teal: '#80CBC4',      'teal-soft': '#1B3530',
      yellow: '#FFE082',    'yellow-soft': '#302A10',
      lilac: '#CE93D8',     'lilac-soft': '#2D1040',
      line: '#3A3060',
      ok: '#81C784',        'ok-soft': '#1A3020',
      'on-accent': '#1A1040', error: '#FF8A80',  'error-soft': '#3D1010',
    },
  },
  {
    id: 'nocturno',
    name: 'Nocturno',
    emoji: '🌙',
    light: {
      bg: '#F0FAFF',        'bg-card': '#FFFFFF',
      ink: '#0A1520',       'ink-soft': '#3A5060',
      accent: '#006E7D',    'accent-soft': '#E0F8FA',   // ~5.53:1 ✓AA
      teal: '#0097A7',      'teal-soft': '#E0F7FA',
      yellow: '#B06D00',    'yellow-soft': '#FFF8E1',
      lilac: '#4527A0',     'lilac-soft': '#EDE7F6',
      line: '#C8E8F0',
      ok: '#2E7D32',        'ok-soft': '#E8F5E9',
      'on-accent': '#fff',  error: '#B71C1C',  'error-soft': '#FFEBEE',
    },
    dark: {
      bg: '#050D15',        'bg-card': '#0A1825',
      ink: '#E0F7FF',       'ink-soft': '#80CFDF',
      accent: '#00E5FF',    'accent-soft': '#002030',   // on-accent dark: ink on neon
      teal: '#18FFFF',      'teal-soft': '#003030',
      yellow: '#FFEA00',    'yellow-soft': '#202000',
      lilac: '#EA80FC',     'lilac-soft': '#2A0040',
      line: '#0A2535',
      ok: '#69F0AE',        'ok-soft': '#003020',
      'on-accent': '#050D15', error: '#FF5252',  'error-soft': '#3D0808',
    },
  },
  {
    id: 'minimalista',
    name: 'Minimalista',
    emoji: '◻️',
    light: {
      bg: '#F8F9FA',        'bg-card': '#FFFFFF',
      ink: '#1A1A2E',       'ink-soft': '#4A5568',
      accent: '#1A237E',    'accent-soft': '#E8EAF6',   // ~12.8:1 ✓AAA
      teal: '#455A64',      'teal-soft': '#ECEFF1',
      yellow: '#6D5C00',    'yellow-soft': '#F9F6E0',
      lilac: '#37474F',     'lilac-soft': '#ECEFF1',
      line: '#E2E8F0',
      ok: '#276749',        'ok-soft': '#F0FAF4',
      'on-accent': '#fff',  error: '#9B1C1C',  'error-soft': '#FEF2F2',
    },
    dark: {
      bg: '#0D0E1A',        'bg-card': '#171829',
      ink: '#F8F8FF',       'ink-soft': '#9AA0B8',
      accent: '#7986CB',    'accent-soft': '#1D2050',   // ~5.7:1 on dark bg-card ✓AA
      teal: '#78909C',      'teal-soft': '#1A2025',
      yellow: '#B0A030',    'yellow-soft': '#252200',
      lilac: '#9FA8DA',     'lilac-soft': '#1A1D40',
      line: '#2A2D3E',
      ok: '#48BB78',        'ok-soft': '#1A3025',
      'on-accent': '#fff',  error: '#FC8181',  'error-soft': '#3D1010',
    },
  },
  {
    id: 'deportivo',
    name: 'Deportivo',
    emoji: '⚽',
    light: {
      bg: '#F1F8E9',        'bg-card': '#FFFFFF',
      ink: '#1A2C00',       'ink-soft': '#4A6020',
      accent: '#1B5E20',    'accent-soft': '#DCEDC8',   // ~7.24:1 ✓AAA
      teal: '#00695C',      'teal-soft': '#E0F2F0',
      yellow: '#D4AA00',    'yellow-soft': '#FFF8E1',
      lilac: '#4A148C',     'lilac-soft': '#EDE7F6',
      line: '#DCEDC8',
      ok: '#2E7D32',        'ok-soft': '#E8F5E9',
      'on-accent': '#fff',  error: '#B71C1C',  'error-soft': '#FEECEC',
    },
    dark: {
      bg: '#0A1500',        'bg-card': '#0F2005',
      ink: '#EEFFCC',       'ink-soft': '#90B870',
      accent: '#69F0AE',    'accent-soft': '#003020',   // on-accent dark: very dark green
      teal: '#64FFDA',      'teal-soft': '#003028',
      yellow: '#FFD740',    'yellow-soft': '#302800',
      lilac: '#E040FB',     'lilac-soft': '#2A0040',
      line: '#1A3010',
      ok: '#69F0AE',        'ok-soft': '#003020',
      'on-accent': '#0A1500', error: '#FF5252',  'error-soft': '#3D0808',
    },
  },
  {
    id: 'rosa_suave',
    name: 'Rosa suave',
    emoji: '🩷',
    // Preserves existing palette exactly. accent on bg-card ≈2.8:1 (design choice).
    light: {
      bg: '#FBF7FF',        'bg-card': '#FFFFFF',
      ink: '#2B2140',       'ink-soft': '#6B5C7A',
      accent: '#FF5C8A',    'accent-soft': '#FFE1EA',
      teal: '#17B3A3',      'teal-soft': '#DBF6F1',
      yellow: '#FFB627',    'yellow-soft': '#FFF3D9',
      lilac: '#9B6BF2',     'lilac-soft': '#EDE4FB',
      line: '#E8DFF5',
      ok: '#2FBE7A',        'ok-soft': '#E1F7ED',
      'on-accent': '#2B2140', error: '#e53e3e',  'error-soft': '#FBEAEA',
    },
    dark: {
      bg: '#1C1626',        'bg-card': '#251C33',
      ink: '#F5EFFF',       'ink-soft': '#C9BBDD',
      accent: '#FF7FA3',    'accent-soft': '#3A2233',
      teal: '#3DD9C7',      'teal-soft': '#1B3733',
      yellow: '#FFD874',    'yellow-soft': '#3A3120',
      lilac: '#C39BFF',     'lilac-soft': '#382A4D',
      line: '#3A2E4D',
      ok: '#57D999',        'ok-soft': '#1B3327',
      'on-accent': '#1C1626', error: '#fc8181',  'error-soft': '#3D2020',
    },
  },
  {
    id: 'azul_sereno',
    name: 'Azul sereno',
    emoji: '🌊',
    light: {
      bg: '#F5F8FF',        'bg-card': '#FFFFFF',
      ink: '#0A1A40',       'ink-soft': '#3A5080',
      accent: '#0D47A1',    'accent-soft': '#E3F2FD',   // ~8:1 ✓AAA
      teal: '#00695C',      'teal-soft': '#E0F2F0',
      yellow: '#B8860B',    'yellow-soft': '#FFF8DC',
      lilac: '#4A148C',     'lilac-soft': '#F3E5F5',
      line: '#C5D8F0',
      ok: '#1B5E20',        'ok-soft': '#E8F5E9',
      'on-accent': '#fff',  error: '#B71C1C',  'error-soft': '#FEECEC',
    },
    dark: {
      bg: '#060E1F',        'bg-card': '#0C1829',
      ink: '#EAF4FF',       'ink-soft': '#8ABADD',
      accent: '#42A5F5',    'accent-soft': '#061830',   // ~7.1:1 on dark bg-card ✓AA
      teal: '#4DB6AC',      'teal-soft': '#0A2028',
      yellow: '#FFB74D',    'yellow-soft': '#301800',
      lilac: '#9575CD',     'lilac-soft': '#1A0A40',
      line: '#0E2040',
      ok: '#66BB6A',        'ok-soft': '#0A2010',
      'on-accent': '#060E1F', error: '#EF9A9A',  'error-soft': '#3D1010',
    },
  },
  {
    id: 'neutro_elegante',
    name: 'Neutro elegante',
    emoji: '🏺',
    light: {
      bg: '#F7F5F3',        'bg-card': '#FFFFFF',
      ink: '#1A1210',       'ink-soft': '#5A4A40',
      accent: '#8D4E28',    'accent-soft': '#F5EAE2',   // ~5.93:1 ✓AA
      teal: '#5D7C6B',      'teal-soft': '#E8F2ED',
      yellow: '#A67C00',    'yellow-soft': '#FDF6DC',
      lilac: '#7B5EA7',     'lilac-soft': '#EFE8F8',
      line: '#E8DDD5',
      ok: '#3D6B4F',        'ok-soft': '#ECF5F0',
      'on-accent': '#fff',  error: '#9B1C1C',  'error-soft': '#FEF2F2',
    },
    dark: {
      bg: '#140E0A',        'bg-card': '#1E160F',
      ink: '#FBF3EE',       'ink-soft': '#C0A898',
      accent: '#D2691E',    'accent-soft': '#2A1208',   // ~5.56:1 on dark bg-card ✓AA
      teal: '#80A090',      'teal-soft': '#1A2820',
      yellow: '#E0B060',    'yellow-soft': '#2A1E08',
      lilac: '#B090D0',     'lilac-soft': '#2A1A3D',
      line: '#3A2518',
      ok: '#80C098',        'ok-soft': '#1A2A20',
      'on-accent': '#fff',  error: '#FC8181',  'error-soft': '#3D1010',
    },
  },
];

export const DEFAULT_PALETTE: PaletteId = 'vibrante';

export const ROLE_DEFAULT_PALETTE: Record<string, PaletteId> = {
  hijo: 'vibrante',
  padre: 'azul_sereno',
};

export function getPalette(id: PaletteId): Palette {
  return PALETTES.find(p => p.id === id) ?? PALETTES[0];
}
