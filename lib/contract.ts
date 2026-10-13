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
