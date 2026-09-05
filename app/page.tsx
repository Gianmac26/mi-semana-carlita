'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, SaveStatus } from '@/lib/types';
import StatusIndicator from '@/components/StatusIndicator';
import WeekTab from '@/components/WeekTab';
import ProgressTab from '@/components/ProgressTab';
import EventsTab from '@/components/EventsTab';
import ArticlesTab from '@/components/ArticlesTab';
import MiMundoTab from '@/components/MiMundoTab';
import ThemeToggle from '@/components/ThemeToggle';

const EMPTY: AppState = { weeks: {}, events: [] };
type Tab = 'week' | 'progress' | 'events' | 'articles' | 'mundo';

const TABS: { key: Tab; label: string }[] = [
  { key: 'week',     label: '📅 Semana' },
  { key: 'progress', label: '📈 Progreso' },
  { key: 'events',   label: '🎈 Eventos' },
  { key: 'articles', label: '📚 Para ti' },
  { key: 'mundo',    label: '💜 Mi mundo' },
];

export default function Home() {
  const [appState,    setAppState]    = useState<AppState>(EMPTY);
  const [saveStatus,  setSaveStatus]  = useState<SaveStatus>('idle');
  const [tab,         setTab]         = useState<Tab>('week');
  const [loaded,      setLoaded]      = useState(false);

  const saveTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial load
  useEffect(() => {
    fetch('/api/state')
      .then(r => r.json())
      .then((data: AppState) => { setAppState(data ?? EMPTY); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  // Polling every 20s
  useEffect(() => {
    const id = setInterval(() => {
      fetch('/api/state')
        .then(r => r.json())
        .then((data: AppState) => { if (data) setAppState(data); })
        .catch(() => {});
    }, 20_000);
    return () => clearInterval(id);
  }, []);

  const save = useCallback(async (s: AppState) => {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s),
      });
      if (!res.ok) throw new Error('fail');
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
      if (retryTimer.current) clearTimeout(retryTimer.current);
      retryTimer.current = setTimeout(() => save(s), 2_000);
    }
  }, []);

  const handleChange = useCallback((newState: AppState) => {
    setAppState(newState);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(newState), 800);
  }, [save]);

  if (!loaded) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: '100vh', flexDirection: 'column', gap: 12,
      }}>
        <span style={{ fontSize: 32 }}>✨</span>
        <span style={{
          fontFamily: 'var(--font-title)', color: 'var(--pink)', fontSize: 18,
        }}>
          Cargando tu semana...
        </span>
      </div>
    );
  }

  return (
    <>
      <StatusIndicator status={saveStatus} />

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px 100px' }}>
        {/* Header */}
        <header style={{
          display: 'flex', alignItems: 'center',
          padding: '20px 0 16px', gap: 12,
        }}>
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontFamily: 'var(--font-title)', fontWeight: 700,
              fontSize: 30, color: 'var(--pink)', letterSpacing: 1,
            }}>
              MI SEMANA
            </h1>
            <p style={{
              fontFamily: 'var(--font-body)', color: 'var(--ink-soft)',
              fontSize: 14, marginTop: 2,
            }}>
              Tus responsabilidades ✨
            </p>
          </div>
          <ThemeToggle />
        </header>

        {/* Tab bar — scrollable */}
        <div style={{
          display: 'flex', gap: 6, overflowX: 'auto',
          padding: '0 0 8px', marginBottom: 16,
          scrollbarWidth: 'none',
        }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flexShrink: 0, padding: '9px 14px', borderRadius: 20,
                background: tab === t.key ? 'var(--pink)' : 'var(--bg-card)',
                color: tab === t.key ? '#fff' : 'var(--ink-soft)',
                border: tab === t.key ? '1.5px solid var(--pink)' : '1.5px solid var(--line)',
                fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 13,
                cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === 'week'     && <WeekTab     state={appState} onChange={handleChange} />}
        {tab === 'progress' && <ProgressTab state={appState} />}
        {tab === 'events'   && <EventsTab   state={appState} onChange={handleChange} />}
        {tab === 'articles' && <ArticlesTab />}
        {tab === 'mundo'    && <MiMundoTab state={appState} onChange={handleChange} />}
      </div>
    </>
  );
}
