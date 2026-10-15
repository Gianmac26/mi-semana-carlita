import type { FamilyContract, ContractSignature } from '@/lib/types';

export type ContractStatus =
  | 'no-contract'            // no hay contrato activo
  | 'pending-my-signature'   // hay contrato, yo no firmé
  | 'signed-by-me';          // ya firmé

// Fila que devuelve el RPC create_family_contract.
export type CreateContractResult = FamilyContract;

export function getContractStatus(
  contract: FamilyContract | null,
  signatures: ContractSignature[],
  userId: string,
): ContractStatus {
  if (!contract) return 'no-contract';
  const signed = signatures.some(s => s.contract_id === contract.id && s.user_id === userId);
  return signed ? 'signed-by-me' : 'pending-my-signature';
}

export const DEFAULT_INTRO_TEXT =
  'Este es nuestro compromiso familiar. Las reglas de abajo son las que acordamos como familia. Al firmarlo, nos comprometemos a cumplirlas y a apoyarnos entre nosotros.';

// ─── Reglas del contrato (012) ──────────────────────────────────────────────
// Límites espejo de la RPC create_family_contract(p_intro, p_rules).
export const MAX_RULES = 10;
export const MAX_RULE_TEXT = 120;
export const MAX_INTRO_TEXT = 2000;
export const DEFAULT_RULE_EMOJI = '⭐';

export interface ContractRule {
  emoji: string;
  text: string;
}

// Chips "Ideas para empezar" del editor y reglas del seed demo.
export const EXAMPLE_RULES: ContractRule[] = [
  { emoji: '📵', text: 'Sin celular en horario de estudio — solo música' },
  { emoji: '🛏️', text: 'El celular duerme en el escritorio, no en la cama' },
  { emoji: '⏰', text: 'Hora tope para dormir: 10:00 pm, lunes a viernes' },
  { emoji: '🍽️', text: 'Lavar los servicios inmediatamente después de usarlos' },
  { emoji: '🏡', text: 'Cada vez que pueda, ayudar con la limpieza de casa' },
  { emoji: '💬', text: 'Si algo nos molesta, lo conversamos con calma, sin gritos.' },
];

export const RULE_EMOJIS = ['⭐', '📵', '🛏️', '⏰', '🍽️', '🏡', '💬', '📚', '🧹', '💪', '🐶', '🌙', '🎯', '🤝', '💜'];

// Igual que la RPC: espacios colapsados + trim.
export function normalizeRuleText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

// Misma validación que la RPC. Devuelve el mensaje para mostrar, o null si son válidas.
export function validateContractRules(rules: ContractRule[]): string | null {
  if (rules.length === 0) return 'Agrega al menos una regla para crear el contrato.';
  if (rules.length > MAX_RULES) return `El contrato admite máximo ${MAX_RULES} reglas.`;

  for (let i = 0; i < rules.length; i++) {
    const text = normalizeRuleText(rules[i].text);
    if (!text) return `Regla ${i + 1}: escribe el texto o quítala.`;
    if (text.length > MAX_RULE_TEXT) return `Regla ${i + 1}: el texto supera ${MAX_RULE_TEXT} caracteres.`;
  }

  const byText = new Map<string, number[]>();
  rules.forEach((r, i) => {
    const key = normalizeRuleText(r.text).toLowerCase();
    byText.set(key, [...(byText.get(key) ?? []), i + 1]);
  });
  const dups = [...byText.values()].filter(nums => nums.length > 1).map(nums => nums.join(', '));
  if (dups.length) return `Reglas repetidas: ${dups.join('; ')} (mismo texto).`;

  return null;
}
