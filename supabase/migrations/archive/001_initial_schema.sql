-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ── families ────────────────────────────────────────────────────────────────
create table families (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz default now()
);

alter table families enable row level security;

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

-- SECURITY DEFINER helpers — bypass RLS on inner profile reads to avoid 42P17
-- infinite recursion. All policies use these instead of inline subqueries.
create function auth_family_id() returns uuid
  language sql stable security definer set search_path = public as
  $$ select family_id from profiles where id = auth.uid() $$;

create function auth_role() returns text
  language sql stable security definer set search_path = public as
  $$ select role from profiles where id = auth.uid() $$;

-- families policy — now profiles table exists
create policy "family members can read their family"
  on families for select
  using (id = auth_family_id());

-- NOTE: No INSERT policy on families — all family creation via service-role /api/onboard

-- profiles policies
create policy "family members can read profiles"
  on profiles for select
  using (family_id = auth_family_id());

-- R4: with check freezes role and family_id — only display_name/email can change
create policy "users can update own profile"
  on profiles for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = auth_role()
    and family_id = auth_family_id()
  );

-- NOTE: No INSERT policy on profiles — all profile creation via service-role handlers

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
  using (family_id = auth_family_id());

create policy "only padre can insert tasks"
  on tasks for insert
  with check (
    family_id = auth_family_id()
    and auth_role() = 'padre'
  );

create policy "only padre can update tasks"
  on tasks for update
  using (
    family_id = auth_family_id()
    and auth_role() = 'padre'
  );

create policy "only padre can delete tasks"
  on tasks for delete
  using (
    family_id = auth_family_id()
    and auth_role() = 'padre'
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
  using (family_id = auth_family_id());

create policy "family members can insert weekly state"
  on weekly_state for insert
  with check (family_id = auth_family_id());

-- R3: with check prevents switching family_id on update
create policy "family members can update weekly state"
  on weekly_state for update
  using (family_id = auth_family_id())
  with check (family_id = auth_family_id());

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
  using (family_id = auth_family_id());

create policy "only padre can insert events"
  on events for insert
  with check (
    family_id = auth_family_id()
    and auth_role() = 'padre'
  );

create policy "only padre can delete events"
  on events for delete
  using (
    family_id = auth_family_id()
    and auth_role() = 'padre'
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
  using (family_id = auth_family_id());

-- SEC-4: family_id scope added to prevent cross-family injection
create policy "author can insert mi mundo"
  on mi_mundo_entries for insert
  with check (
    author_id = auth.uid()
    and family_id = auth_family_id()
  );

-- R2 + SEC-4: both with checks applied
create policy "author can update own mi mundo"
  on mi_mundo_entries for update
  using (author_id = auth.uid())
  with check (
    author_id = auth.uid()
    and family_id = auth_family_id()
  );

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

-- SEC-5-partial: prevent two active codes from sharing a code value
create unique index invite_codes_active_code_idx on invite_codes(code)
  where used_by is null;

alter table invite_codes enable row level security;

-- Children cannot see invite_codes at all — only padre of same family
create policy "only padre can read invite codes"
  on invite_codes for select
  using (
    family_id = auth_family_id()
    and auth_role() = 'padre'
  );

create policy "only padre can insert invite codes"
  on invite_codes for insert
  with check (
    family_id = auth_family_id()
    and auth_role() = 'padre'
  );

create policy "only padre can update invite codes"
  on invite_codes for update
  using (
    family_id = auth_family_id()
    and auth_role() = 'padre'
  );

create policy "only padre can delete invite codes"
  on invite_codes for delete
  using (
    family_id = auth_family_id()
    and auth_role() = 'padre'
  );
