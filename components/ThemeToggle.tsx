'use client';
import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'auto';

const OPTIONS: { value: Theme; icon: string; label: string }[] = [
  { value: 'light', icon: '☀️', label: 'Claro' },
  { value: 'auto',  icon: '🔄', label: 'Auto' },
  { value: 'dark',  icon: '🌙', label: 'Oscuro' },
];

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('auto');
  const [open, setOpen]   = useState(false);

  // Load saved preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem('carlita-theme') as Theme | null;
      if (saved) apply(saved);
    } catch {}
  }, []);

  function apply(t: Theme) {
    setTheme(t);
    try { localStorage.setItem('carlita-theme', t); } catch {}
    if (t === 'auto') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', t);
    }
  }

  const current = OPTIONS.find(o => o.value === theme) ?? OPTIONS[1];

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Cambiar tema"
        style={{
          background: 'var(--bg-card)', border: '1.5px solid var(--line)',
          borderRadius: 10, padding: '7px 9px', cursor: 'pointer',
          display: 'flex', alignItems: 'center',
          color: 'var(--ink-soft)',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 199 }}
          />
          <div style={{
            position: 'absolute', top: '110%', right: 0, zIndex: 200,
            background: 'var(--bg-card)', borderRadius: 14,
            border: '1.5px solid var(--line)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            overflow: 'hidden', minWidth: 130,
          }}>
            {OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => { apply(opt.value); setOpen(false); }}
                style={{
                  width: '100%', padding: '10px 14px',
                  background: theme === opt.value ? 'var(--pink-soft)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14,
                  color: theme === opt.value ? 'var(--pink)' : 'var(--ink)',
                  textAlign: 'left',
                }}
              >
                <span>{opt.icon}</span>
                <span>{opt.label}</span>
                {theme === opt.value && <span style={{ marginLeft: 'auto' }}>✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
