'use client';
import { useState } from 'react';
import {
  DEFAULT_INTRO_TEXT, DEFAULT_RULE_EMOJI, EXAMPLE_RULES, RULE_EMOJIS,
  MAX_RULES, MAX_RULE_TEXT, MAX_INTRO_TEXT,
  normalizeRuleText, validateContractRules, type ContractRule,
} from '@/lib/contract';
import type { FamilyContract, ContractSignature, Profile } from '@/lib/types';

interface Props {
  contract: FamilyContract | null;
  signatures: ContractSignature[];
  profile: Profile;
  familyMembers: Profile[];
  /** Reglas de oro vigentes (family_rules): precargan el editor. */
  currentRules: ContractRule[];
  /** Devuelve null si se creó; si no, el mensaje de error para mostrar. */
  onCreate: (intro: string, rules: ContractRule[]) => Promise<string | null>;
  onSign: (contractId: string) => void;
  signing: boolean;
  error: string | null;
}

const fmtFull = new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' });

const copyRules = (rules: ContractRule[]): ContractRule[] => rules.map(r => ({ emoji: r.emoji, text: r.text }));

export default function ContractEditor({ contract, signatures, profile, familyMembers, currentRules, onCreate, onSign, signing, error }: Props) {
  const [intro, setIntro] = useState(DEFAULT_INTRO_TEXT);
  const [rules, setRules] = useState<ContractRule[]>(() => copyRules(currentRules));
  const [emojiPickerAt, setEmojiPickerAt] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showNewVersionEditor, setShowNewVersionEditor] = useState(false);

  // ─── Sin contrato o modo "crear nueva versión": editor ────────────────────
  if (!contract || showNewVersionEditor) {
    const rulesError = validateContractRules(rules);
    const canCreate = !creating && !!intro.trim() && !rulesError;
    const atLimit = rules.length >= MAX_RULES;

    const isListed = (text: string) => {
      const key = normalizeRuleText(text).toLowerCase();
      return rules.some(r => normalizeRuleText(r.text).toLowerCase() === key);
    };

    function updateRule(i: number, patch: Partial<ContractRule>) {
      setRules(prev => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)));
    }

    function moveRule(i: number, dir: -1 | 1) {
      setRules(prev => {
        const j = i + dir;
        if (j < 0 || j >= prev.length) return prev;
        const next = [...prev];
        [next[i], next[j]] = [next[j], next[i]];
        return next;
      });
      setEmojiPickerAt(null);
    }

    function removeRule(i: number) {
      setRules(prev => prev.filter((_, j) => j !== i));
      setEmojiPickerAt(null);
    }

    function addRule(rule: ContractRule = { emoji: DEFAULT_RULE_EMOJI, text: '' }) {
      setRules(prev => (prev.length >= MAX_RULES ? prev : [...prev, { ...rule }]));
    }

    async function handleCreate() {
      setCreating(true);
      setCreateError(null);
      const err = await onCreate(intro, rules.map(r => ({ emoji: r.emoji, text: normalizeRuleText(r.text) })));
      setCreating(false);
      if (err) {
        setCreateError(err);
        return;
      }
      setShowNewVersionEditor(false);
      setIntro(DEFAULT_INTRO_TEXT);
      setEmojiPickerAt(null);
    }

    function handleCancel() {
      setShowNewVersionEditor(false);
      setIntro(DEFAULT_INTRO_TEXT);
      setRules(copyRules(currentRules));
      setEmojiPickerAt(null);
      setCreateError(null);
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
          maxLength={MAX_INTRO_TEXT}
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

        {/* Reglas */}
        <p style={label}>Reglas · {rules.length} de {MAX_RULES}</p>
        {rules.length === 0 ? (
          <p style={emptyText}>Aún no hay reglas. Agrega una o elige una idea de abajo.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rules.map((r, i) => (
              <div key={i} style={{ ...ruleRow, flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    aria-label={`Elegir emoji de la regla ${i + 1}`}
                    aria-expanded={emojiPickerAt === i}
                    onClick={() => setEmojiPickerAt(emojiPickerAt === i ? null : i)}
                    style={emojiButton}
                  >
                    {r.emoji}
                  </button>
                  <input
                    aria-label={`Texto de la regla ${i + 1}`}
                    value={r.text}
                    maxLength={MAX_RULE_TEXT}
                    placeholder="Escribe la regla"
                    onChange={e => updateRule(i, { text: e.target.value })}
                    style={textInput}
                  />
                </div>

                {emojiPickerAt === i && (
                  <div role="group" aria-label={`Emojis para la regla ${i + 1}`} style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {RULE_EMOJIS.map(e => (
                      <button
                        key={e}
                        type="button"
                        aria-pressed={e === r.emoji}
                        onClick={() => { updateRule(i, { emoji: e }); setEmojiPickerAt(null); }}
                        style={{ ...emojiOption, background: e === r.emoji ? 'var(--accent-soft)' : 'transparent' }}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button type="button" aria-label={`Subir regla ${i + 1}`} disabled={i === 0}
                    onClick={() => moveRule(i, -1)} style={iconButton(i === 0)}>▲</button>
                  <button type="button" aria-label={`Bajar regla ${i + 1}`} disabled={i === rules.length - 1}
                    onClick={() => moveRule(i, 1)} style={iconButton(i === rules.length - 1)}>▼</button>
                  <button type="button" aria-label={`Quitar regla ${i + 1}`}
                    onClick={() => removeRule(i)} style={iconButton(false)}>🗑</button>
                  {r.text.length > MAX_RULE_TEXT - 20 && (
                    <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--ink-soft)' }}>
                      {r.text.length}/{MAX_RULE_TEXT}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => addRule()}
          disabled={atLimit}
          style={{
            width: '100%', minHeight: 44, marginTop: 10,
            borderRadius: 12, border: '1.5px dashed var(--line)',
            background: 'var(--bg-card)', color: 'var(--ink-soft)',
            fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13.5,
            cursor: atLimit ? 'default' : 'pointer',
            opacity: atLimit ? 0.6 : 1,
          }}
        >
          {atLimit ? `Llegaste a ${MAX_RULES} reglas` : '+ Agregar regla'}
        </button>

        {/* Ideas para empezar */}
        <div style={{
          marginTop: 16, padding: '12px 14px', borderRadius: 12,
          background: 'var(--bg)', border: '1.5px dashed var(--line)',
        }}>
          <p style={{ margin: '0 0 4px', fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>
            💡 Ideas para empezar
          </p>
          <p style={{ margin: '0 0 10px', fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
            Son solo ejemplos: elijan juntos las que tengan sentido para su familia.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {EXAMPLE_RULES.map(ex => {
              const disabled = atLimit || isListed(ex.text);
              return (
                <button
                  key={ex.text}
                  type="button"
                  disabled={disabled}
                  onClick={() => addRule(ex)}
                  style={{
                    padding: '7px 11px', borderRadius: 16, textAlign: 'left',
                    border: '1.5px solid var(--line)',
                    background: disabled ? 'var(--bg)' : 'var(--bg-card)',
                    color: 'var(--ink)', fontFamily: 'var(--font-body)',
                    fontSize: 12.5, lineHeight: 1.35,
                    cursor: disabled ? 'default' : 'pointer',
                    opacity: disabled ? 0.45 : 1,
                  }}
                >
                  {ex.emoji} {ex.text}
                </button>
              );
            })}
          </div>
        </div>

        <p style={{
          marginTop: 14, marginBottom: 16, fontSize: 12.5,
          color: 'var(--ink-soft)', lineHeight: 1.5,
        }}>
          Estas reglas reemplazarán las Reglas de oro de Semana. Los miembros de la familia podrán firmar el contrato.
        </p>
        {rulesError && (
          <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)' }}>
            {rulesError}
          </p>
        )}
        {createError && (
          <p role="alert" style={errorBox}>{createError}</p>
        )}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={handleCreate}
            disabled={!canCreate}
            style={{
              flex: 1, minHeight: 48, minWidth: 140,
              borderRadius: 12, border: 'none',
              background: 'var(--accent)', color: 'var(--on-accent)',
              fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 14,
              cursor: canCreate ? 'pointer' : 'default',
              opacity: canCreate ? 1 : 0.6,
            }}
          >
            {creating ? 'Creando...' : (showNewVersionEditor ? 'Crear nueva versión' : 'Crear contrato')}
          </button>
          {showNewVersionEditor && (
            <button
              onClick={handleCancel}
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

      {/* Botón crear nueva versión (también es la vía para editar reglas) */}
      <button
        onClick={() => {
          if (confirm('¿Crear nueva versión? Las firmas actuales quedarán asociadas a la versión anterior.')) {
            setIntro(contract.intro_text || DEFAULT_INTRO_TEXT);
            setRules(copyRules(currentRules));
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

const emojiButton = {
  flexShrink: 0, width: 40, height: 40, borderRadius: 10,
  border: '1.5px solid var(--line)', background: 'var(--bg-card)',
  fontSize: 18, lineHeight: 1, cursor: 'pointer',
};

const emojiOption = {
  width: 36, height: 36, borderRadius: 8, border: 'none',
  fontSize: 18, lineHeight: 1, cursor: 'pointer',
};

const textInput = {
  flex: 1, minWidth: 0, minHeight: 40, boxSizing: 'border-box' as const,
  padding: '8px 10px', borderRadius: 10,
  border: '1.5px solid var(--line)', background: 'var(--bg-card)',
  color: 'var(--ink)', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none',
};

const iconButton = (disabled: boolean) => ({
  width: 36, height: 32, borderRadius: 8,
  border: '1.5px solid var(--line)', background: 'var(--bg-card)',
  color: 'var(--ink-soft)', fontSize: 13, lineHeight: 1,
  cursor: disabled ? 'default' : 'pointer',
  opacity: disabled ? 0.4 : 1,
});
