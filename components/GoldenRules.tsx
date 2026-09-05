const RULES = [
  { icon: '📵', text: 'Sin celular en horario de estudio — solo música' },
  { icon: '🛏️', text: 'El celular duerme en el escritorio, no en la cama' },
  { icon: '⏰', text: 'Hora tope para dormir: 10:00 pm, lunes a viernes' },
];

export default function GoldenRules() {
  return (
    <div style={{ marginTop: 28 }}>
      <h3 style={{
        fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 17,
        color: 'var(--lilac)', marginBottom: 12,
      }}>
        ⭐ Reglas de oro
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {RULES.map((r, i) => (
          <div
            key={i}
            style={{
              background: 'var(--lilac-soft)', borderRadius: 14,
              padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}
          >
            <span style={{ fontSize: 22, flexShrink: 0 }}>{r.icon}</span>
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>
              {r.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
