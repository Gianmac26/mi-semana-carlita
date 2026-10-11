'use client';
import type { ReactNode } from 'react';
import BottomSheet from '@/components/BottomSheet';
import type { HelplineRef } from '@/lib/types';

// ── MarkdownLite ─────────────────────────────────────────────────────────────
// Soporta SOLO: "## heading", "- lista", "1. lista ordenada", "**negrita**" y párrafos.
// Parsea a JSX (sin dangerouslySetInnerHTML): React escapa todo el texto.

type Block =
  | { kind: 'h'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'p'; text: string };

function parseBlocks(src: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  const flushPara = () => {
    if (para.length) blocks.push({ kind: 'p', text: para.join(' ') });
    para = [];
  };

  for (const raw of src.split('\n')) {
    const line = raw.trim();
    const ul = line.match(/^-\s+(.*)$/);
    const ol = line.match(/^\d+\.\s+(.*)$/);
    const last = blocks[blocks.length - 1];

    if (!line) { flushPara(); continue; }
    if (line.startsWith('## ')) { flushPara(); blocks.push({ kind: 'h', text: line.slice(3) }); continue; }
    if (ul) {
      flushPara();
      if (last?.kind === 'ul') last.items.push(ul[1]); else blocks.push({ kind: 'ul', items: [ul[1]] });
      continue;
    }
    if (ol) {
      flushPara();
      if (last?.kind === 'ol') last.items.push(ol[1]); else blocks.push({ kind: 'ol', items: [ol[1]] });
      continue;
    }
    para.push(line);
  }
  flushPara();
  return blocks;
}

function renderInline(text: string): ReactNode[] {
  // "**a** b **c**".split(/\*\*(.+?)\*\*/) → ['', 'a', ' b ', 'c', ''] — índices impares = negrita
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? <strong key={i} style={{ color: 'var(--ink)' }}>{part}</strong> : part
  );
}

const listStyle = { margin: '0 0 14px', paddingLeft: 22, display: 'flex', flexDirection: 'column' as const, gap: 6 };

export function MarkdownLite({ source }: { source: string }) {
  return (
    <div style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--ink-soft)' }}>
      {parseBlocks(source).map((b, i) => {
        switch (b.kind) {
          case 'h':
            return (
              <h3 key={i} style={{
                fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 17,
                color: 'var(--ink)', margin: i === 0 ? '0 0 8px' : '20px 0 8px',
              }}>
                {renderInline(b.text)}
              </h3>
            );
          case 'ul':
            return <ul key={i} style={listStyle}>{b.items.map((it, j) => <li key={j}>{renderInline(it)}</li>)}</ul>;
          case 'ol':
            return <ol key={i} style={listStyle}>{b.items.map((it, j) => <li key={j}>{renderInline(it)}</li>)}</ol>;
          case 'p':
            return <p key={i} style={{ margin: '0 0 14px' }}>{renderInline(b.text)}</p>;
        }
      })}
    </div>
  );
}

// ── Helpline ref → botón grande ─────────────────────────────────────────────

function HelplineRefButton({ ref_ }: { ref_: HelplineRef }) {
  const href = ref_.tel ? `tel:${ref_.tel.replace(/[^\d+]/g, '')}` : ref_.url;
  if (!href) return null;
  const isTel = Boolean(ref_.tel);
  const isWhatsApp = !isTel && href.startsWith('https://wa.me/');

  return (
    <a
      href={href}
      {...(isTel ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        minHeight: 56, padding: '10px 16px', borderRadius: 16,
        background: isTel ? 'var(--accent)' : isWhatsApp ? '#25D366' : 'var(--accent-soft)',
        color: isTel || isWhatsApp ? (isWhatsApp ? '#fff' : 'var(--on-accent)') : 'var(--accent)',
        border: isTel || isWhatsApp ? 'none' : '1.5px solid var(--accent)',
        textDecoration: 'none',
      }}
    >
      <span style={{ fontSize: 22, flexShrink: 0 }}>{isTel ? '📞' : isWhatsApp ? '💬' : '🌐'}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 15.5, lineHeight: 1.25 }}>
          {isTel ? 'Llamar' : 'Abrir'} · {ref_.label}
        </span>
        {ref_.note && (
          <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, opacity: 0.85, marginTop: 2 }}>
            {ref_.note}
          </span>
        )}
      </span>
    </a>
  );
}

// ── Detail sheet ─────────────────────────────────────────────────────────────

export interface WellnessDetailContent {
  emoji: string;
  title: string;
  body_markdown: string;
  action_steps?: string[];
  helpline_refs?: HelplineRef[];
}

interface WellnessDetailSheetProps {
  item: WellnessDetailContent | null;
  onClose: () => void;
  backLabel: string;
}

const sectionLabel = {
  fontSize: 11, color: 'var(--ink-soft)', fontWeight: 700,
  textTransform: 'uppercase' as const, letterSpacing: 0.5, margin: '24px 0 12px',
};

export default function WellnessDetailSheet({ item, onClose, backLabel }: WellnessDetailSheetProps) {
  return (
    <BottomSheet
      open={item !== null}
      onClose={onClose}
      zIndex={300}
      title={item ? `${item.emoji} ${item.title}` : ''}
      ariaLabel={item?.title ?? 'Ficha'}
    >
      {item && (
        <>
          <MarkdownLite source={item.body_markdown} />

          {item.action_steps && item.action_steps.length > 0 && (
            <>
              <p style={sectionLabel}>Qué puedes hacer</p>
              <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {item.action_steps.map((step, i) => (
                  <li key={i} style={{
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                    background: 'var(--bg)', borderRadius: 14, padding: '12px 14px',
                    fontSize: 14.5, lineHeight: 1.5, color: 'var(--ink)',
                  }}>
                    <span style={{
                      flexShrink: 0, width: 26, height: 26, borderRadius: '50%',
                      background: 'var(--accent)', color: 'var(--on-accent)',
                      fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 13,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {i + 1}
                    </span>
                    <span style={{ paddingTop: 2 }}>{step}</span>
                  </li>
                ))}
              </ol>
            </>
          )}

          {item.helpline_refs && item.helpline_refs.length > 0 && (
            <>
              <p style={sectionLabel}>Pide ayuda</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {item.helpline_refs.map((r, i) => <HelplineRefButton key={i} ref_={r} />)}
              </div>
            </>
          )}

          <button
            onClick={onClose}
            style={{
              width: '100%', minHeight: 52, marginTop: 28, borderRadius: 16,
              border: '1.5px solid var(--line)', background: 'var(--bg-card)',
              color: 'var(--ink-soft)', fontFamily: 'var(--font-title)', fontWeight: 700,
              fontSize: 15, cursor: 'pointer',
            }}
          >
            ← {backLabel}
          </button>
        </>
      )}
    </BottomSheet>
  );
}
