'use client';
import { useState } from 'react';

export interface NavItem {
  key: string;
  icon: string;
  label: string;
}

interface Props {
  items: NavItem[];
  active: string;
  onSelect: (key: string) => void;
}

const MAX_VISIBLE = 5;

export default function BottomNav({ items, active, onSelect }: Props) {
  const [moreOpen, setMoreOpen] = useState(false);

  const hasMore = items.length > MAX_VISIBLE;
  const visibleItems = hasMore ? items.slice(0, MAX_VISIBLE - 1) : items;
  const moreItems   = hasMore ? items.slice(MAX_VISIBLE - 1)    : [];

  const handleSelect = (key: string) => {
    onSelect(key);
    setMoreOpen(false);
  };

  const moreIsActive = moreItems.some(i => i.key === active);

  return (
    <>
      {/* "Más" overlay + mini-sheet */}
      {moreOpen && (
        <>
          <div
            onClick={() => setMoreOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.35)',
              zIndex: 199,
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Más secciones"
            style={{
              position: 'fixed',
              bottom: 'calc(56px + env(safe-area-inset-bottom))',
              left: 0, right: 0,
              background: 'var(--bg-card)',
              borderRadius: '20px 20px 0 0',
              borderTop: '1.5px solid var(--line)',
              padding: '16px 16px 4px',
              zIndex: 200,
              boxShadow: '0 -4px 24px rgba(0,0,0,0.14)',
            }}
          >
            <p style={{
              fontSize: 11, color: 'var(--ink-soft)', fontWeight: 700,
              letterSpacing: 0.5, textTransform: 'uppercase',
              marginBottom: 10,
            }}>
              Más secciones
            </p>
            {moreItems.map(item => {
              const isActive = item.key === active;
              return (
                <button
                  key={item.key}
                  onClick={() => handleSelect(item.key)}
                  style={{
                    width: '100%', minHeight: 56,
                    padding: '12px 16px', marginBottom: 8,
                    borderRadius: 14,
                    background: isActive ? 'var(--pink-soft)' : 'var(--bg-card)',
                    border: `1.5px solid ${isActive ? 'var(--pink)' : 'var(--line)'}`,
                    display: 'flex', alignItems: 'center', gap: 12,
                    fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 15,
                    color: isActive ? 'var(--pink)' : 'var(--ink)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Bottom nav bar */}
      <nav
        aria-label="Navegación principal"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'var(--bg-card)',
          borderTop: '1.5px solid var(--line)',
          display: 'flex',
          paddingBottom: 'env(safe-area-inset-bottom)',
          zIndex: 100,
          boxShadow: '0 -2px 12px rgba(0,0,0,0.07)',
        }}
      >
        {visibleItems.map(item => {
          const isActive = item.key === active;
          return (
            <button
              key={item.key}
              onClick={() => handleSelect(item.key)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 3, padding: '8px 4px',
                minHeight: 56, minWidth: 48,
                background: 'none', border: 'none', cursor: 'pointer',
                color: isActive ? 'var(--pink)' : 'var(--ink-soft)',
                transition: 'color 0.15s',
              }}
            >
              <span style={{ fontSize: 22, lineHeight: 1 }}>{item.icon}</span>
              <span style={{
                fontSize: 10, fontFamily: 'var(--font-title)',
                fontWeight: isActive ? 700 : 600, lineHeight: 1.2,
              }}>
                {item.label}
              </span>
            </button>
          );
        })}

        {hasMore && (
          <button
            onClick={() => setMoreOpen(v => !v)}
            aria-label="Más secciones"
            aria-expanded={moreOpen}
            style={{
              flex: 1,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 3, padding: '8px 4px',
              minHeight: 56, minWidth: 48,
              background: 'none', border: 'none', cursor: 'pointer',
              color: moreIsActive || moreOpen ? 'var(--pink)' : 'var(--ink-soft)',
              transition: 'color 0.15s',
            }}
          >
            <span style={{ fontSize: 22, lineHeight: 1 }}>⋯</span>
            <span style={{
              fontSize: 10, fontFamily: 'var(--font-title)',
              fontWeight: (moreIsActive || moreOpen) ? 700 : 600,
            }}>
              Más
            </span>
          </button>
        )}
      </nav>
    </>
  );
}
