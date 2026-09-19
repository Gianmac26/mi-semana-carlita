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

-- NOTE: No INSERT policy on families — all family creation goes through
-- service-role Route Handlers only (Task 5/6). Browser clients cannot insert.

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

-- R4: with check freezes role and family_id — only display_name/email can change
create policy "users can update own profile"
  on profiles for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select role from profiles where id = auth.uid())
    and family_id = (select family_id from profiles where id = auth.uid())
  );

-- NOTE: No INSERT policy on profiles — R1 ruling: the brief's
-- "allow insert during onboarding" policy is intentionally omitted.
-- Any authenticated Google user could self-insert into any family with
-- any role, bypassing the invite code flow. All profile+family creation
-- goes through service-role Route Handlers only (Task 5/6).

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

-- R3: with check added to prevent a client from switching family_id on update
create policy "family members can update weekly state"
  on weekly_state for update
  using (family_id = (select family_id from profiles where id = auth.uid()))
  with check (family_id = (select family_id from profiles where id = auth.uid()));

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

-- R2: with check added to prevent a client from reassigning author_id on update
create policy "author can update own mi mundo"
  on mi_mundo_entries for update
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

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
