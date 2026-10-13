'use client';
import type { FamilyContract, ContractSignature } from '@/lib/types';
import { getContractStatus } from '@/lib/contract';

interface Props {
  contract: FamilyContract | null;
  signatures: ContractSignature[];
  userId: string;
  onOpen: () => void;
}

// Tarjeta resumen del contrato familiar en Progreso (hijo). El detalle vive en ContractSheet.
export default function ContractCard({ contract, signatures, userId, onOpen }: Props) {
  const status = getContractStatus(contract, signatures, userId);

  if (status === 'no-contract') {
    return (
      <section style={{
        marginTop: 28, padding: '14px 16px', borderRadius: 14,
        background: 'var(--bg)', border: '1.5px solid var(--line)',
      }}>
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.4 }}>
          🤝 Tu familia aún no ha creado el contrato familiar.
        </p>
      </section>
    );
  }

  const pending = status === 'pending-my-signature';

  return (
    <section style={{
      marginTop: 28, padding: '14px 16px', borderRadius: 14,
      background: pending ? 'var(--yellow-soft)' : 'var(--ok-soft)',
      border: `1.5px solid ${pending ? 'var(--yellow)' : 'var(--ok)'}`,
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <p style={{
        fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 15,
        color: 'var(--ink)', lineHeight: 1.3,
      }}>
        {pending
          ? '🤝 Hay un contrato pendiente de tu firma'
          : `✓ Firmaste el contrato v${contract?.version}`}
      </p>
      <button
        onClick={onOpen}
        style={{
          minHeight: 44, padding: '10px 16px', borderRadius: 12, cursor: 'pointer',
          fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 14,
          ...(pending
            ? { border: 'none', background: 'var(--accent)', color: 'var(--on-accent)' }
            : { border: '1.5px solid var(--line)', background: 'var(--bg-card)', color: 'var(--ink-soft)' }),
        }}
      >
        {pending ? 'Ver y firmar' : 'Ver contrato'}
      </button>
    </section>
  );
}
