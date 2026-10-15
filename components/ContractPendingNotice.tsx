'use client';
import type { FamilyContract, ContractSignature } from '@/lib/types';
import { getContractStatus } from '@/lib/contract';

interface Props {
  contract: FamilyContract | null;
  signatures: ContractSignature[];
  userId: string;
  onOpen: () => void;
}

// Aviso en Semana (hijo) cuando hay un contrato pendiente de su firma. Mismo estilo que el
// estado pendiente de ContractCard. Desaparece solo al firmar (la firma se agrega optimista).
export default function ContractPendingNotice({ contract, signatures, userId, onOpen }: Props) {
  if (getContractStatus(contract, signatures, userId) !== 'pending-my-signature') return null;

  return (
    <section style={{
      marginTop: 16, padding: '14px 16px', borderRadius: 14,
      background: 'var(--yellow-soft)', border: '1.5px solid var(--yellow)',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <p style={{
        fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 15,
        color: 'var(--ink)', lineHeight: 1.3,
      }}>
        ✍️ Hay un contrato familiar nuevo esperando tu firma
      </p>
      <button
        type="button"
        onClick={onOpen}
        style={{
          minHeight: 44, padding: '10px 16px', borderRadius: 12, cursor: 'pointer',
          fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 14,
          border: 'none', background: 'var(--accent)', color: 'var(--on-accent)',
        }}
      >
        Revisar y firmar
      </button>
    </section>
  );
}
