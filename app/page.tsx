'use client';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type {
  Profile, DbTask, AppState, DayState, UserPreferences, TaskCompletion,
  PointsLedgerEntry, Streak, BadgeEntry, FamilyContract, ContractSignature,
  EmotionLog, EmotionLabel, FamilyRule,
} from '@/lib/types';
import type { DayKey } from '@/lib/tasks';
import type { CreateContractResult, ContractRule } from '@/lib/contract';
import type { PaletteId, ThemeMode } from '@/lib/themes';
import { ROLE_DEFAULT_PALETTE, DEFAULT_PALETTE } from '@/lib/themes';
import StatusIndicator from '@/components/StatusIndicator';
import WeekTab from '@/components/WeekTab';
import ProgressTab from '@/components/ProgressTab';
import EventsTab from '@/components/EventsTab';
import WellnessTab from '@/components/WellnessTab';
import MiMundoTab from '@/components/MiMundoTab';
import AdminTab, { type AdminSection } from '@/components/AdminTab';
import GoldenRules from '@/components/GoldenRules';
import ThemeToggle from '@/components/ThemeToggle';
import ThemePicker from '@/components/ThemePicker';
import AvatarPicker from '@/components/AvatarPicker';
import PointsBadge from '@/components/PointsBadge';
import BadgeToast from '@/components/BadgeToast';
import { getTotalPoints, getCurrentStreak, hoyLima } from '@/lib/gamification';
import BottomNav, { type NavItem } from '@/components/BottomNav';
import HelpButton from '@/components/HelpButton';
import TaskDetailSheet from '@/components/TaskDetailSheet';
import ContractSheet from '@/components/ContractSheet';
import ContractPendingNotice from '@/components/ContractPendingNotice';

type PageState = 'loading' | 'no-profile-first' | 'no-profile-code' | 'ready';
type Tab = 'week' | 'progress' | 'events' | 'wellness' | 'mundo' | 'admin' | 'tema';

const BASE_TABS: { key: Tab; label: string }[] = [
  { key: 'week',     label: '📅 Semana' },
  { key: 'progress', label: '📈 Progreso' },
  { key: 'events',   label: '🎈 Eventos' },
  { key: 'wellness', label: '💚 Bienestar' },
  { key: 'mundo',    label: '💜 Mi mundo' },
  { key: 'tema',     label: '🎨 Personalizar' },
];

const supabase = createBrowserClient();

export default function Home() {
  const [pageState,   setPageState]   = useState<PageState>('loading');
  const [profile,     setProfile]     = useState<Profile | null>(null);
  const [tasks,       setTasks]       = useState<DbTask[]>([]);
  const [weeks,       setWeeks]       = useState<AppState['weeks']>({});
  const [saveStatus,  setSaveStatus]  = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [tab,              setTab]              = useState<Tab>('week');
  const [adminSection,     setAdminSection]     = useState<AdminSection>('tasks');
  const [codeInput,        setCodeInput]        = useState('');
  const [codeError,        setCodeError]        = useState('');
  const [codeLoading,      setCodeLoading]      = useState(false);
  const [displayName,      setDisplayName]      = useState('');
  const [creating,         setCreating]         = useState(false);
  const [childrenProfiles, setChildrenProfiles] = useState<Profile[]>([]);
  const [selectedChildId,  setSelectedChildId]  = useState<string | null>(null);
  const [allChildrenWeeks, setAllChildrenWeeks] = useState<Record<string, AppState['weeks']>>({});
  const [familyRules,      setFamilyRules]      = useState<FamilyRule[]>([]);
  const [avatarEmoji,      setAvatarEmoji]      = useState<string | null>(null);
  // task_completions: las del hijo activo + (padre) todas las de la familia agrupadas por user_id
  const [completions,            setCompletions]            = useState<TaskCompletion[]>([]);
  const [allChildrenCompletions, setAllChildrenCompletions] = useState<Record<string, TaskCompletion[]>>({});
  // Gamificación (solo hijo): puntos, racha e insignias propias
  const [pointsLedger, setPointsLedger] = useState<PointsLedgerEntry[]>([]);
  const [streak,       setStreak]       = useState<Streak | null>(null);
  const [badges,       setBadges]       = useState<BadgeEntry[]>([]);
  // Tracking emocional (010, solo hijo): últimos 30 registros propios. El padre nunca los carga.
  const [emotionLogs,  setEmotionLogs]  = useState<EmotionLog[]>([]);
  // Contrato familiar (Fase 4): contrato activo + sus firmas + miembros (ambos roles)
  const [contract,           setContract]           = useState<FamilyContract | null>(null);
  const [contractSignatures, setContractSignatures] = useState<ContractSignature[]>([]);
  const [familyMembers,      setFamilyMembers]      = useState<Profile[]>([]);
  const [contractSheetOpen,  setContractSheetOpen]  = useState(false);
  const [signingContract,    setSigningContract]    = useState(false);
  const [signContractError,  setSignContractError]  = useState<string | null>(null);
  // TaskDetailSheet: tarea + semana + día abiertos (la semana es la visible en WeekTab, no siempre la actual)
  const [taskDetailTask,    setTaskDetailTask]    = useState<DbTask | null>(null);
  const [taskDetailWeekKey, setTaskDetailWeekKey] = useState<string | null>(null);
  const [taskDetailDay,     setTaskDetailDay]     = useState<DayKey | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profileRow } = await supabase
        .from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (profileRow) { await loadAppData(profileRow as Profile); return; }
      const res = await fetch('/api/onboard');
      const { hasProfile } = await res.json();
      setPageState(hasProfile ? 'ready' : 'no-profile-first');
    }
    init();
  }, []);

  async function loadAppData(p: Profile) {
    setProfile(p);
    const [{ data: taskRows }, { data: ruleRows }, { data: prefsRow }] = await Promise.all([
      supabase.from('tasks').select('*').eq('family_id', p.family_id).eq('active', true).order('sort_order'),
      supabase.from('family_rules').select('*').eq('family_id', p.family_id).eq('active', true).order('sort_order'),
      supabase.from('user_preferences').select('*').eq('user_id', p.id).maybeSingle(),
    ]);
    setTasks((taskRows as DbTask[]) ?? []);
    setFamilyRules((ruleRows as FamilyRule[]) ?? []);

    // Contrato familiar (009): mismo flujo para padre e hijo.
    // Contrato activo + miembros (para el sheet de firmas) en paralelo.
    const [{ data: contractRow, error: contractErr }, { data: membersRows, error: membersErr }] = await Promise.all([
      supabase.from('family_contracts').select('*').eq('family_id', p.family_id).eq('active', true).maybeSingle(),
      supabase.from('profiles').select('*').eq('family_id', p.family_id),
    ]);
    if (contractErr) console.error('[page] family_contracts:', contractErr.message);
    if (membersErr)  console.error('[page] family_members:', membersErr.message);
    setContract((contractRow as FamilyContract | null) ?? null);
    setFamilyMembers((membersRows as Profile[]) ?? []);

    // Firmas SOLO del contrato activo (si existe).
    if (contractRow) {
      const { data: signatureRows, error: signErr } = await supabase
        .from('contract_signatures')
        .select('*')
        .eq('contract_id', (contractRow as FamilyContract).id);
      if (signErr) console.error('[page] contract_signatures:', signErr.message);
      setContractSignatures((signatureRows as ContractSignature[]) ?? []);
    } else {
      setContractSignatures([]);
    }

    // Apply palette + mode from Supabase (falls back to role default for new users)
    const prefs = prefsRow as UserPreferences | null;
    const palette = (prefs?.theme_palette ?? ROLE_DEFAULT_PALETTE[p.role] ?? DEFAULT_PALETTE) as PaletteId;
    const themeMode = (prefs?.theme_mode ?? 'auto') as ThemeMode;
    document.documentElement.setAttribute('data-palette', palette);
    if (themeMode === 'auto') {
      document.documentElement.removeAttribute('data-mode');
    } else {
      document.documentElement.setAttribute('data-mode', themeMode);
    }
    const avatar = prefs?.avatar_url ?? null;
    setAvatarEmoji(avatar);
    try {
      localStorage.setItem('mi-semana-palette', palette);
      localStorage.setItem('mi-semana-mode', themeMode);
      if (avatar) localStorage.setItem('mi-semana-avatar', avatar);
    } catch { /* storage unavailable */ }

    if (p.role === 'padre') {
      const [{ data: hijoRows }, { data: weekRows }, { data: completionRows, error: completionErr }] = await Promise.all([
        supabase.from('profiles').select('*').eq('family_id', p.family_id).eq('role', 'hijo'),
        supabase.from('weekly_state').select('*').eq('family_id', p.family_id),
        supabase.from('task_completions').select('*').eq('family_id', p.family_id),
      ]);
      if (completionErr) console.error('[page] task_completions:', completionErr.message);
      const hijos = (hijoRows as Profile[]) ?? [];
      setChildrenProfiles(hijos);

      const allWeeks: Record<string, AppState['weeks']> = {};
      for (const row of (weekRows ?? [])) {
        if (!allWeeks[row.user_id]) allWeeks[row.user_id] = {};
        if (!allWeeks[row.user_id][row.week_key]) allWeeks[row.user_id][row.week_key] = {};
        allWeeks[row.user_id][row.week_key][row.day] = row.state;
      }
      setAllChildrenWeeks(allWeeks);

      const byChild: Record<string, TaskCompletion[]> = {};
      for (const c of ((completionRows as TaskCompletion[]) ?? [])) {
        (byChild[c.user_id] ??= []).push(c);
      }
      setAllChildrenCompletions(byChild);

      const firstChildId = hijos.length > 0 ? hijos[0].id : null;
      setSelectedChildId(firstChildId);
      setWeeks(firstChildId ? (allWeeks[firstChildId] ?? {}) : {});
      setCompletions(firstChildId ? (byChild[firstChildId] ?? []) : []);
    } else {
      // Todas las semanas (igual que weekly_state): WeekTab navega semanas y ProgressTab mira 7.
      // Gamificación (008): si alguna query falla se loguea y se sigue con vacío.
      const [
        { data: weekRows }, { data: completionRows, error: completionErr },
        { data: ledgerRows, error: ledgerErr },
        { data: streakRow,  error: streakErr },
        { data: badgeRows,  error: badgeErr },
        { data: emotionRows, error: emotionErr },
      ] = await Promise.all([
        supabase.from('weekly_state').select('*').eq('family_id', p.family_id).eq('user_id', p.id),
        supabase.from('task_completions').select('*').eq('family_id', p.family_id).eq('user_id', p.id),
        supabase.from('points_ledger').select('*').eq('user_id', p.id),
        supabase.from('streaks').select('*').eq('user_id', p.id).maybeSingle(),
        supabase.from('badges').select('*').eq('user_id', p.id),
        supabase.from('emotion_logs').select('*').eq('user_id', p.id).order('log_date', { ascending: false }).limit(30),
      ]);
      if (completionErr) console.error('[page] task_completions:', completionErr.message);
      if (ledgerErr)     console.error('[page] points_ledger:', ledgerErr.message);
      if (streakErr)     console.error('[page] streaks:', streakErr.message);
      if (badgeErr)      console.error('[page] badges:', badgeErr.message);
      if (emotionErr)    console.error('[page] emotion_logs:', emotionErr.message);

      setCompletions((completionRows as TaskCompletion[]) ?? []);
      const assembled: AppState['weeks'] = {};
      for (const row of (weekRows ?? [])) {
        if (!assembled[row.week_key]) assembled[row.week_key] = {};
        assembled[row.week_key][row.day] = row.state;
      }
      setWeeks(assembled);
      setPointsLedger((ledgerRows as PointsLedgerEntry[]) ?? []);
      setStreak((streakRow as Streak | null) ?? null);
      setBadges((badgeRows as BadgeEntry[]) ?? []);
      setEmotionLogs((emotionRows as EmotionLog[]) ?? []);
    }
    setPageState('ready');
  }

  function handleSelectChild(childId: string) {
    setSelectedChildId(childId);
    setWeeks(allChildrenWeeks[childId] ?? {});
    setCompletions(allChildrenCompletions[childId] ?? []);
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
    if (!profile || profile.role === 'padre') return;
    setWeeks(prev => ({
      ...prev,
      [weekKey]: { ...(prev[weekKey] ?? {}), [day]: dayState },
    }));
    setSaveStatus('saving');
    if (saveTimerRef.current)  clearTimeout(saveTimerRef.current);
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    const upsert = { family_id: profile.family_id, week_key: weekKey, day, state: dayState, user_id: profile.id };
    saveTimerRef.current = setTimeout(async () => {
      const { error } = await supabase
        .from('weekly_state').upsert(upsert, { onConflict: 'family_id,week_key,day,user_id' });
      if (error) {
        setSaveStatus('error');
        retryTimerRef.current = setTimeout(async () => {
          const { error: e2 } = await supabase
            .from('weekly_state').upsert(upsert, { onConflict: 'family_id,week_key,day,user_id' });
          setSaveStatus(e2 ? 'error' : 'saved');
        }, 2000);
      } else {
        setSaveStatus('saved');
      }
    }, 800);
  }, [profile]);

  // Cola del padre: completions de todos los hijos esperando revisión, más recientes primero.
  const pendingReviews = useMemo(() => {
    const all = Object.values(allChildrenCompletions).flat();
    return all.filter(c => c.status === 'done').sort((a, b) =>
      new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
    );
  }, [allChildrenCompletions]);

  // Evita dos requests simultáneos sobre la misma tarea/día (doble tap).
  const togglesInFlight = useRef<Set<string>>(new Set());

  // El estado real de la completion se lee del state (no del caller), porque
  // "rejected" se muestra sin marcar pero existe la fila: tocarla debe re-marcar, no borrar.
  async function handleToggleTask(taskId: string, weekKey: string, day: DayKey) {
    if (!profile || profile.role !== 'hijo') return;
    const key = `${taskId}__${weekKey}__${day}`;
    if (togglesInFlight.current.has(key)) return;

    const matches = (c: TaskCompletion) =>
      c.task_id === taskId && c.week_key === weekKey && c.day === day;
    const existing = completions.find(matches) ?? null;
    // Aprobada: no se toca (RLS lo bloquearía; mejor no enviar el request).
    if (existing?.status === 'approved') return;

    togglesInFlight.current.add(key);
    setSaveStatus('saving');

    if (existing?.status === 'done') {
      // Desmarcar. Optimistic: quitar; si falla, reponer la fila original.
      setCompletions(prev => prev.filter(c => !matches(c)));
      const { error } = await supabase
        .from('task_completions').delete()
        .eq('task_id', taskId).eq('user_id', profile.id).eq('week_key', weekKey).eq('day', day);
      if (error) {
        console.error('[page] desmarcar tarea:', error.message);
        setCompletions(prev => [...prev.filter(c => !matches(c)), existing]);
        setSaveStatus('error');
      } else {
        setSaveStatus('saved');
      }
    } else {
      // Marcar (nueva) o re-marcar tras rechazo (fresh start: se limpia el review,
      // igual que hace el trigger de la 007). Optimistic: fila temporal → fila real.
      const now = new Date().toISOString();
      const temp: TaskCompletion = {
        id: existing?.id ?? `temp-${key}`, task_id: taskId, family_id: profile.family_id, user_id: profile.id,
        week_key: weekKey, day, status: 'done', evidence_url: null, notes: existing?.notes ?? null,
        completed_at: now, reviewed_at: null, reviewed_by: null, comment: null,
        created_at: existing?.created_at ?? now, updated_at: now,
      };
      setCompletions(prev => [...prev.filter(c => !matches(c)), temp]);
      const { data, error } = await supabase
        .from('task_completions')
        .upsert(
          { task_id: taskId, family_id: profile.family_id, user_id: profile.id,
            week_key: weekKey, day, status: 'done', completed_at: now,
            comment: null, reviewed_at: null, reviewed_by: null },
          { onConflict: 'task_id,user_id,week_key,day' },
        )
        .select()
        .single();
      if (error) {
        console.error('[page] marcar tarea:', error.message);
        // Rollback: si era un rechazo, vuelve a quedar rechazada.
        setCompletions(prev => [...prev.filter(c => !matches(c)), ...(existing ? [existing] : [])]);
        setSaveStatus('error');
      } else {
        setCompletions(prev => [...prev.filter(c => !matches(c)), data as TaskCompletion]);
        setSaveStatus('saved');
      }
    }
    togglesInFlight.current.delete(key);
  }

  // ── Revisión del padre (Fase 2) ─────────────────────────────────────────────
  // Aplica un cambio a una completion en los dos estados del padre:
  // allChildrenCompletions (fuente) y completions (hijo seleccionado en Semana/Progreso).
  function replaceCompletion(updated: TaskCompletion) {
    const swap = (list: TaskCompletion[]) => list.map(c => c.id === updated.id ? updated : c);
    setAllChildrenCompletions(prev => ({
      ...prev,
      [updated.user_id]: swap(prev[updated.user_id] ?? []),
    }));
    setCompletions(prev => swap(prev));
  }

  async function reviewCompletion(id: string, status: 'approved' | 'rejected', comment: string | null) {
    if (!profile || profile.role !== 'padre') return;
    const original = Object.values(allChildrenCompletions).flat().find(c => c.id === id);
    if (!original || original.status !== 'done') return;

    // Optimistic. reviewed_at/reviewed_by/updated_at reales los fija el trigger (007).
    const now = new Date().toISOString();
    replaceCompletion({ ...original, status, comment, reviewed_at: now, reviewed_by: profile.id, updated_at: now });
    setSaveStatus('saving');

    const { data, error } = await supabase
      .from('task_completions')
      .update({ status, comment })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error(`[page] revisar completion (${status}):`, error.message);
      replaceCompletion(original);
      setSaveStatus('error');
    } else {
      replaceCompletion(data as TaskCompletion);
      setSaveStatus('saved');
    }
  }

  function handleApproveCompletion(id: string, comment?: string) {
    return reviewCompletion(id, 'approved', comment?.trim() || null);
  }

  function handleRejectCompletion(id: string, comment: string) {
    // El comentario es obligatorio; la UI (AdminTab) valida antes de llamar.
    const trimmed = comment.trim();
    if (!trimmed) return Promise.resolve();
    return reviewCompletion(id, 'rejected', trimmed);
  }

  async function handleMarkBadgesNotified(ids: string[]) {
    // Optimistic: el toast se cierra al instante. Si el UPDATE falla, la insignia sigue
    // con notified_at null en DB y el toast vuelve a salir en la próxima carga.
    const now = new Date().toISOString();
    setBadges(prev => prev.map(b =>
      ids.includes(b.id) ? { ...b, notified_at: now } : b
    ));
    const { error } = await supabase
      .from('badges')
      .update({ notified_at: now })
      .in('id', ids);
    if (error) console.error('[page] mark badges notified:', error.message);
  }

  // ── Contrato familiar (Fase 4) ──────────────────────────────────────────────

  async function handleSignContract(contractId: string) {
    if (!profile || signingContract) return;
    setSigningContract(true);
    setSignContractError(null);
    const now = new Date().toISOString();
    const temp: ContractSignature = {
      id: `temp-${Date.now()}`,
      contract_id: contractId,
      family_id: profile.family_id,
      user_id: profile.id,
      signed_at: now,
    };
    setContractSignatures(prev => [...prev, temp]);

    const { data, error } = await supabase
      .from('contract_signatures')
      .insert({ contract_id: contractId, family_id: profile.family_id, user_id: profile.id })
      .select()
      .single();

    if (error) {
      console.error('[page] firmar contrato:', error.message);
      setContractSignatures(prev => prev.filter(s => s.id !== temp.id));
      setSignContractError('No se pudo firmar. Revisa tu conexión e intenta de nuevo.');
      setSigningContract(false);
      return;
    }

    setContractSignatures(prev => prev.map(s => s.id === temp.id ? (data as ContractSignature) : s));

    // Recargar badges: el trigger otorgó contract_signed (si el firmante es hijo).
    const { data: badgeRows } = await supabase
      .from('badges').select('*').eq('user_id', profile.id);
    setBadges((badgeRows as BadgeEntry[]) ?? []);

    setSigningContract(false);
  }

  // Crea el contrato y reemplaza las Reglas de oro en la misma transacción (RPC 012).
  // Devuelve null si salió bien, o el mensaje de error para mostrar en el editor.
  async function handleCreateContract(intro: string, rules: ContractRule[]): Promise<string | null> {
    if (!profile) return 'No se pudo crear el contrato. Recarga la página e intenta de nuevo.';
    const { data, error } = await supabase.rpc('create_family_contract', { p_intro: intro, p_rules: rules });
    if (error) {
      console.error('[page] crear contrato:', error.message);
      // P0001 = raise exception de la RPC (mensajes de validación en español).
      return error.code === 'P0001'
        ? error.message
        : 'No se pudo crear el contrato. Revisa tu conexión e intenta de nuevo.';
    }
    const newContract = data as CreateContractResult;
    setContract(newContract);

    // Recargar Reglas de oro: la RPC las reemplazó por las del contrato.
    const { data: ruleRows } = await supabase
      .from('family_rules').select('*')
      .eq('family_id', profile.family_id).eq('active', true).order('sort_order');
    setFamilyRules((ruleRows as FamilyRule[]) ?? []);

    // Recargar firmas del nuevo contrato (el RPC firmó al padre automáticamente).
    const { data: signatureRows } = await supabase
      .from('contract_signatures')
      .select('*')
      .eq('contract_id', newContract.id);
    setContractSignatures((signatureRows as ContractSignature[]) ?? []);
    return null;
  }

  // Semana → "Editar en Contrato →": las reglas solo se editan desde el contrato.
  function openContractEditor() {
    setAdminSection('contract');
    setTab('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Tracking emocional (Módulo 2, Fase 4) ───────────────────────────────────

  async function handleSaveEmotion(emotion: EmotionLabel, intensity: number, note: string): Promise<boolean> {
    if (!profile || profile.role !== 'hijo') return false;
    const today = hoyLima();
    const payload = {
      user_id: profile.id,
      family_id: profile.family_id,
      log_date: today,
      emotion,
      intensity,
      note: note.trim() || null,
    };

    const prev = emotionLogs;
    const existing = prev.find(l => l.log_date === today);
    const optimistic: EmotionLog = {
      id: existing?.id ?? `temp-${Date.now()}`,
      user_id: profile.id,
      family_id: profile.family_id,
      log_date: today,
      emotion,
      intensity,
      note: payload.note,
      created_at: existing?.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setEmotionLogs([optimistic, ...prev.filter(l => l.log_date !== today)]);

    const { data, error } = await supabase
      .from('emotion_logs')
      .upsert(payload, { onConflict: 'user_id,log_date' })
      .select()
      .single();

    if (error) {
      console.error('[page] guardar emoción:', error.message);
      setEmotionLogs(prev);
      return false;
    }
    setEmotionLogs(current => [data as EmotionLog, ...current.filter(l => l.log_date !== today)]);

    // Recargar badges: el trigger pudo otorgar first_emotion_log.
    const { data: badgeRows } = await supabase.from('badges').select('*').eq('user_id', profile.id);
    setBadges((badgeRows as BadgeEntry[]) ?? []);

    return true;
  }

  function handleOpenTaskDetail(task: DbTask, weekKey: string, day: DayKey) {
    setTaskDetailTask(task);
    setTaskDetailWeekKey(weekKey);
    setTaskDetailDay(day);
  }

  function handleCloseTaskDetail() {
    setTaskDetailTask(null);
    setTaskDetailWeekKey(null);
    setTaskDetailDay(null);
  }

  // Derivados del sheet abierto: se recalculan en cada render, así el sheet refleja el toggle al instante.
  const detailCompletion = taskDetailTask && taskDetailWeekKey && taskDetailDay
    ? completions.find(c =>
        c.task_id === taskDetailTask.id && c.week_key === taskDetailWeekKey && c.day === taskDetailDay) ?? null
    : null;
  const detailSkipped = taskDetailTask && taskDetailWeekKey && taskDetailDay
    ? !!((weeks[taskDetailWeekKey]?.[taskDetailDay] as DayState | undefined)?.skipped as Record<string, boolean> | undefined)?.[taskDetailTask.slug]
    : false;

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  if (pageState === 'loading') return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column', gap: 12 }}>
      <span style={{ fontSize: 32 }}>✨</span>
      <span style={{ fontFamily: 'var(--font-title)', color: 'var(--accent)', fontSize: 18 }}>Cargando tu semana...</span>
    </div>
  );

  if (pageState === 'no-profile-first') return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '0 24px' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <h2 style={{ fontFamily: 'var(--font-title)', color: 'var(--accent)', fontSize: 22, marginBottom: 8 }}>¡Bienvenid@! 🎉</h2>
        <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 24 }}>Crea tu familia ingresando tu nombre.</p>
        <input value={displayName} onChange={e => setDisplayName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreateFamily()} placeholder="Tu nombre"
          style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--line)', background: 'var(--bg-card)', color: 'var(--ink)', fontFamily: 'var(--font-body)', fontSize: 15, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }} />
        <button onClick={handleCreateFamily} disabled={!displayName.trim() || creating}
          style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: 'var(--accent)', color: 'var(--on-accent)', fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
          {creating ? 'Creando...' : 'Entrar como papá/mamá'}
        </button>
        <button onClick={() => setPageState('no-profile-code')}
          style={{ width: '100%', marginTop: 12, padding: '11px', borderRadius: 12, border: '1.5px solid var(--line)', background: 'transparent', color: 'var(--ink-soft)', fontFamily: 'var(--font-body)', fontSize: 14, cursor: 'pointer' }}>
          Tengo un código de invitación
        </button>
      </div>
    </div>
  );

  if (pageState === 'no-profile-code') return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '0 24px' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <h2 style={{ fontFamily: 'var(--font-title)', color: 'var(--accent)', fontSize: 22, marginBottom: 8 }}>Ingresa tu código</h2>
        <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 24 }}>Pídele el código de 6 dígitos a tus papás.</p>
        <input value={codeInput} onChange={e => setCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
          onKeyDown={e => e.key === 'Enter' && handleRedeemCode()} placeholder="000000" maxLength={6}
          style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${codeError ? 'var(--error)' : 'var(--line)'}`, background: 'var(--bg-card)', color: 'var(--ink)', fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 24, letterSpacing: 6, textAlign: 'center', outline: 'none', marginBottom: 8, boxSizing: 'border-box' }} />
        {codeError && <p style={{ color: 'var(--error)', fontSize: 13, marginBottom: 12 }}>{codeError}</p>}
        <button onClick={handleRedeemCode} disabled={codeInput.length !== 6 || codeLoading}
          style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: 'var(--accent)', color: 'var(--on-accent)', fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 4 }}>
          {codeLoading ? 'Verificando...' : 'Entrar'}
        </button>
        <p style={{ textAlign: 'center', color: 'var(--ink-soft)', fontSize: 12, marginTop: 20 }}>
          ¿El código no funciona? Pídele a tus papás que generen uno nuevo.
        </p>
      </div>
    </div>
  );

  const isAdmin = profile?.role === 'padre';
  // El padre ve "Mi mundo" solo dentro de Admin → Mi mundo (no como pestaña principal).
  const TABS = isAdmin
    ? [...BASE_TABS.filter(t => t.key !== 'mundo'), { key: 'admin' as Tab, label: '⚙️ Admin' }]
    : BASE_TABS;
  // Si algo deja tab === 'mundo' con rol padre, cae a Admin.
  const activeTab: Tab = isAdmin && tab === 'mundo' ? 'admin' : tab;

  const HIJO_NAV: NavItem[] = [
    { key: 'week',     icon: '📅', label: 'Semana'   },
    { key: 'mundo',    icon: '💜', label: 'Mi mundo'  },
    { key: 'wellness', icon: '💚', label: 'Bienestar' },
    { key: 'progress', icon: '📊', label: 'Logros'    },
    { key: 'events',   icon: '🎈', label: 'Eventos'   },
    { key: 'tema',     icon: '🎨', label: 'Personalizar' },
  ];
  const PADRE_NAV: NavItem[] = [
    { key: 'admin',    icon: '⚙️', label: 'Admin'     },
    { key: 'week',     icon: '📅', label: 'Semana'    },
    { key: 'progress', icon: '📊', label: 'Logros'    },
    { key: 'events',   icon: '🎈', label: 'Eventos'   },
    { key: 'wellness', icon: '💚', label: 'Bienestar' },
    { key: 'tema',     icon: '🎨', label: 'Personalizar' },
  ];
  const navItems = isAdmin ? PADRE_NAV : HIJO_NAV;

  return (
    <>
      <StatusIndicator status={saveStatus} />
      <div className="main-content" style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px 100px' }}>
        <header style={{ display: 'flex', alignItems: 'center', padding: '20px 0 16px', gap: 12 }}>
          {/* Avatar bubble — tappable, navega a Perfil */}
          <button
            onClick={() => setTab('tema')}
            title="Cambiar avatar o paleta"
            aria-label="Cambiar avatar o paleta"
            style={{
              width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
              background: 'var(--accent-soft)', border: '2px solid var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: avatarEmoji ? 26 : 18, cursor: 'pointer',
              color: 'var(--accent)', fontFamily: 'var(--font-title)', fontWeight: 700,
              padding: 0,
            }}
          >
            {avatarEmoji ?? (profile?.display_name?.[0]?.toUpperCase() ?? '?')}
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 30, color: 'var(--accent)', letterSpacing: 1 }}>MI SEMANA</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
              <p style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-soft)', fontSize: 14 }}>{profile?.display_name}</p>
              {profile?.role === 'hijo' && (
                <PointsBadge points={getTotalPoints(pointsLedger)} streak={getCurrentStreak(streak)} />
              )}
            </div>
          </div>
          <ThemeToggle userId={profile?.id} />
          <button onClick={handleSignOut} className="btn-salir"
            style={{ padding: '7px 12px', borderRadius: 10, border: '1.5px solid var(--line)', background: 'var(--bg-card)', color: 'var(--ink-soft)', fontFamily: 'var(--font-body)', fontSize: 12, cursor: 'pointer' }}>
            Salir
          </button>
        </header>

        {/* Top nav — desktop only (hidden on mobile via .top-nav-wrapper CSS class) */}
        <div className="top-nav-wrapper">
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '0 0 8px', marginBottom: 16, scrollbarWidth: 'none' }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ flexShrink: 0, padding: '9px 14px', borderRadius: 20, background: activeTab === t.key ? 'var(--accent)' : 'var(--bg-card)', color: activeTab === t.key ? 'var(--on-accent)' : 'var(--ink-soft)', border: activeTab === t.key ? '1.5px solid var(--accent)' : '1.5px solid var(--line)', fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        {activeTab === 'week'     && <WeekTab weeks={weeks} tasks={tasks} onChange={handleWeeksChange}
          completions={completions}
          role={profile?.role === 'padre' ? 'padre' : 'hijo'}
          onToggleTask={handleToggleTask}
          onOpenDetail={handleOpenTaskDetail}
          childDisplayName={
            profile?.role === 'hijo'
              ? profile.display_name
              : childrenProfiles.find(c => c.id === selectedChildId)?.display_name
          }
          rulesSlot={
            profile?.role === 'padre'
              ? <GoldenRules
                  rules={familyRules}
                  emptyText="Aún no definen Reglas de oro. Créenlas juntos en el Contrato familiar."
                  onEdit={openContractEditor}
                />
              : <>
                  <GoldenRules rules={familyRules} />
                  {profile && (
                    <ContractPendingNotice
                      contract={contract}
                      signatures={contractSignatures}
                      userId={profile.id}
                      onOpen={() => setContractSheetOpen(true)}
                    />
                  )}
                </>
          }
        />}
        {activeTab === 'progress' && (
          <ProgressTab
            state={{ weeks, events: [] }}
            tasks={tasks}
            completions={completions}
            earnedBadges={profile?.role === 'hijo' ? badges : undefined}
            contract={contract}
            contractSignatures={contractSignatures}
            onOpenContract={() => setContractSheetOpen(true)}
            currentUserId={profile?.id ?? ''}
          />
        )}
        {activeTab === 'events'   && profile && <EventsTab familyId={profile.family_id} role={profile.role} />}
        {activeTab === 'wellness' && <WellnessTab />}
        {activeTab === 'mundo'    && profile && (
          <MiMundoTab
            familyId={profile.family_id}
            role={profile.role}
            emotionLogs={profile.role === 'hijo' ? emotionLogs : undefined}
            onSaveEmotion={profile.role === 'hijo' ? handleSaveEmotion : undefined}
          />
        )}
        {activeTab === 'tema' && profile && (
          <>
            <AvatarPicker
              userId={profile.id}
              initialAvatar={avatarEmoji}
              onAvatarChange={setAvatarEmoji}
            />
            <div style={{ height: 1, background: 'var(--line)', margin: '28px 0' }} />
            <ThemePicker userId={profile.id} />
          </>
        )}
        {activeTab === 'admin'    && isAdmin && profile && (
          <AdminTab
            section={adminSection}
            onSectionChange={setAdminSection}
            familyId={profile.family_id}
            tasks={tasks}
            onTasksChange={setTasks}
            childrenProfiles={childrenProfiles}
            selectedChildId={selectedChildId}
            onSelectChild={handleSelectChild}
            pendingReviews={pendingReviews}
            onApproveCompletion={handleApproveCompletion}
            onRejectCompletion={handleRejectCompletion}
            contract={contract}
            contractSignatures={contractSignatures}
            profile={profile}
            familyMembers={familyMembers}
            currentRules={familyRules}
            onCreateContract={handleCreateContract}
            onSignContract={handleSignContract}
            signingContract={signingContract}
            signContractError={signContractError}
            onOpenResources={() => { setTab('wellness'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          />
        )}
      </div>

      {/* Bottom nav — mobile only (shown via .bottom-nav-outer CSS class) */}
      <div className="bottom-nav-outer">
        <BottomNav
          items={navItems}
          active={activeTab}
          onSelect={(key) => setTab(key as Tab)}
        />
      </div>

      {/* HelpButton — always visible, above bottom nav */}
      <HelpButton />

      <TaskDetailSheet
        task={taskDetailTask}
        day={taskDetailDay}
        role={profile?.role === 'padre' ? 'padre' : 'hijo'}
        completion={detailCompletion}
        skipped={detailSkipped}
        onClose={handleCloseTaskDetail}
        onToggle={() => {
          if (taskDetailTask && taskDetailWeekKey && taskDetailDay) {
            handleToggleTask(taskDetailTask.id, taskDetailWeekKey, taskDetailDay);
          }
        }}
      />

      {/* No se cierra al firmar: el usuario debe ver "✓ Ya firmaste este contrato". */}
      {contract && profile && (
        <ContractSheet
          open={contractSheetOpen}
          onClose={() => setContractSheetOpen(false)}
          contract={contract}
          signatures={contractSignatures}
          profile={profile}
          familyMembers={familyMembers}
          signing={signingContract}
          error={signContractError}
          onSign={(id) => { handleSignContract(id); }}
        />
      )}

      {profile?.role === 'hijo' && (
        <BadgeToast badges={badges} onMarkNotified={handleMarkBadgesNotified} />
      )}
    </>
  );
}
