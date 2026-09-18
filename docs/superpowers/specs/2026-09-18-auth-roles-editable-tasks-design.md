# Auth, Roles & Editable Tasks — Design Spec

**Project:** mi-semana-carlita  
**Date:** 2026-09-18  
**Status:** Approved

---

## 1. Objective

Replace the open JSONBin storage with Supabase (Auth + Postgres + RLS) to introduce two roles — `padre` (admin) and `hijo` — and allow the admin to manage weekly tasks and their schedules. The visual design, tone, and all existing tabs stay unchanged.

---

## 2. Architecture Overview

```
Browser (Client Components)
  ├── createBrowserClient(@supabase/ssr)  ← reads/writes Supabase directly
  └── fetch('/api/...')                  ← invite code redemption only

middleware.ts (Edge)
  └── createServerClient(@supabase/ssr)  ← refreshes session cookie, redirects /login

Server Components / Route Handlers
  └── createServerClient(@supabase/ssr)  ← cookie-based session, service_role for invite redemption

Supabase
  ├── Auth (Google OAuth)
  ├── Postgres (tables below)
  └── RLS (policies enforce role rules at DB level)
```

Data flows:
- **Read** — Client Components call `supabase.from('...').select()` directly (RLS scopes to family)
- **Write** — same client, except invite code redemption which goes through a Route Handler using the service role key for an atomic mark-as-used operation
- **Session** — `@supabase/ssr` manages cookies; middleware refreshes the token on every request

---

## 3. Database Schema

### 3.1 `families`

```sql
create table families (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz default now()
);
```

RLS:
- SELECT: `auth.uid() in (select id from profiles where family_id = families.id)`

### 3.2 `profiles`

```sql
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  family_id    uuid not null references families(id),
  role         text not null check (role in ('padre', 'hijo')),
  display_name text not null,
  email        text not null,
  created_at   timestamptz default now()
);
```

RLS:
- SELECT: `family_id = (select family_id from profiles where id = auth.uid())`
- UPDATE: `id = auth.uid()` (own row only)

### 3.3 `tasks`

```sql
create table tasks (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families(id),
  slug        text not null,           -- human-readable key used in weekly_state JSONB
  day_type    text not null check (day_type in ('weekday', 'saturday')),
  icon        text not null,
  label       text not null,
  time        text not null default '',
  skippable   boolean not null default false,
  sort_order  integer not null default 0,
  active      boolean not null default true,
  created_at  timestamptz default now(),
  unique (family_id, slug)             -- same slug can exist in different families
);
```

Note: `weekly_state` JSONB stores task completion as `{ slug: true/false, ... }`. The `slug` is stable (admin can't rename it once created — only label/icon/time can be edited). Matching historical data from the seed: existing task IDs (`llegada_cole`, `llegada`, etc.) become the `slug` values for Carlita's family.

RLS:
- SELECT: `family_id = (select family_id from profiles where id = auth.uid())`
- INSERT/UPDATE/DELETE: `family_id = (select family_id from profiles where id = auth.uid()) AND (select role from profiles where id = auth.uid()) = 'padre'`

### 3.4 `weekly_state`

```sql
create table weekly_state (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references families(id),
  week_key   text not null,   -- e.g. "2026-09-14"
  day        text not null,   -- 'mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun'
  state      jsonb not null default '{}',
  unique (family_id, week_key, day)
);
```

The `state` JSONB mirrors the current `DayState`:
```json
{
  "notes": "hoy fue bien",
  "ensayo": { "start": "16:00", "end": "17:30" },
  "skipped": { "regreso": true },
  "llegada_cole": true,
  "llegada": false
}
```

RLS:
- SELECT: `family_id = (select family_id from profiles where id = auth.uid())`
- INSERT/UPDATE: `family_id = (select family_id from profiles where id = auth.uid())`
  - No role restriction — both padre and hijo can write weekly state (it's shared family data)

### 3.5 `events`

```sql
create table events (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references families(id),
  date       text not null,
  time       text not null default '',
  label      text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);
```

RLS:
- SELECT: `family_id = (select family_id from profiles where id = auth.uid())`
- INSERT/UPDATE/DELETE: role = 'padre' AND same family

### 3.6 `mi_mundo_entries`

```sql
create table mi_mundo_entries (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references families(id),
  author_id  uuid not null references auth.users(id),
  key        text not null check (key in ('padres','cancion','risa','aprendi','preocupa','meta','pedido')),
  value      text not null default '',
  updated_at timestamptz default now(),
  unique (family_id, author_id, key)
);
```

RLS:
- SELECT: `family_id = (select family_id from profiles where id = auth.uid())`
- INSERT: `author_id = auth.uid()`
- UPDATE: `author_id = auth.uid()` — padre cannot update, even knowing the row id

### 3.7 `invite_codes`

```sql
create table invite_codes (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references families(id),
  code       varchar(6) not null,   -- zero-padded, e.g. "007432"
  role       text not null check (role in ('padre', 'hijo')),
  created_by uuid not null references auth.users(id),
  expires_at timestamptz not null,
  used_by    uuid references auth.users(id),
  used_at    timestamptz,
  created_at timestamptz default now()
);
```

Code generation: `LPAD(FLOOR(RANDOM()*1000000)::int::text, 6, '0')` — regenerate if collision.

RLS:
- SELECT: `family_id = (select family_id from profiles where id = auth.uid()) AND (select role from profiles where id = auth.uid()) = 'padre'`
- INSERT: same — role = 'padre' AND same family
- UPDATE/DELETE: same as INSERT (for revocation)
- **No SELECT for `hijo`** — children cannot see the codes table at all, preventing them from discovering active codes they could share to create unauthorized padre accounts.

---

## 4. Auth Flow

### 4.1 New user, first ever (no families exist yet)

1. User hits `/` → middleware detects no session → redirect to `/login`
2. User clicks "Continuar con Google" → Supabase OAuth → Google → `supabase.co/auth/v1/callback` → app's `/auth/callback?code=...`
3. `/app/auth/callback/route.ts` calls `supabase.auth.exchangeCodeForSession(code)` → sets cookies → redirects to `/`
4. App checks: `profiles` has no row for this `auth.uid()` → shows first-run screen
5. No families in DB → auto-creates family + profile with `role = 'padre'`

### 4.2 Padre inviting a child

1. Padre opens Admin tab → Invitaciones → "Generar código"
2. Route Handler `POST /api/invite` (authed as padre, role checked): inserts row in `invite_codes` with `expires_at = now() + interval '48 hours'`; returns the 6-digit code
3. Padre shares code with child out-of-band (WhatsApp, etc.)

### 4.3 Child joining

1. Child visits app → no session → `/login`
2. "Continuar con Google" → OAuth dance → session created → `/`
3. No `profile` for this uid → shows "ingresa tu código de invitación"
4. Child submits 6-digit code → `POST /api/invite/redeem`
5. Route Handler (uses `serviceRoleKey`): finds matching `invite_codes` row where `code = ?` AND `used_by IS NULL` AND `expires_at > now()` — atomic update with `used_by` and `used_at` + inserts `profiles` row with `role` from the invite code
6. Success → redirect to `/`; invalid/expired/used → error message + "pide uno nuevo a tus papás"

### 4.4 Second padre joining

Same as 4.3 but the invite_code has `role = 'padre'`.

### 4.5 Returning user

Middleware finds valid session → checks `profiles` → has a row → passes through to `/`.

---

## 5. New Files

```
middleware.ts                          ← refresh session, redirect unauthenticated to /login
app/
  login/
    page.tsx                           ← Google sign-in button, same visual style
  auth/
    callback/
      route.ts                         ← exchangeCodeForSession → set cookie → redirect
  api/
    invite/
      route.ts                         ← POST: create invite code (padre only)
    invite/
      redeem/
        route.ts                       ← POST: validate + consume code (service role)
lib/
  supabase/
    client.ts                          ← createBrowserClient (used in Client Components)
    server.ts                          ← createServerClient (used in Server Components + Route Handlers)
    middleware.ts                      ← createServerClient for middleware (reads+writes cookies)
  types.ts                             ← extend with Profile, Task, InviteCode types
scripts/
  migrate-jsonbin-to-supabase.ts       ← one-off migration (tsx)
```

---

## 6. Modified Files

### `middleware.ts` (new, at root)
- Creates Supabase server client with cookie read/write
- Calls `supabase.auth.getUser()` to refresh session
- If no session AND path !== `/login` AND path !== `/auth/callback` → redirect `/login`
- Returns response with updated cookies

### `app/layout.tsx`
- No structural change; remains a Server Component
- Does NOT read session here (session is read inside Client Components via browser client or passed from server pages)

### `app/page.tsx`
- Keep `'use client'`; initialize `createBrowserClient` at component level
- On mount: `supabase.auth.getUser()` → if no user, push to `/login`
- Fetch `profile` from `profiles` table → store in state → derive `role`
- Fetch tasks from `tasks` table for this `family_id`
- Replace `fetch('/api/state')` polling with: load `weekly_state` + `events` + `mi_mundo_entries` from Supabase on mount
- Pass `role`, `profile`, and `tasks` as props to tabs that need them
- Add "⚙️ Admin" tab to TABS array, rendered only if `role === 'padre'`
- Add sign-out button in header (calls `supabase.auth.signOut()`)

### `lib/tasks.ts`
- Keep `WEEKDAY_TASKS` and `SATURDAY_TASKS` as the seed data for migration only
- Keep `DAY_KEYS`, `DayKey`, `DAY_LABELS` — still used
- Change `getDayCompletion(dayState, day)` → `getDayCompletion(dayState, tasks: Task[])` — no longer calls `getTasksForDay` internally; receives tasks from caller
- `getTasksForDay` kept temporarily for migration script, marked `@deprecated`

### `components/WeekTab.tsx`
- Accept a `tasks: Task[]` prop instead of calling `getTasksForDay(selectedDay)`
- Filter `tasks` by `day_type` based on `selectedDay` (weekday vs saturday)
- Pass tasks to `getDayCompletion`

### `components/DayChips.tsx`
- If it calls `getDayCompletion`: accept `tasks: Task[]` prop, pass through

### `components/ProgressTab.tsx`
- Accept `tasks: Task[]` prop for completion calculations

### `components/EventsTab.tsx`
- Replace `state.events` reads with Supabase query to `events` table
- Replace JSONBin-routed saves with `supabase.from('events').insert/delete`
- Only renders add/delete controls if `role === 'padre'`

### `components/MiMundoTab.tsx`
- Replace `state.miMundo` reads with Supabase query to `mi_mundo_entries`
- Writes: `supabase.from('mi_mundo_entries').upsert({ ... }, { onConflict: 'family_id,author_id,key' })`
- `textarea` elements remain — they only work because RLS blocks writes from non-authors

### `app/api/state/route.ts`
- Can be removed once migration is complete and all components read from Supabase directly
- Keep during transition — deprecation note in file

---

## 7. New Components

### `components/AdminTab.tsx`
Three sections, visible only to `role === 'padre'`:

**Tareas:**
- List of active tasks grouped by `day_type`, sorted by `sort_order`
- Each row: drag handle (reorder) + icon field + label field + time field + skippable toggle + delete button
- "Agregar tarea" form: icon, label, time, day_type, skippable — generates slug from label (lowercase, no spaces, no accents, max 30 chars), checks uniqueness within family
- Save: upsert to `tasks` table
- Delete: sets `active = false` (soft delete to preserve historical weekly_state references)

**Invitaciones:**
- List of active codes (not used, not expired) with `role` label and expiry
- "Generar código padre" and "Generar código hijo" buttons
- "Revocar" button: `DELETE` on that code row (padre only, same family — enforced by RLS)

**Mi mundo (solo lectura):**
- Same card layout as `MiMundoTab.tsx` but all `<textarea>` replaced with `<p>` tags
- Shows "(sin responder todavía)" in muted style if `value` is empty

---

## 8. Migration Script

`scripts/migrate-jsonbin-to-supabase.ts` — run once with `npx tsx scripts/migrate-jsonbin-to-supabase.ts`

Steps:
1. Fetch current bin from JSONBin (`JSONBIN_API_KEY` + `JSONBIN_BIN_ID`)
2. Insert `families` row: `{ name: 'Carlita' }` → capture `family_id`
3. Insert `tasks` rows from `WEEKDAY_TASKS` + `SATURDAY_TASKS`, mapping `id` → `slug`, setting `sort_order` from array index
4. Insert all `weeks` entries into `weekly_state` (one row per `(week_key, day)` pair with non-empty DayState)
5. Insert all `events` into `events` table (no `created_by` since no user yet)
6. Insert `miMundo` entries into `mi_mundo_entries` — if Carlita's `auth.uid()` is known (i.e., she's already signed in once), use it as `author_id`; otherwise log a warning and skip — documented in README as a two-pass migration
7. Log counts of each table inserted

The script uses `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS) and never touches client-side tokens.

---

## 9. Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server-side only, never exposed to browser
JSONBIN_API_KEY=                    # keep until migration confirmed
JSONBIN_BIN_ID=                     # keep until migration confirmed
```

---

## 10. Supabase + Google OAuth Setup (README excerpt)

### Step 1 — Google Cloud Console
1. Go to [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. **Authorized redirect URIs**: add `https://<your-supabase-project>.supabase.co/auth/v1/callback`
   - Do NOT add your Vercel URL here — only the Supabase URL
4. Copy the Client ID and Client Secret

### Step 2 — Supabase Auth settings
1. In your Supabase project: Authentication → Providers → Google
2. Paste Client ID and Client Secret → Enable
3. Authentication → URL Configuration:
   - **Site URL**: `https://your-app.vercel.app` (or `http://localhost:3000` for local dev)
   - **Redirect URLs** (whitelist): add `https://your-app.vercel.app/auth/callback` and `http://localhost:3000/auth/callback`

### Step 3 — Vercel env vars
Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` in Vercel → Settings → Environment Variables.

---

## 11. Acceptance Criteria

1. A new padre logs in with Google and, if no family exists, becomes admin of a new family automatically.
2. Admin generates a code; a child registers with their own Gmail using that code and gets `role = 'hijo'` in the same family.
3. An already-used or expired code rejects with a clear message.
4. The padre UI has no controls to edit Mi mundo entries. A direct `UPDATE` to `mi_mundo_entries` authenticated as the padre (e.g., via Supabase Studio SQL editor with `set role authenticated; set request.jwt.claims.sub = '<padre-uid>'`) is rejected by RLS.
5. Admin creates a new task with a specific time; it appears in WeekTab on the child's device without any code changes.
6. The child never sees the Admin tab — confirmed both visually and by direct API call: `POST /api/invite` with a child's JWT returns 403.
7. `npm run lint` and `npm run build` pass clean.
8. All existing tabs (WeekSelector, DayChips, ProgressTab, ArticlesTab, GoldenRules, ThemeToggle) work identically.

---

## 12. Out of Scope (this sprint)

- Movies/series recommendations, trivia, music, reading follow-up with AI
- Emergency access flows (crisis lines, bullying, eating disorders) — auth design must not block these when added later; the plan does not put them behind role checks
- Redesigning any visual element

---

## 13. Design Decisions Log

| Decision | Rationale |
|----------|-----------|
| `tasks.slug` + unique constraint `(family_id, slug)` instead of UUID-only PK | Slug used as key in `weekly_state` JSONB for historical compatibility; two families can have same slugs |
| `getDayCompletion(dayState, tasks[])` instead of `(dayState, day)` | Tasks are now async/dynamic; function must receive them from caller |
| No SELECT on `invite_codes` for `hijo` role | Child knowing active codes could share a `padre` invite to create unauthorized admin accounts |
| `mi_mundo_entries`: separate INSERT and UPDATE RLS policies | Supabase RLS treats them as distinct operations; both must have `author_id = auth.uid()` |
| `invite_codes.code` as `VARCHAR(6)` | Preserves leading zeros (e.g., "007432"); INT would truncate |
| Migration is two-pass for `mi_mundo_entries` | Carlita's `auth.uid()` is unknown until she logs in; `author_id` can't be set without it |
| Admin tab is UX-hidden, not route-protected | No separate `/admin` route exists; real protection is RLS + Route Handler role checks |
