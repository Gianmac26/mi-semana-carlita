'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';

// ── Pila de sheets abiertos ──────────────────────────────────────────────────
// Escape y el gesto "atrás" cierran SOLO el sheet de arriba.
// Cada sheet abierto empuja una entrada de historial (Next.js integra
// history.pushState nativo con su router, no recarga la página).

interface Layer { close: () => void; poppedByHistory: boolean }

const stack: Layer[] = [];
let pendingBacks = 0;      // history.back() disparados por nosotros al cerrar desde la UI
let listening = false;

function onKeyDown(e: KeyboardEvent) {
  if (e.key !== 'Escape' || stack.length === 0) return;
  e.preventDefault();
  stack[stack.length - 1].close();
}

function onPopState() {
  if (pendingBacks > 0) { pendingBacks--; return; }
  const top = stack[stack.length - 1];
  if (!top) return;
  top.poppedByHistory = true;
  top.close();
}

function ensureListeners() {
  if (listening) return;
  listening = true;
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('popstate', onPopState);
}

function useSheetLayer(open: boolean, onClose: () => void) {
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });

  useEffect(() => {
    if (!open) return;
    ensureListeners();
    const layer: Layer = { close: () => closeRef.current(), poppedByHistory: false };
    stack.push(layer);
    window.history.pushState({ sheetLayer: true }, '');
    document.body.style.overflow = 'hidden';

    return () => {
      const idx = stack.indexOf(layer);
      if (idx !== -1) stack.splice(idx, 1);
      if (!layer.poppedByHistory) { pendingBacks++; window.history.back(); }
      if (stack.length === 0) document.body.style.overflow = '';
    };
  }, [open]);
}

// ── BottomSheet ──────────────────────────────────────────────────────────────
// Mobile: hoja anclada abajo, ancho completo, swipe-down desde el handle/header.
// Desktop (≥768px): modal centrado (ver .sheet-root/.sheet-panel en globals.css).

const SWIPE_CLOSE_PX = 90;

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  zIndex: number;
  title: ReactNode;
  ariaLabel: string;
  children: ReactNode;
}

export default function BottomSheet({ open, onClose, zIndex, title, ariaLabel, children }: BottomSheetProps) {
  useSheetLayer(open, onClose);

  const [dragY, setDragY]       = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const onTouchStart = (e: React.TouchEvent) => { startY.current = e.touches[0].clientY; setDragging(true); };
  const onTouchMove  = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    setDragY(Math.max(0, e.touches[0].clientY - startY.current));
  };
  const onTouchEnd   = () => {
    if (dragY > SWIPE_CLOSE_PX) onClose();
    setDragY(0);
    startY.current = null;
    setDragging(false);
  };

  return (
    <div className="sheet-root" style={{ zIndex }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(2px)',
        }}
      />

      <div
        ref={panelRef}
        className="sheet-panel"
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        style={{
          transform: dragY ? `translateY(${dragY}px)` : undefined,
          transition: dragging ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {/* Handle + header: zona de swipe-down */}
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{ flexShrink: 0, touchAction: 'none' }}
        >
          <div className="sheet-handle" style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 6px' }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--line)' }} />
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            padding: '4px 12px 8px 20px',
          }}>
            <h3 style={{
              fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 20,
              color: 'var(--ink)', margin: 0, minWidth: 0,
            }}>
              {title}
            </h3>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              style={{
                width: 48, height: 48, flexShrink: 0,
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <span style={{
                width: 34, height: 34, borderRadius: '50%', background: 'var(--line)',
                color: 'var(--ink-soft)', fontSize: 20, lineHeight: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                ×
              </span>
            </button>
          </div>
        </div>

        {/* Contenido con scroll interno */}
        <div style={{
          overflowY: 'auto', overscrollBehavior: 'contain',
          padding: '4px 20px calc(24px + env(safe-area-inset-bottom))',
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}
