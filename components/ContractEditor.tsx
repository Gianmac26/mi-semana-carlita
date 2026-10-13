'use client';
import { useState } from 'react';
import { DEFAULT_INTRO_TEXT } from '@/lib/contract';
import type { FamilyContract, ContractSignature, Profile } from '@/lib/types';

interface Props {
  contract: FamilyContract | null;
  signatures: ContractSignature[];
  profile: Profile;
  familyMembers: Profile[];
  onCreate: (intro: string) => Promise<boolean>;
  onSign: (contractId: string) => void;
  signing: boolean;
  error: string | null;
}

const fmtFull = new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' });

export default function ContractEditor({ contract, signatures, profile, familyMembers, onCreate, onSign, signing, error }: Props) {
  const [intro, setIntro] = useState(DEFAULT_INTRO_TEXT);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showNewVersionEditor, setShowNewVersionEditor] = useState(false);

  // ─── Sin contrato o modo "crear nueva versión": editor ────────────────────
  if (!contract || showNewVersionEditor) {
    async function handleCreate() {
      setCreating(true);
      setCreateError(null);
      const ok = await onCreate(intro);
      setCreating(false);
      if (!ok) {
        setCreateError('No se pudo crear el contrato. Revisa tu conexión e intenta de nuevo.');
        return;
      }
      setShowNewVersionEditor(false);
      setIntro(DEFAULT_INTRO_TEXT);
    }

    return (
      <div>
        <h4 style={sectionTitle}>🤝 Contrato familiar</h4>
        {showNewVersionEditor && (
          <p style={{
            marginBottom: 12, padding: '10px 14px', borderRadius: 12,
            background: 'var(--yellow-soft)', color: 'var(--ink)',
            border: '1.5px solid var(--yellow)',
            fontSize: 13, fontWeight: 600,
          }}>
            Al crear una nueva versión, las firmas actuales quedan asociadas a la versión anterior.
          </p>
        )}
        <label htmlFor="contract-intro" style={label}>Introducción</label>
        <textarea
          id="contract-intro"
          value={intro}
          onChange={e => setIntro(e.target.value)}
          rows={6}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '10px 12px', borderRadius: 12,
            border: '1.5px solid var(--line)',
            background: 'var(--bg-card)', color: 'var(--ink)',
            fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.6,
            outline: 'none', resize: 'vertical',
          }}
        />
        <p style={{
          marginTop: 10, marginBottom: 16, fontSize: 12.5,
          color: 'var(--ink-soft)', lineHeight: 1.5,
        }}>
          Al crear el contrato se copiarán las reglas de oro vigentes. Los miembros de la familia podrán firmarlo.
        </p>
        {createError && (
          <p role="alert" style={errorBox}>{createError}</p>
        )}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={handleCreate}
            disabled={creating || !intro.trim()}
            style={{
              flex: 1, minHeight: 48, minWidth: 140,
              borderRadius: 12, border: 'none',
              background: 'var(--accent)', color: 'var(--on-accent)',
              fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 14,
              cursor: (creating || !intro.trim()) ? 'default' : 'pointer',
              opacity: (creating || !intro.trim()) ? 0.6 : 1,
            }}
          >
            {creating ? 'Creando...' : (showNewVersionEditor ? 'Crear nueva versión' : 'Crear contrato')}
          </button>
          {showNewVersionEditor && (
            <button
              onClick={() => { setShowNewVersionEditor(false); setIntro(DEFAULT_INTRO_TEXT); setCreateError(null); }}
              style={{
                minHeight: 48, padding: '0 16px', minWidth: 100,
                borderRadius: 12, border: '1.5px solid var(--line)',
                background: 'var(--bg-card)', color: 'var(--ink-soft)',
                fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── Con contrato activo: vista ────────────────────────────────────────────
  const mySignature = signatures.find(s => s.contract_id === contract.id && s.user_id === profile.id);
  const hasSigned = !!mySignature;

  return (
    <div>
      <h4 style={sectionTitle}>🤝 Contrato familiar</h4>

      <p style={{
        fontSize: 13, color: 'var(--ink-soft)', marginBottom: 14,
      }}>
        Contrato v{contract.version} · creado el {fmtFull.format(new Date(contract.created_at))}
      </p>

      {/* Intro */}
      <p style={label}>Introducción</p>
      <div style={box}>
        {contract.intro_text || 'Sin introducción.'}
      </div>

      {/* Reglas */}
      <p style={label}>Reglas ({contract.rules_snapshot.length})</p>
      {contract.rules_snapshot.length === 0 ? (
        <p style={emptyText}>Aún no hay reglas definidas.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {contract.rules_snapshot.map((r, i) => (
            <div key={i} style={ruleRow}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>{r.emoji}</span>
              <span style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.4 }}>{r.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Firmas */}
      <p style={label}>Firmas</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {familyMembers.map(m => {
          const sig = signatures.find(s => s.contract_id === contract.id && s.user_id === m.id);
          return (
            <div key={m.id} style={{
              ...ruleRow, justifyContent: 'space-between',
              background: sig ? 'var(--ok-soft)' : 'var(--bg)',
              borderColor: sig ? 'var(--ok)' : 'var(--line)',
            }}>
              <span style={{ fontSize: 13.5, color: 'var(--ink)', fontWeight: 600 }}>
                {m.display_name}
              </span>
              <span style={{ fontSize: 12, color: sig ? 'var(--ok)' : 'var(--ink-soft)', fontWeight: 600 }}>
                {sig ? `✓ ${fmtFull.format(new Date(sig.signed_at))}` : '⏳ Pendiente'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Error de firma */}
      {error && <p role="alert" style={errorBox}>{error}</p>}

      {/* Botón firmar (si el padre no firmó todavía) */}
      {!hasSigned && (
        <button
          onClick={() => onSign(contract.id)}
          disabled={signing}
          style={{
            width: '100%', minHeight: 52, marginTop: 16,
            borderRadius: 16, border: 'none',
            background: 'var(--ok)', color: 'var(--on-accent)',
            fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 15,
            cursor: signing ? 'default' : 'pointer',
            opacity: signing ? 0.6 : 1,
          }}
        >
          {signing ? 'Firmando...' : '✓ Firmar este contrato'}
        </button>
      )}

      {/* Botón crear nueva versión */}
      <button
        onClick={() => {
          if (confirm('¿Crear nueva versión? Las firmas actuales quedarán asociadas a la versión anterior.')) {
            setIntro(contract.intro_text || DEFAULT_INTRO_TEXT);
            setShowNewVersionEditor(true);
            setCreateError(null);
          }
        }}
        style={{
          width: '100%', minHeight: 44, marginTop: 12,
          borderRadius: 12, border: '1.5px solid var(--line)',
          background: 'var(--bg-card)', color: 'var(--ink-soft)',
          fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13.5,
          cursor: 'pointer',
        }}
      >
        Crear nueva versión
      </button>
    </div>
  );
}

const sectionTitle = {
  fontFamily: 'var(--font-title)', fontWeight: 700,
  fontSize: 16, color: 'var(--ink)', margin: '0 0 14px',
};

const label = {
  fontSize: 11, color: 'var(--ink-soft)', fontWeight: 700,
  textTransform: 'uppercase' as const, letterSpacing: 0.5,
  margin: '16px 0 6px',
};

const box = {
  padding: '12px 14px', borderRadius: 12,
  background: 'var(--bg)', border: '1.5px solid var(--line)',
  fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.5,
  whiteSpace: 'pre-wrap' as const,
};

const ruleRow = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '9px 12px', borderRadius: 10,
  background: 'var(--bg)', border: '1.5px solid var(--line)',
};

const emptyText = {
  fontSize: 13, color: 'var(--ink-soft)', fontStyle: 'italic' as const,
};

const errorBox = {
  marginTop: 14, padding: '10px 14px', borderRadius: 12,
  background: 'var(--error-soft)', color: 'var(--error)',
  fontSize: 13, fontWeight: 600,
};
