interface Rule {
  id: string;
  emoji: string;
  text: string;
}

interface Props {
  rules: Rule[];
}

export default function GoldenRules({ rules }: Props) {
  if (rules.length === 0) {
    return (
      <div style={{ marginTop: 28, textAlign: 'center', color: 'var(--ink-soft)', fontSize: 14, fontStyle: 'italic' }}>
        Tu familia aún no ha definido reglas. Pídele a tu papá o mamá que agregue algunas.
      </div>
    );
  }

  return (
    <div style={{ marginTop: 28 }}>
      <h3 style={{
        fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 17,
        color: 'var(--lilac)', marginBottom: 12,
      }}>
        ⭐ Reglas de oro
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rules.map(r => (
          <div
            key={r.id}
            style={{
              background: 'var(--lilac-soft)', borderRadius: 14,
              padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}
          >
            <span style={{ fontSize: 22, flexShrink: 0 }}>{r.emoji}</span>
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>
              {r.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
