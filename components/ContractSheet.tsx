'use client';
import BottomSheet from '@/components/BottomSheet';
import { getContractStatus } from '@/lib/contract';
import type { FamilyContract, ContractSignature, Profile } from '@/lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
  contract: FamilyContract | null;
  signatures: ContractSignature[];
  profile: Profile;
  familyMembers: Profile[];
  signing: boolean;
  error: string | null;
  onSign: (contractId: string) => void;
}

const fmtFull = new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' });

export default function ContractSheet({ open, onClose, contract, signatures, profile, familyMembers, signing, error, onSign }: Props) {
  if (!contract) return null;

  const status = getContractStatus(contract, signatures, profile.id);
  const signedByUser = (userId: string) =>
    signatures.find(s => s.contract_id === contract.id && s.user_id === userId) ?? null;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      zIndex={350}
      title={`🤝 Nuestro compromiso familiar v${contract.version}`}
      ariaLabel="Contrato familiar"
    >
      {/* Introducción */}
      <p style={sectionLabel}>Introducción</p>
      <div style={{
        padding: '12px 14px', borderRadius: 14, background: 'var(--bg)',
        fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink)',
        whiteSpace: 'pre-wrap',
      }}>
        {contract.intro_text || 'Sin introducción.'}
      </div>

      {/* Reglas snapshot */}
      <p style={sectionLabel}>Nuestras reglas</p>
      {contract.rules_snapshot.length === 0 ? (
        <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', fontStyle: 'italic' }}>
          Aún no hay reglas definidas.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {contract.rules_snapshot.map((r, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 12,
              background: 'var(--bg-card)', border: '1.5px solid var(--line)',
            }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>{r.emoji}</span>
              <span style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.5 }}>{r.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Firmas */}
      <p style={sectionLabel}>Firmas</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {familyMembers.map(m => {
          const sig = signedByUser(m.id);
          return (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
              padding: '10px 14px', borderRadius: 12,
              background: sig ? 'var(--ok-soft)' : 'var(--bg)',
              border: `1.5px solid ${sig ? 'var(--ok)' : 'var(--line)'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--accent-soft)', color: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 14,
                }}>
                  {m.display_name[0]?.toUpperCase() ?? '?'}
                </span>
                <span style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 600 }}>
                  {m.display_name}
                </span>
              </div>
              <span style={{
                fontSize: 12, color: sig ? 'var(--ok)' : 'var(--ink-soft)',
                fontWeight: 600, textAlign: 'right',
              }}>
                {sig
                  ? `✓ Firmado el ${fmtFull.format(new Date(sig.signed_at))}`
                  : '⏳ Pendiente'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <p role="alert" style={{
          marginTop: 16, padding: '10px 14px', borderRadius: 12,
          background: 'var(--error-soft)', color: 'var(--error)',
          fontSize: 13.5, fontWeight: 600,
        }}>
          {error}
        </p>
      )}

      {/* Botón de acción */}
      {status === 'pending-my-signature' && (
        <button
          onClick={() => onSign(contract.id)}
          disabled={signing}
          style={{
            width: '100%', minHeight: 52, marginTop: 20,
            borderRadius: 16, border: 'none',
            background: 'var(--ok)', color: 'var(--on-accent)',
            fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 16,
            cursor: signing ? 'default' : 'pointer',
            opacity: signing ? 0.6 : 1,
          }}
        >
          {signing ? 'Firmando...' : '✓ Firmar este contrato'}
        </button>
      )}

      {status === 'signed-by-me' && (
        <p style={{
          marginTop: 20, textAlign: 'center',
          fontSize: 13.5, color: 'var(--ok)', fontWeight: 700,
          fontFamily: 'var(--font-title)',
        }}>
          ✓ Ya firmaste este contrato
        </p>
      )}
    </BottomSheet>
  );
}

const sectionLabel = {
  fontSize: 11, color: 'var(--ink-soft)', fontWeight: 700,
  textTransform: 'uppercase' as const, letterSpacing: 0.5,
  margin: '20px 0 8px',
};
