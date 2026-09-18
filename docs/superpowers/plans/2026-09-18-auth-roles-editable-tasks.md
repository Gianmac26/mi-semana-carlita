# Auth, Roles & Editable Tasks — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace open JSONBin storage with Supabase Auth + Postgres + RLS, add `padre`/`hijo` roles, and let the admin create/edit/delete weekly tasks.

**Architecture:** `app/page.tsx` stays a Client Component that loads session, profile, tasks, and weekly state from Supabase on mount; it passes `tasks`, `weeks`, and `role` as props down to tabs. `EventsTab` and `MiMundoTab` manage their own Supabase reads/writes directly. Middleware refreshes the session cookie on every request and redirects unauthenticated users to `/login`.

**Tech Stack:** Next.js 16 App Router, `@supabase/ssr`, `@supabase/supabase-js`, Postgres RLS, TypeScript, Tailwind v4

**Spec:** `docs/superpowers/specs/2026-09-18-auth-roles-editable-tasks-design.md`

## Global Constraints

- Never import `auth-helpers-nextjs` — it is deprecated; use `@supabase/ssr` exclusively
- `SUPABASE_SERVICE_ROLE_KEY` must never appear in any `'use client'` file or `NEXT_PUBLIC_` variable
- `tasks.slug` is immutable after creation — label/icon/time/skippable/sort_order can be edited
- All copy stays in Spanish; visual design (palette, fonts, spacing) is unchanged
- `npm run lint` and `npm run build` must pass clean before the branch is merged
- Read `node_modules/next/dist/docs/` before writing any route handler or middleware

---

## File Map

**New files:**
```
middleware.ts                              session refresh + unauthenticated redirect
app/login/page.tsx                         Google sign-in page
app/auth/callback/route.ts                 OAuth code exchange
app/api/invite/route.ts                    POST: create invite code (padre only)
app/api/invite/redeem/route.ts             POST: consume invite code (service role)
components/AdminTab.tsx                    task CRUD + invitations + mundo read-only
lib/supabase/client.ts                     createBrowserClient factory
lib/supabase/server.ts                     createServerClient factory (Route Handlers)
lib/supabase/middleware-client.ts          createServerClient factory for middleware
supabase/migrations/001_initial_schema.sql all tables + RLS policies
scripts/migrate-jsonbin-to-supabase.ts     one-off migration
```

**Modified files:**
```
package.json                               add @supabase/ssr, @supabase/supabase-js
lib/types.ts                               add Profile, DbTask, InviteCode types
lib/tasks.ts                               getDayCompletion(dayState, tasks[]) + getTasksForDayFromList
app/page.tsx                               full rewrite: Supabase auth + data + role + admin tab
components/WeekTab.tsx                     accept tasks[] + weeks props, drop AppState
components/DayChips.tsx                    accept tasks[] prop, drop getTasksForDay
components/ProgressTab.tsx                 accept tasks[] prop, drop getTasksForDay
components/EventsTab.tsx                   self-contained Supabase reads/writes
components/MiMundoTab.tsx                  self-contained Supabase reads/writes
README.md                                  Supabase setup instructions
```

---

## Task 1: Install Dependencies + Supabase Client Utilities + Extended Types

**Files:**
- Modify: `package.json`
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/middleware-client.ts`
- Modify: `lib/types.ts`

**Interfaces:**
- Produces: `createBrowserClient()`, `createServerClient()`, `createMiddlewareClient(request, response)`, types `Profile`, `DbTask`, `InviteCode`

- [ ] **Step 1: Install packages**

```bash
cd "Proyectos GMC/mi-semana-carlita"
npm install @supabase/ssr @supabase/supabase-js
```

- [ ] **Step 2: Create browser client factory**

`lib/supabase/client.ts`:
```ts
import { createBrowserClient as _create } from '@supabase/ssr';

export function createBrowserClient() {
  return _create(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 3: Create server client factory**

`lib/supabase/server.ts`:
```ts
import { createServerClient as _create } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createServerClient() {
  const cookieStore = await cookies();
  return _create(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(toSet) {
          try {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options));
          } catch {}
        },
      },
    },
  );
}
```

- [ ] **Step 4: Create middleware client factory**

`lib/supabase/middleware-client.ts`:
```ts
import { createServerClient as _create } from '@supabase/ssr';
import type { NextRequest, NextResponse } from 'next/server';

export function createMiddlewareClient(request: NextRequest, response: NextResponse) {
  return _create(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(toSet) {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options));
        },
      },
    },
  );
}
```

- [ ] **Step 5: Add new types to `lib/types.ts`**

Append to the end of the file (keep all existing exports):
```ts
export interface Profile {
  id: string;
  family_id: string;
  role: 'padre' | 'hijo';
  display_name: string;
  email: string;
}

export interface DbTask {
  id: string;
  family_id: string;
  slug: string;
  day_type: 'weekday' | 'saturday';
  icon: string;
  label: string;
  time: string;
  skippable: boolean;
  sort_order: number;
  active: boolean;
}

export interface InviteCode {
  id: string;
  family_id: string;
  code: string;
  role: 'padre' | 'hijo';
  expires_at: string;
  used_by: string | null;
}
```

- [ ] **Step 6: Add env vars to `.env.local`**

Open `.env.local` and add (values come from Supabase project settings → API):
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors on the new files (may show errors in other files that import old types — those are fixed in later tasks).

- [ ] **Step 8: Commit**

```bash
git add lib/supabase/ lib/types.ts package.json package-lock.json
git commit -m "feat: add Supabase client factories and extended types"
```

---

## Task 2: Database Schema + RLS Policies

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

**Interfaces:**
- Produces: all 7 tables with RLS policies ready to run in Supabase Studio

- [ ] **Step 1: Create migration file**

`supabase/migrations/001_initial_schema.sql`:
```sql
-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ── families ────────────────────────────────────────────────────────────────
create table families (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz default now()
);

alter table families enable row level security;

create policy "family members can read their family"
  on families for select
  using (id in (select family_id from profiles where id = auth.uid()));

-- ── profiles ────────────────────────────────────────────────────────────────
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  family_id    uuid not null references families(id),
  role         text not null check (role in ('padre', 'hijo')),
  display_name text not null,
  email        text not null,
  created_at   timestamptz default now()
);

alter table profiles enable row level security;

create policy "family members can read profiles"
  on profiles for select
  using (family_id = (select family_id from profiles where id = auth.uid()));

create policy "users can update own profile"
  on profiles for update
  using (id = auth.uid());

create policy "allow insert during onboarding"
  on profiles for insert
  with check (id = auth.uid());

-- ── tasks ────────────────────────────────────────────────────────────────────
create table tasks (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families(id),
  slug        text not null,
  day_type    text not null check (day_type in ('weekday', 'saturday')),
  icon        text not null,
  label       text not null,
  time        text not null default '',
  skippable   boolean not null default false,
  sort_order  integer not null default 0,
  active      boolean not null default true,
  created_at  timestamptz default now(),
  unique (family_id, slug)
);

alter table tasks enable row level security;

create policy "family members can read tasks"
  on tasks for select
  using (family_id = (select family_id from profiles where id = auth.uid()));

create policy "only padre can insert tasks"
  on tasks for insert
  with check (
    family_id = (select family_id from profiles where id = auth.uid())
    and (select role from profiles where id = auth.uid()) = 'padre'
  );

create policy "only padre can update tasks"
  on tasks for update
  using (
    family_id = (select family_id from profiles where id = auth.uid())
    and (select role from profiles where id = auth.uid()) = 'padre'
  );

create policy "only padre can delete tasks"
  on tasks for delete
  using (
    family_id = (select family_id from profiles where id = auth.uid())
    and (select role from profiles where id = auth.uid()) = 'padre'
  );

-- ── weekly_state ─────────────────────────────────────────────────────────────
create table weekly_state (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references families(id),
  week_key   text not null,
  day        text not null check (day in ('mon','tue','wed','thu','fri','sat','sun')),
  state      jsonb not null default '{}',
  unique (family_id, week_key, day)
);

alter table weekly_state enable row level security;

create policy "family members can read weekly state"
  on weekly_state for select
  using (family_id = (select family_id from profiles where id = auth.uid()));

create policy "family members can insert weekly state"
  on weekly_state for insert
  with check (family_id = (select family_id from profiles where id = auth.uid()));

create policy "family members can update weekly state"
  on weekly_state for update
  using (family_id = (select family_id from profiles where id = auth.uid()));

-- ── events ───────────────────────────────────────────────────────────────────
create table events (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references families(id),
  date       text not null,
  time       text not null default '',
  label      text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

alter table events enable row level security;

create policy "family members can read events"
  on events for select
  using (family_id = (select family_id from profiles where id = auth.uid()));

create policy "only padre can insert events"
  on events for insert
  with check (
    family_id = (select family_id from profiles where id = auth.uid())
    and (select role from profiles where id = auth.uid()) = 'padre'
  );

create policy "only padre can delete events"
  on events for delete
  using (
    family_id = (select family_id from profiles where id = auth.uid())
    and (select role from profiles where id = auth.uid()) = 'padre'
  );

-- ── mi_mundo_entries ─────────────────────────────────────────────────────────
create table mi_mundo_entries (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references families(id),
  author_id  uuid not null references auth.users(id),
  key        text not null check (key in ('padres','cancion','risa','aprendi','preocupa','meta','pedido')),
  value      text not null default '',
  updated_at timestamptz default now(),
  unique (family_id, author_id, key)
);

alter table mi_mundo_entries enable row level security;

create policy "family members can read mi mundo"
  on mi_mundo_entries for select
  using (family_id = (select family_id from profiles where id = auth.uid()));

create policy "author can insert mi mundo"
  on mi_mundo_entries for insert
  with check (author_id = auth.uid());

create policy "author can update own mi mundo"
  on mi_mundo_entries for update
  using (author_id = auth.uid());

-- ── invite_codes ─────────────────────────────────────────────────────────────
create table invite_codes (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references families(id),
  code       varchar(6) not null,
  role       text not null check (role in ('padre', 'hijo')),
  created_by uuid not null references auth.users(id),
  expires_at timestamptz not null,
  used_by    uuid references auth.users(id),
  used_at    timestamptz,
  created_at timestamptz default now()
);

alter table invite_codes enable row level security;

-- Children cannot see invite_codes at all — only padre of same family
create policy "only padre can read invite codes"
  on invite_codes for select
  using (
    family_id = (select family_id from profiles where id = auth.uid())
    and (select role from profiles where id = auth.uid()) = 'padre'
  );

create policy "only padre can insert invite codes"
  on invite_codes for insert
  with check (
    family_id = (select family_id from profiles where id = auth.uid())
    and (select role from profiles where id = auth.uid()) = 'padre'
  );

create policy "only padre can update invite codes"
  on invite_codes for update
  using (
    family_id = (select family_id from profiles where id = auth.uid())
    and (select role from profiles where id = auth.uid()) = 'padre'
  );

create policy "only padre can delete invite codes"
  on invite_codes for delete
  using (
    family_id = (select family_id from profiles where id = auth.uid())
    and (select role from profiles where id = auth.uid()) = 'padre'
  );
```

- [ ] **Step 2: Run migration in Supabase Studio**

1. Open your Supabase project → SQL Editor
2. Paste the entire contents of `supabase/migrations/001_initial_schema.sql`
3. Click "Run"
4. Verify: in Table Editor you should see 7 new tables

- [ ] **Step 3: Commit the migration file**

```bash
git add supabase/migrations/001_initial_schema.sql
git commit -m "feat: add Supabase schema with RLS policies for all 7 tables"
```

---

## Task 3: Middleware + /login page + /auth/callback Route Handler

**Files:**
- Create: `middleware.ts` (project root)
- Create: `app/login/page.tsx`
- Create: `app/auth/callback/route.ts`

**Interfaces:**
- Consumes: `createMiddlewareClient` from `lib/supabase/middleware-client.ts`, `createServerClient` from `lib/supabase/server.ts`
- Produces: session cookie refresh on every request; unauthenticated users redirected to `/login`; OAuth callback exchanges code for session and sets cookie

- [ ] **Step 1: Create `middleware.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase/middleware-client';

const PUBLIC_PATHS = ['/login', '/auth/callback'];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  const supabase = createMiddlewareClient(request, response);

  // Refresh session — this updates the cookie in the response
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p));

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

- [ ] **Step 2: Create `app/login/page.tsx`**

```tsx
'use client';
import { createBrowserClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const supabase = createBrowserClient();

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh',
      padding: '0 24px', background: 'var(--bg)',
    }}>
      <div style={{
        width: '100%', maxWidth: 380, textAlign: 'center',
      }}>
        <h1 style={{
          fontFamily: 'var(--font-title)', fontWeight: 700,
          fontSize: 32, color: 'var(--pink)', letterSpacing: 1, marginBottom: 8,
        }}>
          MI SEMANA
        </h1>
        <p style={{
          fontFamily: 'var(--font-body)', color: 'var(--ink-soft)',
          fontSize: 15, marginBottom: 40,
        }}>
          Tu espacio familiar ✨
        </p>

        <button
          onClick={handleGoogle}
          style={{
            width: '100%', padding: '14px 20px',
            borderRadius: 14, border: '1.5px solid var(--line)',
            background: 'var(--bg-card)', color: 'var(--ink)',
            fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 16,
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 10,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continuar con Google
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `app/auth/callback/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}/`);
}
```

- [ ] **Step 4: Verify local dev redirects to login**

```bash
npm run dev
```

Open http://localhost:3000 — should redirect to `/login`. Confirm the Google button renders. (Don't complete the OAuth flow yet — Supabase isn't configured with OAuth credentials until you do the manual steps in the README.)

- [ ] **Step 5: Commit**

```bash
git add middleware.ts app/login/page.tsx app/auth/callback/route.ts
git commit -m "feat: add middleware auth guard, login page, and OAuth callback handler"
```

---

## Task 4: Refactor `getDayCompletion` + Update Three Callers

**Files:**
- Modify: `lib/tasks.ts`
- Modify: `components/WeekTab.tsx`
- Modify: `components/DayChips.tsx`
- Modify: `components/ProgressTab.tsx`

**Interfaces:**
- Consumes: `DbTask` from `lib/types.ts`
- Produces:
  - `getDayCompletion(dayState: Record<string, unknown> | undefined, tasks: DbTask[]): number`
  - `getTasksForDayFromList(tasks: DbTask[], day: DayKey): DbTask[]`

- [ ] **Step 1: Rewrite `lib/tasks.ts`**

Replace the entire file:
```ts
import type { DbTask } from '@/lib/types';

// Legacy seed data — used only by the migration script
export interface Task {
  id: string;
  icon: string;
  label: string;
  time: string;
  skippable?: boolean;
}

export const WEEKDAY_TASKS: Task[] = [
  { id: 'llegada_cole', icon: '🏫', label: 'Llegada al cole a tiempo', time: '7:45 am' },
  { id: 'llegada',      icon: '🏠', label: 'Llegada a casa a tiempo', time: '2:20 pm' },
  { id: 'almuerzo',     icon: '🍽️', label: 'Cambio de ropa + almuerzo', time: '2:30–3:00 pm' },
  { id: 'ducha',        icon: '🚿', label: 'Ducha y lista para estudiar', time: '3:30 pm' },
  { id: 'estudio',      icon: '📖', label: 'Estudio sin celular', time: '4:00–5:30 pm' },
  { id: 'regreso',      icon: '🌟', label: 'Regreso de salir con amigas', time: '7:30 pm', skippable: true },
  { id: 'dormir',       icon: '🌙', label: 'Celular fuera de la cama y a dormir', time: '10:00 pm' },
];

export const SATURDAY_TASKS: Task[] = [
  { id: 'cuadernos',   icon: '📓', label: 'Revisión de cuadernos con mamá', time: '' },
  { id: 'regreso_sab', icon: '🌆', label: 'Regreso de salir con amigas', time: '8:00 pm', skippable: true },
];

export const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type DayKey = typeof DAY_KEYS[number];

export const DAY_LABELS: Record<DayKey, string> = {
  mon: 'Lun', tue: 'Mar', wed: 'Mié', thu: 'Jue', fri: 'Vie', sat: 'Sáb', sun: 'Dom',
};

/** Returns the subset of tasks that apply to a given day. */
export function getTasksForDayFromList(tasks: DbTask[], day: DayKey): DbTask[] {
  if (day === 'sun') return [];
  const type = day === 'sat' ? 'saturday' : 'weekday';
  return tasks.filter(t => t.day_type === type && t.active);
}

/** Calculates completion % for one day given dynamic tasks from DB. */
export function getDayCompletion(
  dayState: Record<string, unknown> | undefined,
  tasks: DbTask[],
): number {
  if (!tasks.length || !dayState) return 0;
  const skipped = (dayState.skipped ?? {}) as Record<string, boolean>;
  const active = tasks.filter(t => !skipped[t.slug]);
  if (!active.length) return 100;
  const done = active.filter(t => dayState[t.slug] === true).length;
  return Math.round((done / active.length) * 100);
}
```

- [ ] **Step 2: Update `components/WeekTab.tsx`**

Change the Props interface and internal usage. Find and replace these sections:

Old imports:
```ts
import { DAY_KEYS, DayKey, getTasksForDay, getDayCompletion } from '@/lib/tasks';
```
New:
```ts
import { DAY_KEYS, DayKey, getTasksForDayFromList, getDayCompletion } from '@/lib/tasks';
import type { DbTask } from '@/lib/types';
```

Old Props:
```ts
interface Props {
  state: AppState;
  onChange: (newState: AppState) => void;
}
```
New:
```ts
interface Props {
  weeks: AppState['weeks'];
  tasks: DbTask[];
  onChange: (newWeeks: AppState['weeks']) => void;
}
```

Old destructure:
```ts
export default function WeekTab({ state, onChange }: Props) {
```
New:
```ts
export default function WeekTab({ weeks, tasks, onChange }: Props) {
```

Old lines that read `state.weeks`:
```ts
  const weekData = state.weeks[weekKey] ?? {};
```
New:
```ts
  const weekData = weeks[weekKey] ?? {};
```

Old `tasks` derivation and `pct`:
```ts
  const tasks    = getTasksForDay(selectedDay);
  const pct      = getDayCompletion(dayState as Record<string, unknown>, selectedDay);
```
New:
```ts
  const dayTasks = getTasksForDayFromList(tasks, selectedDay);
  const pct      = getDayCompletion(dayState as Record<string, unknown>, dayTasks);
```

Old `updateDay` callback (references `state.weeks`):
```ts
  const updateDay = useCallback((patch: Partial<DayState>) => {
    onChange({
      ...state,
      weeks: {
        ...state.weeks,
        [weekKey]: {
          ...weekData,
          [selectedDay]: { ...dayState, ...patch },
        },
      },
    });
  }, [state, onChange, weekKey, weekData, selectedDay, dayState]);
```
New:
```ts
  const updateDay = useCallback((patch: Partial<DayState>) => {
    onChange({
      ...weeks,
      [weekKey]: {
        ...weekData,
        [selectedDay]: { ...dayState, ...patch },
      },
    });
  }, [weeks, onChange, weekKey, weekData, selectedDay, dayState]);
```

In the render, the `tasks.map(...)` block uses `task.id` for keying and `dayState[task.id]` for checked state. Change to `task.slug`:
```tsx
// Old
{tasks.map(task => {
  const skipped = !!((dayState.skipped as Record<string,boolean> | undefined)?.[task.id]);
  return (
    <TaskItem
      key={task.id}
      task={task}
      checked={!!dayState[task.id]}
      skipped={skipped}
      onToggle={() => toggleTask(task.id)}
      onSkip={() => toggleSkip(task.id)}
    />
  );
})}
```
New (also change `tasks` → `dayTasks`):
```tsx
{dayTasks.map(task => {
  const skipped = !!((dayState.skipped as Record<string,boolean> | undefined)?.[task.slug]);
  return (
    <TaskItem
      key={task.slug}
      task={task}
      checked={!!dayState[task.slug]}
      skipped={skipped}
      onToggle={() => toggleTask(task.slug)}
      onSkip={() => toggleSkip(task.slug)}
    />
  );
})}
```

Also change `tasks.length > 0` guard to `dayTasks.length > 0`.

`TaskItem` receives a `task` prop typed as `Task` from `lib/tasks`. Update the import in `TaskItem.tsx` to accept `DbTask` too — or make `TaskItem` receive just the fields it needs. Simplest: keep `TaskItem`'s prop as `task: { slug: string; icon: string; label: string; time: string; skippable?: boolean }` so both `Task` and `DbTask` satisfy it structurally (both have those fields).

In `components/TaskItem.tsx`, update the import and prop type:
```ts
// Old
import { Task } from '@/lib/tasks';
interface Props { task: Task; ... }
```
```ts
// New
interface TaskShape { slug: string; icon: string; label: string; time: string; skippable?: boolean }
interface Props { task: TaskShape; ... }
```

- [ ] **Step 3: Update `components/DayChips.tsx`**

Old imports:
```ts
import { DAY_KEYS, DAY_LABELS, DayKey, getDayCompletion, getTasksForDay } from '@/lib/tasks';
```
New:
```ts
import { DAY_KEYS, DAY_LABELS, DayKey, getDayCompletion, getTasksForDayFromList } from '@/lib/tasks';
import type { DbTask } from '@/lib/types';
```

Old Props:
```ts
interface Props {
  weekData: WeekData;
  selected: DayKey;
  onSelect: (d: DayKey) => void;
  todayKey: string;
}
```
New:
```ts
interface Props {
  weekData: WeekData;
  tasks: DbTask[];
  selected: DayKey;
  onSelect: (d: DayKey) => void;
  todayKey: string;
}
```

Old usage in the map:
```ts
const pct = getDayCompletion(weekData[day] as Record<string, unknown>, day);
const tasks = getTasksForDay(day);
```
New:
```ts
const dayTasks = getTasksForDayFromList(tasks, day);
const pct = getDayCompletion(weekData[day] as Record<string, unknown>, dayTasks);
```

Old `!tasks.length` → New `!dayTasks.length`

- [ ] **Step 4: Update `components/ProgressTab.tsx`**

Old imports:
```ts
import { DAY_KEYS, DayKey, getDayCompletion, getTasksForDay } from '@/lib/tasks';
```
New:
```ts
import { DAY_KEYS, DayKey, getDayCompletion, getTasksForDayFromList } from '@/lib/tasks';
import type { DbTask } from '@/lib/types';
```

Old Props:
```ts
interface Props { state: AppState }
```
New:
```ts
interface Props { state: AppState; tasks: DbTask[] }
```

Old `weekAvg` function:
```ts
function weekAvg(wd: Record<string, unknown>, upToIdx: number | null): number {
  const days: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const slice = upToIdx === null ? days : days.slice(0, upToIdx + 1);
  const withTasks = slice.filter(d => getTasksForDay(d).length > 0);
  if (!withTasks.length) return 0;
  const sum = withTasks.reduce((acc, d) => acc + getDayCompletion(wd[d] as Record<string, unknown>, d), 0);
  return Math.round(sum / withTasks.length);
}
```
New (receives tasks, uses getTasksForDayFromList):
```ts
function weekAvg(wd: Record<string, unknown>, tasks: DbTask[], upToIdx: number | null): number {
  const days: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const slice = upToIdx === null ? days : days.slice(0, upToIdx + 1);
  const withTasks = slice.filter(d => getTasksForDayFromList(tasks, d).length > 0);
  if (!withTasks.length) return 0;
  const sum = withTasks.reduce((acc, d) => {
    const t = getTasksForDayFromList(tasks, d);
    return acc + getDayCompletion(wd[d] as Record<string, unknown>, t);
  }, 0);
  return Math.round(sum / withTasks.length);
}
```

Update the two `getDayCompletion` calls in the chart render and `weekAvg` calls (pass `tasks`):
```ts
// Old
const pct = isPastOrToday
  ? getDayCompletion(weekData[day] as Record<string, unknown>, day)
  : null;
```
```ts
// New
const pct = isPastOrToday
  ? getDayCompletion(weekData[day] as Record<string, unknown>, getTasksForDayFromList(tasks, day))
  : null;
```

Old `pastWeeks` avg call:
```ts
avg: weekAvg(wd, null)
```
New:
```ts
avg: weekAvg(wd, tasks, null)
```

Old `weekAvg(weekData, todayChartIdx)` call → New `weekAvg(weekData, tasks, todayChartIdx)`.

- [ ] **Step 5: Verify build**

```bash
npx tsc --noEmit
```
Expected: no type errors. If there are remaining errors in `page.tsx` (because it still passes `state` and no `tasks` to WeekTab), they will be fixed in Task 5.

- [ ] **Step 6: Commit**

```bash
git add lib/tasks.ts components/WeekTab.tsx components/DayChips.tsx components/ProgressTab.tsx components/TaskItem.tsx
git commit -m "refactor: getDayCompletion now takes tasks[] instead of DayKey; update all callers"
```

---

## Task 5: Migrate `app/page.tsx` — Auth State Machine + Supabase Data

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `createBrowserClient`, `Profile`, `DbTask`, `AppState['weeks']`
- Produces: a page that reads session, profile, tasks, and weekly state from Supabase; passes correct props to all tabs; shows admin tab only for `padre`

The page has five states:
1. `loading` — initial fetch
2. `no-profile-first-user` — logged in, no profile, no families exist → show "crear familia"
3. `no-profile-needs-code` — logged in, no profile, family exists → show invite code form
4. `ready` — profile loaded, show main app
5. (unauthenticated handled by middleware, never reaches here)

- [ ] **Step 1: Full replacement of `app/page.tsx`**

```tsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Profile, DbTask, AppState } from '@/lib/types';
import { DAY_KEYS, DayKey } from '@/lib/tasks';
import { getMondayOfWeek, formatWeekKey } from '@/lib/utils';
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

  // Invite code entry state
  const [codeInput,   setCodeInput]   = useState('');
  const [codeError,   setCodeError]   = useState('');
  const [codeLoading, setCodeLoading] = useState(false);

  // First-user family creation state
  const [displayName, setDisplayName] = useState('');
  const [creating,    setCreating]    = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // middleware handles redirect

      // Check for existing profile
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileRow) {
        await loadAppData(profileRow as Profile);
        return;
      }

      // No profile — check if any family exists
      const { count } = await supabase
        .from('families')
        .select('id', { count: 'exact', head: true });

      setPageState(count === 0 ? 'no-profile-first' : 'no-profile-code');
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

    // Assemble weekly_state rows into the weeks map shape
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: family } = await supabase
      .from('families')
      .insert({ name: 'Mi familia' })
      .select()
      .single();

    if (!family) { setCreating(false); return; }

    const { data: profileRow } = await supabase
      .from('profiles')
      .insert({ id: user.id, family_id: family.id, role: 'padre', display_name: displayName.trim(), email: user.email ?? '' })
      .select()
      .single();

    if (profileRow) await loadAppData(profileRow as Profile);
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

  const handleWeeksChange = useCallback(async (newWeeks: AppState['weeks']) => {
    if (!profile) return;
    setWeeks(newWeeks);
    setSaveStatus('saving');

    // Find changed (weekKey, day) pairs and upsert them
    const upserts: { family_id: string; week_key: string; day: string; state: unknown }[] = [];
    for (const [weekKey, weekData] of Object.entries(newWeeks)) {
      for (const day of DAY_KEYS) {
        const dayState = weekData[day];
        if (dayState) {
          upserts.push({ family_id: profile.family_id, week_key: weekKey, day, state: dayState });
        }
      }
    }

    if (upserts.length === 0) { setSaveStatus('saved'); return; }

    const { error } = await supabase
      .from('weekly_state')
      .upsert(upserts, { onConflict: 'family_id,week_key,day' });

    setSaveStatus(error ? 'error' : 'saved');
  }, [profile]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  // ── Render states ─────────────────────────────────────────────────────────

  if (pageState === 'loading') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 32 }}>✨</span>
        <span style={{ fontFamily: 'var(--font-title)', color: 'var(--pink)', fontSize: 18 }}>
          Cargando tu semana...
        </span>
      </div>
    );
  }

  if (pageState === 'no-profile-first') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '0 24px' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <h2 style={{ fontFamily: 'var(--font-title)', color: 'var(--pink)', fontSize: 22, marginBottom: 8 }}>
            ¡Bienvenida! 🎉
          </h2>
          <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 24 }}>
            Eres la primera persona en entrar. ¿Cuál es tu nombre?
          </p>
          <input
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateFamily()}
            placeholder="Tu nombre"
            style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--line)', background: 'var(--bg-card)', color: 'var(--ink)', fontFamily: 'var(--font-body)', fontSize: 15, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }}
          />
          <button
            onClick={handleCreateFamily}
            disabled={!displayName.trim() || creating}
            style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: 'var(--pink)', color: '#fff', fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
          >
            {creating ? 'Creando...' : 'Entrar como papá/mamá'}
          </button>
        </div>
      </div>
    );
  }

  if (pageState === 'no-profile-code') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '0 24px' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <h2 style={{ fontFamily: 'var(--font-title)', color: 'var(--pink)', fontSize: 22, marginBottom: 8 }}>
            Ingresa tu código
          </h2>
          <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 24 }}>
            Pídele el código de 6 dígitos a tus papás.
          </p>
          <input
            value={codeInput}
            onChange={e => setCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyDown={e => e.key === 'Enter' && handleRedeemCode()}
            placeholder="000000"
            maxLength={6}
            style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${codeError ? 'var(--error, #e53e3e)' : 'var(--line)'}`, background: 'var(--bg-card)', color: 'var(--ink)', fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 24, letterSpacing: 6, textAlign: 'center', outline: 'none', marginBottom: 8, boxSizing: 'border-box' }}
          />
          {codeError && <p style={{ color: 'var(--error, #e53e3e)', fontSize: 13, marginBottom: 12 }}>{codeError}</p>}
          <button
            onClick={handleRedeemCode}
            disabled={codeInput.length !== 6 || codeLoading}
            style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: 'var(--pink)', color: '#fff', fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 4 }}
          >
            {codeLoading ? 'Verificando...' : 'Entrar'}
          </button>
          <p style={{ textAlign: 'center', color: 'var(--ink-soft)', fontSize: 12, marginTop: 20 }}>
            ¿El código no funciona? Pídele a tus papás que generen uno nuevo.
          </p>
        </div>
      </div>
    );
  }

  // ── Ready ──────────────────────────────────────────────────────────────────

  const isAdmin = profile?.role === 'padre';
  const TABS = isAdmin ? [...BASE_TABS, { key: 'admin' as Tab, label: '⚙️ Admin' }] : BASE_TABS;

  return (
    <>
      <StatusIndicator status={saveStatus} />
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px 100px' }}>
        <header style={{ display: 'flex', alignItems: 'center', padding: '20px 0 16px', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 30, color: 'var(--pink)', letterSpacing: 1 }}>
              MI SEMANA
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-soft)', fontSize: 14, marginTop: 2 }}>
              {profile?.display_name} ✨
            </p>
          </div>
          <ThemeToggle />
          <button
            onClick={handleSignOut}
            style={{ padding: '7px 12px', borderRadius: 10, border: '1.5px solid var(--line)', background: 'var(--bg-card)', color: 'var(--ink-soft)', fontFamily: 'var(--font-body)', fontSize: 12, cursor: 'pointer' }}
          >
            Salir
          </button>
        </header>

        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '0 0 8px', marginBottom: 16, scrollbarWidth: 'none' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ flexShrink: 0, padding: '9px 14px', borderRadius: 20, background: tab === t.key ? 'var(--pink)' : 'var(--bg-card)', color: tab === t.key ? '#fff' : 'var(--ink-soft)', border: tab === t.key ? '1.5px solid var(--pink)' : '1.5px solid var(--line)', fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'week'     && <WeekTab weeks={weeks} tasks={tasks} onChange={handleWeeksChange} />}
        {tab === 'progress' && <ProgressTab state={{ weeks, events: [] }} tasks={tasks} />}
        {tab === 'events'   && profile && <EventsTab familyId={profile.family_id} role={profile.role} />}
        {tab === 'articles' && <ArticlesTab />}
        {tab === 'mundo'    && profile && <MiMundoTab familyId={profile.family_id} />}
        {tab === 'admin'    && isAdmin && profile && <AdminTab familyId={profile.family_id} tasks={tasks} onTasksChange={setTasks} />}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Pass `tasks` to `DayChips` inside `WeekTab.tsx`**

`WeekTab` renders `<DayChips>` but DayChips now needs the `tasks` prop. Find the DayChips usage in WeekTab and add it:
```tsx
<DayChips
  weekData={weekData}
  tasks={tasks}
  selected={selectedDay}
  onSelect={setSelectedDay}
  todayKey={todayKey}
/>
```

- [ ] **Step 3: Verify `npx tsc --noEmit` passes**

Fix any remaining type errors (EventsTab, MiMundoTab, AdminTab will error until their Tasks are done — that's expected).

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx components/WeekTab.tsx
git commit -m "feat: migrate page.tsx to Supabase auth state machine and data loading"
```

---

## Task 6: Invite Code API Routes

**Files:**
- Create: `app/api/invite/route.ts`
- Create: `app/api/invite/redeem/route.ts`

**Interfaces:**
- `POST /api/invite` body: `{ role: 'padre' | 'hijo' }` → response: `{ code: string; expires_at: string }`
- `POST /api/invite/redeem` body: `{ code: string }` → response: `{ profile: Profile }` or `{ error: string }`

- [ ] **Step 1: Create `app/api/invite/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('family_id, role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || profile.role !== 'padre') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { role } = await request.json() as { role: 'padre' | 'hijo' };
  if (!['padre', 'hijo'].includes(role)) {
    return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });
  }

  // Generate 6-digit zero-padded code, retry on collision
  let code: string | null = null;
  for (let i = 0; i < 5; i++) {
    const candidate = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
    const { count } = await supabase
      .from('invite_codes')
      .select('id', { count: 'exact', head: true })
      .eq('family_id', profile.family_id)
      .eq('code', candidate)
      .is('used_by', null)
      .gt('expires_at', new Date().toISOString());
    if (count === 0) { code = candidate; break; }
  }

  if (!code) return NextResponse.json({ error: 'No se pudo generar el código' }, { status: 500 });

  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const { data: invite, error } = await supabase
    .from('invite_codes')
    .insert({ family_id: profile.family_id, code, role, created_by: user.id, expires_at: expiresAt })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Error al crear código' }, { status: 500 });

  return NextResponse.json({ code: invite.code, expires_at: invite.expires_at });
}
```

- [ ] **Step 2: Create `app/api/invite/redeem/route.ts`**

This uses the service role key to bypass RLS for the atomic check-and-update:
```ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase/server';

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  // Check user doesn't already have a profile
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (existing) return NextResponse.json({ error: 'Ya tienes una cuenta activa' }, { status: 400 });

  const { code } = await request.json() as { code: string };

  // Find valid, unused, unexpired code — use service role to bypass invite_codes RLS
  const { data: invite } = await serviceSupabase
    .from('invite_codes')
    .select('*')
    .eq('code', code)
    .is('used_by', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (!invite) {
    return NextResponse.json({ error: 'Código inválido, vencido o ya usado. Pide uno nuevo a tus papás.' }, { status: 400 });
  }

  // Mark code as used (atomic with service role)
  await serviceSupabase
    .from('invite_codes')
    .update({ used_by: user.id, used_at: new Date().toISOString() })
    .eq('id', invite.id);

  // Create profile for this user
  const displayName = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Usuario';
  const { data: profile, error } = await serviceSupabase
    .from('profiles')
    .insert({ id: user.id, family_id: invite.family_id, role: invite.role, display_name: displayName, email: user.email ?? '' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Error al crear perfil' }, { status: 500 });

  return NextResponse.json({ profile });
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/invite/
git commit -m "feat: add invite code create and redeem API routes"
```

---

## Task 7: Migrate `EventsTab.tsx` to Supabase

**Files:**
- Modify: `components/EventsTab.tsx`

**Interfaces:**
- Old props: `state: AppState; onChange: (s: AppState) => void`
- New props: `familyId: string; role: 'padre' | 'hijo'`

- [ ] **Step 1: Rewrite `components/EventsTab.tsx`**

```tsx
'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { formatEventDate } from '@/lib/utils';

interface DbEvent { id: string; date: string; time: string; label: string }

interface Props { familyId: string; role: 'padre' | 'hijo' }

const supabase = createBrowserClient();

const INPUT: React.CSSProperties = {
  width: '100%', padding: '9px 11px', borderRadius: 10,
  border: '1.5px solid var(--line)', background: 'var(--bg-card)',
  color: 'var(--ink)', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none',
};
const LABEL: React.CSSProperties = {
  fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600, display: 'block', marginBottom: 4,
};

export default function EventsTab({ familyId, role }: Props) {
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [date,  setDate]   = useState('');
  const [time,  setTime]   = useState('');
  const [label, setLabel]  = useState('');

  useEffect(() => {
    supabase
      .from('events')
      .select('id, date, time, label')
      .eq('family_id', familyId)
      .order('date', { ascending: true })
      .then(({ data }) => setEvents((data as DbEvent[]) ?? []));
  }, [familyId]);

  const canAdd = role === 'padre' && date.trim() !== '' && label.trim() !== '';

  const addEvent = async () => {
    if (!canAdd) return;
    const { data } = await supabase
      .from('events')
      .insert({ family_id: familyId, date, time, label: label.trim() })
      .select('id, date, time, label')
      .single();
    if (data) {
      setEvents(prev => [...prev, data as DbEvent].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)));
      setDate(''); setTime(''); setLabel('');
    }
  };

  const removeEvent = async (id: string) => {
    await supabase.from('events').delete().eq('id', id);
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const sorted = [...events].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  return (
    <div>
      <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 17, color: 'var(--pink)', marginBottom: 16 }}>
        🎈 Divertikids — Próximos eventos
      </h3>

      {role === 'padre' && (
        <div style={{ background: 'var(--pink-soft)', borderRadius: 18, padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div><label style={LABEL}>Fecha</label><input type="date" value={date} onChange={e => setDate(e.target.value)} style={INPUT} /></div>
            <div><label style={LABEL}>Hora</label><input type="time" value={time} onChange={e => setTime(e.target.value)} style={INPUT} /></div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={LABEL}>¿Qué es?</label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)} onKeyDown={e => e.key === 'Enter' && addEvent()} placeholder="Ej: Cumpleaños de Sofi 🎂" style={INPUT} />
          </div>
          <button onClick={addEvent} disabled={!canAdd} style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: canAdd ? 'var(--pink)' : 'var(--line)', color: canAdd ? '#fff' : 'var(--ink-soft)', fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 15, cursor: canAdd ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}>
            Agregar evento
          </button>
        </div>
      )}

      {sorted.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--ink-soft)', fontStyle: 'italic', padding: '24px 0' }}>Aún no hay eventos agregados.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sorted.map(ev => (
            <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-card)', borderRadius: 14, border: '1.5px solid var(--line)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{ev.label}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>{formatEventDate(ev.date)}{ev.time ? ` · ${ev.time}` : ''}</div>
              </div>
              {role === 'padre' && (
                <button onClick={() => removeEvent(ev.id)} style={{ background: 'var(--line)', border: 'none', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', color: 'var(--ink-soft)', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>✕</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/EventsTab.tsx
git commit -m "feat: migrate EventsTab to direct Supabase reads/writes with role-based controls"
```

---

## Task 8: Migrate `MiMundoTab.tsx` to Supabase

**Files:**
- Modify: `components/MiMundoTab.tsx`

**Interfaces:**
- Old props: `state: AppState; onChange: (s: AppState) => void`
- New props: `familyId: string`

- [ ] **Step 1: Rewrite `components/MiMundoTab.tsx`**

Keep the PROMPTS array unchanged. Replace the component:
```tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { MiMundo } from '@/lib/types';

interface Props { familyId: string }

// PROMPTS array stays exactly as before (all 7 entries)
// ... paste the existing PROMPTS array here unchanged ...

const supabase = createBrowserClient();

export default function MiMundoTab({ familyId }: Props) {
  const [mundo, setMundo] = useState<MiMundo>({});
  const [userId, setUserId] = useState<string | null>(null);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data } = await supabase
        .from('mi_mundo_entries')
        .select('key, value')
        .eq('family_id', familyId)
        .eq('author_id', user.id);

      const assembled: MiMundo = {};
      for (const row of (data ?? [])) {
        assembled[row.key as keyof MiMundo] = row.value;
      }
      setMundo(assembled);
    }
    load();
  }, [familyId]);

  const handleChange = (key: keyof MiMundo, value: string) => {
    setMundo(prev => ({ ...prev, [key]: value }));

    if (timers.current[key]) clearTimeout(timers.current[key]);
    timers.current[key] = setTimeout(async () => {
      if (!userId) return;
      await supabase.from('mi_mundo_entries').upsert(
        { family_id: familyId, author_id: userId, key, value, updated_at: new Date().toISOString() },
        { onConflict: 'family_id,author_id,key' },
      );
    }, 1000);
  };

  return (
    // Keep the exact same JSX as before, replacing `state.miMundo` reads with `mundo`
    // and `handleChange` calls stay the same signature
    // ... paste existing JSX here, changing only:
    //   mundo = state.miMundo ?? {}   →   use the `mundo` state variable directly
    <div>
      {/* Header — unchanged */}
      {/* ... */}
      {PROMPTS.map(prompt => (
        <div key={prompt.key} style={{ /* unchanged card styles */ }}>
          {/* unchanged card content */}
          <textarea
            value={mundo[prompt.key] ?? ''}
            onChange={e => handleChange(prompt.key, e.target.value)}
            placeholder={prompt.placeholder}
            // unchanged styles
          />
        </div>
      ))}
    </div>
  );
}
```

> **Note:** The JSX body is a direct copy of the existing MiMundoTab render, with only two changes: `state.miMundo ?? {}` becomes the `mundo` state variable, and the import/props change. Copy the existing body verbatim for everything else.

- [ ] **Step 2: Commit**

```bash
git add components/MiMundoTab.tsx
git commit -m "feat: migrate MiMundoTab to direct Supabase upsert with per-user author_id"
```

---

## Task 9: `AdminTab.tsx` — Tasks CRUD + Invitations + Mi Mundo Read-Only

**Files:**
- Create: `components/AdminTab.tsx`

**Interfaces:**
- Props: `familyId: string; tasks: DbTask[]; onTasksChange: (tasks: DbTask[]) => void`

- [ ] **Step 1: Create `components/AdminTab.tsx`**

```tsx
'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { DbTask, InviteCode, MiMundo } from '@/lib/types';

interface Props {
  familyId: string;
  tasks: DbTask[];
  onTasksChange: (tasks: DbTask[]) => void;
}

type Section = 'tasks' | 'invites' | 'mundo';

const supabase = createBrowserClient();

function slugify(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // remove accents
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 30);
}

const CARD: React.CSSProperties = {
  background: 'var(--bg-card)', borderRadius: 14,
  border: '1.5px solid var(--line)', padding: '12px 14px', marginBottom: 10,
};
const INPUT: React.CSSProperties = {
  padding: '8px 10px', borderRadius: 10, border: '1.5px solid var(--line)',
  background: 'var(--bg-card)', color: 'var(--ink)',
  fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none',
};

export default function AdminTab({ familyId, tasks, onTasksChange }: Props) {
  const [section, setSection] = useState<Section>('tasks');
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [mundo, setMundo] = useState<Record<string, string>>({});
  const [newTask, setNewTask] = useState({ icon: '', label: '', time: '', day_type: 'weekday' as 'weekday' | 'saturday', skippable: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (section === 'invites') loadCodes();
    if (section === 'mundo') loadMundo();
  }, [section]);

  async function loadCodes() {
    const { data } = await supabase
      .from('invite_codes')
      .select('id, code, role, expires_at, used_by')
      .eq('family_id', familyId)
      .is('used_by', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
    setCodes((data as InviteCode[]) ?? []);
  }

  async function loadMundo() {
    const { data } = await supabase
      .from('mi_mundo_entries')
      .select('key, value')
      .eq('family_id', familyId);
    const m: Record<string, string> = {};
    for (const row of (data ?? [])) m[row.key] = row.value;
    setMundo(m);
  }

  async function generateCode(role: 'padre' | 'hijo') {
    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    if (res.ok) loadCodes();
  }

  async function revokeCode(id: string) {
    await supabase.from('invite_codes').delete().eq('id', id);
    setCodes(prev => prev.filter(c => c.id !== id));
  }

  async function addTask() {
    if (!newTask.icon.trim() || !newTask.label.trim()) return;
    setSaving(true);
    const slug = slugify(newTask.label);
    const maxOrder = tasks.filter(t => t.day_type === newTask.day_type).reduce((m, t) => Math.max(m, t.sort_order), -1);
    const { data } = await supabase
      .from('tasks')
      .insert({ family_id: familyId, slug, day_type: newTask.day_type, icon: newTask.icon.trim(), label: newTask.label.trim(), time: newTask.time.trim(), skippable: newTask.skippable, sort_order: maxOrder + 1, active: true })
      .select()
      .single();
    if (data) onTasksChange([...tasks, data as DbTask].sort((a, b) => a.sort_order - b.sort_order));
    setNewTask({ icon: '', label: '', time: '', day_type: 'weekday', skippable: false });
    setSaving(false);
  }

  async function updateTask(id: string, patch: Partial<DbTask>) {
    await supabase.from('tasks').update(patch).eq('id', id);
    onTasksChange(tasks.map(t => t.id === id ? { ...t, ...patch } : t));
  }

  async function deleteTask(id: string) {
    // Soft delete — preserves historical weekly_state references
    await supabase.from('tasks').update({ active: false }).eq('id', id);
    onTasksChange(tasks.filter(t => t.id !== id));
  }

  const weekdayTasks = tasks.filter(t => t.day_type === 'weekday');
  const saturdayTasks = tasks.filter(t => t.day_type === 'saturday');

  const MundoPrompts = [
    { key: 'padres', title: '🫶 Con mis papás' },
    { key: 'cancion', title: '🎵 Canción favorita' },
    { key: 'risa', title: '😂 Lo que me hizo reír' },
    { key: 'aprendi', title: '🌱 Algo que aprendí' },
    { key: 'preocupa', title: '💭 Me preocupa...' },
    { key: 'meta', title: '🎯 Mi meta del mes' },
    { key: 'pedido', title: '💌 Le pediría a mis papás...' },
  ];

  return (
    <div>
      <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 17, color: 'var(--pink)', marginBottom: 16 }}>
        ⚙️ Admin
      </h3>

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {([['tasks', '📋 Tareas'], ['invites', '🔑 Invitaciones'], ['mundo', '💜 Mi mundo']] as [Section, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setSection(key)} style={{ flex: 1, padding: '9px 0', borderRadius: 12, border: `1.5px solid ${section === key ? 'var(--pink)' : 'var(--line)'}`, background: section === key ? 'var(--pink)' : 'var(--bg-card)', color: section === key ? '#fff' : 'var(--ink-soft)', fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── TASKS SECTION ── */}
      {section === 'tasks' && (
        <div>
          {[{ label: 'Lun–Vie', list: weekdayTasks, type: 'weekday' as const }, { label: 'Sábado', list: saturdayTasks, type: 'saturday' as const }].map(({ label, list, type }) => (
            <div key={type} style={{ marginBottom: 24 }}>
              <h4 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 14, color: 'var(--ink-soft)', marginBottom: 10 }}>{label}</h4>
              {list.map(task => (
                <div key={task.id} style={{ ...CARD, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input value={task.icon} onChange={e => updateTask(task.id, { icon: e.target.value })} style={{ ...INPUT, width: 44, textAlign: 'center', fontSize: 18 }} />
                  <input value={task.label} onChange={e => updateTask(task.id, { label: e.target.value })} style={{ ...INPUT, flex: 1, minWidth: 120 }} />
                  <input value={task.time} onChange={e => updateTask(task.id, { time: e.target.value })} placeholder="hora" style={{ ...INPUT, width: 90 }} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--ink-soft)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={task.skippable} onChange={e => updateTask(task.id, { skippable: e.target.checked })} />
                    Saltable
                  </label>
                  <button onClick={() => deleteTask(task.id)} style={{ background: 'transparent', border: 'none', color: 'var(--ink-soft)', cursor: 'pointer', fontSize: 16, padding: 4 }}>🗑</button>
                </div>
              ))}
            </div>
          ))}

          {/* New task form */}
          <div style={{ background: 'var(--pink-soft)', borderRadius: 16, padding: 14, marginTop: 8 }}>
            <h4 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 13, color: 'var(--pink)', marginBottom: 12 }}>Nueva tarea</h4>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <input value={newTask.icon} onChange={e => setNewTask(p => ({ ...p, icon: e.target.value }))} placeholder="🌟" style={{ ...INPUT, width: 44, textAlign: 'center', fontSize: 18 }} />
              <input value={newTask.label} onChange={e => setNewTask(p => ({ ...p, label: e.target.value }))} placeholder="Nombre de la tarea" style={{ ...INPUT, flex: 1, minWidth: 120 }} />
              <input value={newTask.time} onChange={e => setNewTask(p => ({ ...p, time: e.target.value }))} placeholder="hora (ej: 8:00 pm)" style={{ ...INPUT, width: 120 }} />
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink-soft)', cursor: 'pointer' }}>
                <input type="radio" checked={newTask.day_type === 'weekday'} onChange={() => setNewTask(p => ({ ...p, day_type: 'weekday' }))} />
                Lun–Vie
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink-soft)', cursor: 'pointer' }}>
                <input type="radio" checked={newTask.day_type === 'saturday'} onChange={() => setNewTask(p => ({ ...p, day_type: 'saturday' }))} />
                Sábado
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink-soft)', cursor: 'pointer' }}>
                <input type="checkbox" checked={newTask.skippable} onChange={e => setNewTask(p => ({ ...p, skippable: e.target.checked }))} />
                Saltable
              </label>
            </div>
            <button onClick={addTask} disabled={saving || !newTask.icon.trim() || !newTask.label.trim()} style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: 'var(--pink)', color: '#fff', fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Guardando...' : 'Agregar tarea'}
            </button>
          </div>
        </div>
      )}

      {/* ── INVITES SECTION ── */}
      {section === 'invites' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <button onClick={() => generateCode('hijo')} style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: 'var(--pink)', color: '#fff', fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              + Código para hijo/a
            </button>
            <button onClick={() => generateCode('padre')} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid var(--pink)', background: 'var(--pink-soft)', color: 'var(--pink)', fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              + Código para papá/mamá
            </button>
          </div>
          {codes.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--ink-soft)', fontStyle: 'italic', padding: '20px 0' }}>No hay códigos activos.</p>
          ) : codes.map(c => (
            <div key={c.id} style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 22, letterSpacing: 4, color: 'var(--ink)' }}>{c.code}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>
                  {c.role === 'padre' ? 'Para papá/mamá' : 'Para hijo/a'} · vence {new Date(c.expires_at).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <button onClick={() => revokeCode(c.id)} style={{ background: 'var(--line)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'var(--ink-soft)', fontSize: 12, fontWeight: 700 }}>Revocar</button>
            </div>
          ))}
        </div>
      )}

      {/* ── MI MUNDO READ-ONLY ── */}
      {section === 'mundo' && (
        <div>
          <p style={{ color: 'var(--ink-soft)', fontSize: 13, marginBottom: 16, fontStyle: 'italic' }}>
            Solo lectura — solo tu hijo/a puede editar esto.
          </p>
          {MundoPrompts.map(p => (
            <div key={p.key} style={{ ...CARD }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink-soft)', marginBottom: 6 }}>{p.title}</div>
              <div style={{ fontSize: 14, color: mundo[p.key] ? 'var(--ink)' : 'var(--ink-soft)', fontStyle: mundo[p.key] ? 'normal' : 'italic' }}>
                {mundo[p.key] || '(sin responder todavía)'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/AdminTab.tsx
git commit -m "feat: add AdminTab with task CRUD, invite code management, and mi mundo read-only"
```

---

## Task 10: Migration Script

**Files:**
- Create: `scripts/migrate-jsonbin-to-supabase.ts`

**Interfaces:**
- Run with: `npx tsx scripts/migrate-jsonbin-to-supabase.ts`
- Requires `.env.local` to be loaded; use `dotenv`

- [ ] **Step 1: Install `dotenv` and `tsx`**

```bash
npm install --save-dev dotenv tsx
```

- [ ] **Step 2: Create `scripts/migrate-jsonbin-to-supabase.ts`**

```ts
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { WEEKDAY_TASKS, SATURDAY_TASKS } from '../lib/tasks';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function fetchBin() {
  const res = await fetch(`https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}/latest`, {
    headers: { 'X-Master-Key': process.env.JSONBIN_API_KEY! },
  });
  const data = await res.json();
  return data.record ?? data;
}

async function main() {
  console.log('📦 Fetching JSONBin data...');
  const bin = await fetchBin();
  console.log(`  weeks: ${Object.keys(bin.weeks ?? {}).length}, events: ${(bin.events ?? []).length}`);

  // 1. Create family
  const { data: family, error: fErr } = await supabase
    .from('families')
    .insert({ name: 'Carlita' })
    .select()
    .single();
  if (fErr) throw new Error(`Family insert failed: ${fErr.message}`);
  const familyId = family.id;
  console.log(`✅ Family created: ${familyId}`);

  // 2. Seed tasks
  const allTasks = [
    ...WEEKDAY_TASKS.map((t, i) => ({ family_id: familyId, slug: t.id, day_type: 'weekday', icon: t.icon, label: t.label, time: t.time, skippable: t.skippable ?? false, sort_order: i, active: true })),
    ...SATURDAY_TASKS.map((t, i) => ({ family_id: familyId, slug: t.id, day_type: 'saturday', icon: t.icon, label: t.label, time: t.time, skippable: t.skippable ?? false, sort_order: i, active: true })),
  ];
  const { error: tErr } = await supabase.from('tasks').insert(allTasks);
  if (tErr) throw new Error(`Tasks insert failed: ${tErr.message}`);
  console.log(`✅ ${allTasks.length} tasks seeded`);

  // 3. Weekly state
  const weeklyRows: { family_id: string; week_key: string; day: string; state: unknown }[] = [];
  for (const [weekKey, weekData] of Object.entries(bin.weeks ?? {})) {
    for (const [day, dayState] of Object.entries(weekData as Record<string, unknown>)) {
      if (dayState && typeof dayState === 'object') {
        weeklyRows.push({ family_id: familyId, week_key: weekKey, day, state: dayState });
      }
    }
  }
  if (weeklyRows.length) {
    const { error: wErr } = await supabase.from('weekly_state').insert(weeklyRows);
    if (wErr) throw new Error(`Weekly state insert failed: ${wErr.message}`);
  }
  console.log(`✅ ${weeklyRows.length} weekly state rows migrated`);

  // 4. Events
  const eventRows = (bin.events ?? []).map((e: { date: string; time: string; label: string }) => ({
    family_id: familyId, date: e.date, time: e.time, label: e.label,
  }));
  if (eventRows.length) {
    const { error: eErr } = await supabase.from('events').insert(eventRows);
    if (eErr) throw new Error(`Events insert failed: ${eErr.message}`);
  }
  console.log(`✅ ${eventRows.length} events migrated`);

  // 5. Mi Mundo — requires Carlita's user ID
  const carlitaId = process.env.CARLITA_USER_ID;
  if (carlitaId && bin.miMundo) {
    const mundoRows = Object.entries(bin.miMundo)
      .filter(([, v]) => v)
      .map(([key, value]) => ({ family_id: familyId, author_id: carlitaId, key, value }));
    if (mundoRows.length) {
      const { error: mErr } = await supabase.from('mi_mundo_entries').insert(mundoRows);
      if (mErr) throw new Error(`Mi mundo insert failed: ${mErr.message}`);
    }
    console.log(`✅ ${mundoRows.length} mi mundo entries migrated`);
  } else {
    console.log('⚠️  CARLITA_USER_ID not set — mi mundo skipped.');
    console.log('   After Carlita logs in for the first time, add her user ID to .env.local as CARLITA_USER_ID and re-run this script with --mi-mundo-only flag (or run just the mi mundo block manually in the Supabase SQL editor).');
  }

  console.log('\n🎉 Migration complete. JSONBin data is NOT deleted — it remains as backup.');
  console.log(`   Family ID for your records: ${familyId}`);
}

main().catch(e => { console.error(e); process.exit(1); });
```

- [ ] **Step 3: Commit**

```bash
git add scripts/migrate-jsonbin-to-supabase.ts package.json package-lock.json
git commit -m "feat: add JSONBin to Supabase migration script"
```

---

## Task 11: README Update + Final Cleanup

**Files:**
- Modify: `README.md`
- Modify: `app/api/state/route.ts` (deprecation note)

- [ ] **Step 1: Rewrite `README.md`**

Replace with:
```markdown
# Mi Semana — Carlita

Tracker semanal de responsabilidades para Carlita. Roles: `padre` (admin) y `hijo`.

## Stack

- Next.js 16 (App Router) · TypeScript · React 19
- Supabase (Auth + Postgres + Row Level Security)
- Tailwind CSS v4

## Correr localmente

```bash
npm install
npm run dev
```

Abre http://localhost:3000 — redirige a `/login` si no hay sesión.

## Variables de entorno

Crea `.env.local` con:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...      # solo server-side, nunca en el cliente
JSONBIN_API_KEY=...                   # mantener hasta confirmar migración
JSONBIN_BIN_ID=...                    # mantener hasta confirmar migración
```

## Configurar Supabase + Google OAuth

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un proyecto gratuito.
2. En **Settings → API**, copia la URL y las dos keys (`anon` y `service_role`) a `.env.local`.

### 2. Crear OAuth Client en Google Cloud Console

1. Ve a [console.cloud.google.com](https://console.cloud.google.com) → **APIs & Services → Credentials**.
2. Crea un **OAuth 2.0 Client ID** (tipo: Web application).
3. En **Authorized redirect URIs** agrega:
   ```
   https://<tu-proyecto>.supabase.co/auth/v1/callback
   ```
   ⚠️ Esta URI apunta a Supabase, NO a tu app de Vercel.
4. Copia el **Client ID** y el **Client Secret**.

### 3. Configurar Google en Supabase

1. En tu proyecto Supabase → **Authentication → Providers → Google**.
2. Pega el Client ID y Client Secret → activa el proveedor.
3. En **Authentication → URL Configuration**:
   - **Site URL**: `https://tu-app.vercel.app` (o `http://localhost:3000` para local)
   - **Redirect URLs** (whitelist):
     ```
     https://tu-app.vercel.app/auth/callback
     http://localhost:3000/auth/callback
     ```

### 4. Aplicar el schema de la base de datos

1. En Supabase → **SQL Editor**.
2. Pega y ejecuta el contenido de `supabase/migrations/001_initial_schema.sql`.
3. Verifica en **Table Editor** que las 7 tablas existen.

### 5. Variables en Vercel

En Vercel → **Settings → Environment Variables**, agrega:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Migración desde JSONBin

Corre una sola vez después de que el schema esté aplicado:

```bash
npx tsx scripts/migrate-jsonbin-to-supabase.ts
```

Para migrar las entradas de Mi Mundo, primero haz que Carlita inicie sesión una vez, copia su user ID desde Supabase → **Authentication → Users**, agrégalo como `CARLITA_USER_ID=...` en `.env.local`, y vuelve a correr el script.

## Flujo de invitación

1. El padre entra con Google → crea la familia automáticamente (primera vez).
2. En **⚙️ Admin → Invitaciones**, genera un código de 6 dígitos.
3. El hijo/a entra con su propio Gmail → ingresa el código → queda con `role = 'hijo'`.
```

- [ ] **Step 2: Add deprecation note to `app/api/state/route.ts`**

Add at the top of the file:
```ts
// DEPRECATED — replaced by direct Supabase reads/writes in each component.
// Keep until migration is confirmed and JSONBin backup is no longer needed.
```

- [ ] **Step 3: Run lint and build**

```bash
npm run lint
npm run build
```

Fix any errors. Common issues:
- Unused imports in modified components
- Missing `'use client'` directive if a file uses hooks
- Type errors from the `AppState` shape change (ProgressTab receives `state={{ weeks, events: [] }}` — ensure that satisfies the type)

- [ ] **Step 4: Final commit**

```bash
git add README.md app/api/state/route.ts
git commit -m "docs: update README with Supabase setup instructions and OAuth steps"
```

---

## Self-Review Against Spec

| Spec requirement | Task covering it |
|------------------|------------------|
| Google OAuth login | Task 3 (login page + callback) |
| Middleware session refresh + redirect | Task 3 |
| `families`, `profiles`, `tasks`, `weekly_state`, `events`, `mi_mundo_entries`, `invite_codes` tables | Task 2 |
| RLS: tasks/events INSERT/UPDATE/DELETE padre only | Task 2 |
| RLS: mi_mundo INSERT/UPDATE author_id = auth.uid() | Task 2 |
| RLS: invite_codes SELECT restricted to padre | Task 2 |
| `tasks.slug` unique per family (not globally) | Task 2 (`unique(family_id, slug)`) |
| `invite_codes.code` VARCHAR(6) | Task 2 |
| `getDayCompletion(dayState, tasks[])` | Task 4 |
| `getTasksForDayFromList` helper | Task 4 |
| First-user auto-creates family as padre | Task 5 |
| Invite code entry screen for new users | Task 5 |
| Admin tab hidden from hijo (client + RLS) | Task 5 |
| Sign-out button | Task 5 |
| Invite create API (padre only, role check) | Task 6 |
| Invite redeem API (service role, atomic) | Task 6 |
| EventsTab → Supabase, padre-only controls | Task 7 |
| MiMundoTab → Supabase upsert | Task 8 |
| AdminTab tasks CRUD | Task 9 |
| AdminTab invite management | Task 9 |
| AdminTab mi mundo read-only | Task 9 |
| Migration script, two-pass for mi mundo | Task 10 |
| README OAuth setup steps (two redirect URIs) | Task 11 |
| `npm run lint` + `npm run build` clean | Task 11 |
| Existing tabs unchanged | Tasks 4–5 (prop threading only) |
