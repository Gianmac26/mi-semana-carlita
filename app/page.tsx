'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Profile, DbTask, AppState, DayState } from '@/lib/types';
import StatusIndicator from '@/components/StatusIndicator';
import WeekTab from '@/components/WeekTab';
import ProgressTab from '@/components/ProgressTab';
import EventsTab from '@/components/EventsTab';
import ArticlesTab from '@/components/ArticlesTab';
import MiMundoTab from '@/components/MiMundoTab';
import AdminTab from '@/components/AdminTab';
import ThemeToggle from '@/components/ThemeToggle';

type PageState = 'loading' | 'no-profile-first' | 'no-profile-code' | 'ready';
type Tab = 'week' | 'progress' | 'events' | 'articles' | 'mundo' | 'admin';

const BASE_TABS: { key: Tab; label: string }[] = [
  { key: 'week',     label: '📅 Semana' },
  { key: 'progress', label: '📈 Progreso' },
  { key: 'events',   label: '🎈 Eventos' },
  { key: 'articles', label: '📚 Para ti' },
  { key: 'mundo',    label: '💜 Mi mundo' },
];

const supabase = createBrowserClient();

export default function Home() {
  const [pageState,   setPageState]   = useState<PageState>('loading');
  const [profile,     setProfile]     = useState<Profile | null>(null);
  const [tasks,       setTasks]       = useState<DbTask[]>([]);
  const [weeks,       setWeeks]       = useState<AppState['weeks']>({});
  const [saveStatus,  setSaveStatus]  = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [tab,         setTab]         = useState<Tab>('week');
  const [codeInput,   setCodeInput]   = useState('');
  const [codeError,   setCodeError]   = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [creating,    setCreating]    = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profileRow } = await supabase
        .from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (profileRow) { await loadAppData(profileRow as Profile); return; }
      const res = await fetch('/api/onboard');
      const { isFirstUser } = await res.json();
      setPageState(isFirstUser ? 'no-profile-first' : 'no-profile-code');
    }
    init();
  }, []);

  async function loadAppData(p: Profile) {
    setProfile(p);
    const [{ data: taskRows }, { data: weekRows }] = await Promise.all([
      supabase.from('tasks').select('*').eq('family_id', p.family_id).eq('active', true).order('sort_order'),
      supabase.from('weekly_state').select('*').eq('family_id', p.family_id),
    ]);
    setTasks((taskRows as DbTask[]) ?? []);
    const assembled: AppState['weeks'] = {};
    for (const row of (weekRows ?? [])) {
      if (!assembled[row.week_key]) assembled[row.week_key] = {};
      assembled[row.week_key][row.day] = row.state;
    }
    setWeeks(assembled);
    setPageState('ready');
  }

  async function handleCreateFamily() {
    if (!displayName.trim()) return;
    setCreating(true);
    const res = await fetch('/api/onboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: displayName.trim() }),
    });
    if (res.ok) {
      const { profile: p } = await res.json();
      await loadAppData(p as Profile);
    }
    setCreating(false);
  }

  async function handleRedeemCode() {
    if (!codeInput.trim()) return;
    setCodeLoading(true);
    setCodeError('');
    const res = await fetch('/api/invite/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: codeInput.trim() }),
    });
    if (res.ok) {
      const { profile: p } = await res.json();
      await loadAppData(p as Profile);
    } else {
      const { error } = await res.json();
      setCodeError(error ?? 'Código inválido o vencido.');
    }
    setCodeLoading(false);
  }

  const saveTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleWeeksChange = useCallback((weekKey: string, day: string, dayState: DayState) => {
    if (!profile) return;
    setWeeks(prev => ({
      ...prev,
      [weekKey]: { ...(prev[weekKey] ?? {}), [day]: dayState },
    }));
    setSaveStatus('saving');
    if (saveTimerRef.current)  clearTimeout(saveTimerRef.current);
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    const upsert = { family_id: profile.family_id, week_key: weekKey, day, state: dayState };
    saveTimerRef.current = setTimeout(async () => {
      const { error } = await supabase
        .from('weekly_state').upsert(upsert, { onConflict: 'family_id,week_key,day' });
      if (error) {
        setSaveStatus('error');
        retryTimerRef.current = setTimeout(async () => {
          const { error: e2 } = await supabase
            .from('weekly_state').upsert(upsert, { onConflict: 'family_id,week_key,day' });
          setSaveStatus(e2 ? 'error' : 'saved');
        }, 2000);
      } else {
        setSaveStatus('saved');
      }
    }, 800);
  }, [profile]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  if (pageState === 'loading') return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column', gap: 12 }}>
      <span style={{ fontSize: 32 }}>✨</span>
      <span style={{ fontFamily: 'var(--font-title)', color: 'var(--pink)', fontSize: 18 }}>Cargando tu semana...</span>
    </div>
  );

  if (pageState === 'no-profile-first') return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '0 24px' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <h2 style={{ fontFamily: 'var(--font-title)', color: 'var(--pink)', fontSize: 22, marginBottom: 8 }}>¡Bienvenida! 🎉</h2>
        <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 24 }}>Eres la primera persona en entrar. ¿Cuál es tu nombre?</p>
        <input value={displayName} onChange={e => setDisplayName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreateFamily()} placeholder="Tu nombre"
          style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--line)', background: 'var(--bg-card)', color: 'var(--ink)', fontFamily: 'var(--font-body)', fontSize: 15, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }} />
        <button onClick={handleCreateFamily} disabled={!displayName.trim() || creating}
          style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: 'var(--pink)', color: '#fff', fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
          {creating ? 'Creando...' : 'Entrar como papá/mamá'}
        </button>
      </div>
    </div>
  );

  if (pageState === 'no-profile-code') return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '0 24px' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <h2 style={{ fontFamily: 'var(--font-title)', color: 'var(--pink)', fontSize: 22, marginBottom: 8 }}>Ingresa tu código</h2>
        <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 24 }}>Pídele el código de 6 dígitos a tus papás.</p>
        <input value={codeInput} onChange={e => setCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
          onKeyDown={e => e.key === 'Enter' && handleRedeemCode()} placeholder="000000" maxLength={6}
          style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${codeError ? 'var(--error, #e53e3e)' : 'var(--line)'}`, background: 'var(--bg-card)', color: 'var(--ink)', fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 24, letterSpacing: 6, textAlign: 'center', outline: 'none', marginBottom: 8, boxSizing: 'border-box' }} />
        {codeError && <p style={{ color: 'var(--error, #e53e3e)', fontSize: 13, marginBottom: 12 }}>{codeError}</p>}
        <button onClick={handleRedeemCode} disabled={codeInput.length !== 6 || codeLoading}
          style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: 'var(--pink)', color: '#fff', fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 4 }}>
          {codeLoading ? 'Verificando...' : 'Entrar'}
        </button>
        <p style={{ textAlign: 'center', color: 'var(--ink-soft)', fontSize: 12, marginTop: 20 }}>
          ¿El código no funciona? Pídele a tus papás que generen uno nuevo.
        </p>
      </div>
    </div>
  );

  const isAdmin = profile?.role === 'padre';
  const TABS = isAdmin ? [...BASE_TABS, { key: 'admin' as Tab, label: '⚙️ Admin' }] : BASE_TABS;

  return (
    <>
      <StatusIndicator status={saveStatus} />
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px 100px' }}>
        <header style={{ display: 'flex', alignItems: 'center', padding: '20px 0 16px', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 30, color: 'var(--pink)', letterSpacing: 1 }}>MI SEMANA</h1>
            <p style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-soft)', fontSize: 14, marginTop: 2 }}>{profile?.display_name} ✨</p>
          </div>
          <ThemeToggle />
          <button onClick={handleSignOut}
            style={{ padding: '7px 12px', borderRadius: 10, border: '1.5px solid var(--line)', background: 'var(--bg-card)', color: 'var(--ink-soft)', fontFamily: 'var(--font-body)', fontSize: 12, cursor: 'pointer' }}>
            Salir
          </button>
        </header>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '0 0 8px', marginBottom: 16, scrollbarWidth: 'none' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ flexShrink: 0, padding: '9px 14px', borderRadius: 20, background: tab === t.key ? 'var(--pink)' : 'var(--bg-card)', color: tab === t.key ? '#fff' : 'var(--ink-soft)', border: tab === t.key ? '1.5px solid var(--pink)' : '1.5px solid var(--line)', fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>
        {tab === 'week'     && <WeekTab weeks={weeks} tasks={tasks} onChange={handleWeeksChange} />}
        {tab === 'progress' && <ProgressTab state={{ weeks, events: [] }} tasks={tasks} />}
        {tab === 'events'   && profile && <EventsTab familyId={profile.family_id} role={profile.role} />}
        {tab === 'articles' && <ArticlesTab />}
        {tab === 'mundo'    && profile && <MiMundoTab familyId={profile.family_id} role={profile.role} />}
        {tab === 'admin'    && isAdmin && profile && <AdminTab familyId={profile.family_id} tasks={tasks} onTasksChange={setTasks} />}
      </div>
    </>
  );
}
