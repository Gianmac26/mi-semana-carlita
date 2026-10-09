-- ── Mi-semana v2 — Schema consolidado ────────────────────────────────────────
-- Reemplaza 001_initial_schema + 002_flexible_task_days + 003_multi_hijo.
-- Correr en una DB limpia (después de reset.sql si aplica).
--
-- Roles de aplicación:
--   admin_global  → fila en global_admins (NO tiene perfil en profiles)
--   padre         → profiles.role = 'padre'
--   hijo          → profiles.role = 'hijo'
--
-- Orden del archivo:
--   1. Extensiones
--   2. Tablas (DDL sin RLS)
--   3. Funciones helper (pueden referenciar tablas ya creadas)
--   4. Políticas RLS (pueden referenciar funciones ya creadas)
--   5. Índices de performance

-- ── 1. Extensiones ────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";

-- ── 2. Tablas ─────────────────────────────────────────────────────────────────

create table families (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  created_at  timestamptz not null default now()
);

alter table families enable row level security;

-- ─────────────────────────────────────────────────────────────────────────────

create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  family_id    uuid not null references families(id) on delete cascade,
  role         text not null check (role in ('padre', 'hijo')),
  display_name text not null,
  email        text not null default '',
  birth_year   int,
  created_at   timestamptz not null default now()
);

alter table profiles enable row level security;

-- ─────────────────────────────────────────────────────────────────────────────

create table tasks (
  id          uuid primary key default uuid_generate_v4(),
  family_id   uuid not null references families(id) on delete cascade,
  slug        text not null,
  days        text[] not null default '{}',
  icon        text not null default '⭐',
  label       text not null,
  time        text not null default '',
  skippable   boolean not null default false,
  sort_order  int not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (family_id, slug)
);

alter table tasks enable row level security;

-- ─────────────────────────────────────────────────────────────────────────────
-- weekly_state: user_id NOT NULL desde el día uno

create table weekly_state (
  id          uuid primary key default uuid_generate_v4(),
  family_id   uuid not null references families(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  week_key    text not null,
  day         text not null,
  state       jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  unique (family_id, week_key, day, user_id)
);

alter table weekly_state enable row level security;

-- ─────────────────────────────────────────────────────────────────────────────

create table events (
  id          uuid primary key default uuid_generate_v4(),
  family_id   uuid not null references families(id) on delete cascade,
  date        text not null,
  time        text not null default '',
  label       text not null,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table events enable row level security;

-- ─────────────────────────────────────────────────────────────────────────────

create table mi_mundo_entries (
  id          uuid primary key default uuid_generate_v4(),
  family_id   uuid not null references families(id) on delete cascade,
  author_id   uuid not null references profiles(id) on delete cascade,
  key         text not null,
  value       text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (family_id, author_id, key)
);

alter table mi_mundo_entries enable row level security;

-- ─────────────────────────────────────────────────────────────────────────────

create table invite_codes (
  id          uuid primary key default uuid_generate_v4(),
  family_id   uuid not null references families(id) on delete cascade,
  code        text not null unique,
  role        text not null check (role in ('padre', 'hijo')),
  created_by  uuid references profiles(id) on delete set null,
  expires_at  timestamptz not null,
  used_by     uuid references auth.users(id) on delete set null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

alter table invite_codes enable row level security;

-- ─────────────────────────────────────────────────────────────────────────────
-- admin_global NO tiene fila en profiles.
-- auth_family_id() → NULL, auth_role() → NULL para estos usuarios,
-- por lo que NINGUNA política de familia los deja pasar.

create table global_admins (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  email        text not null default '',
  created_at   timestamptz not null default now()
);

alter table global_admins enable row level security;

-- ─────────────────────────────────────────────────────────────────────────────

create table global_resources (
  id               uuid primary key default uuid_generate_v4(),
  slug             text not null unique,
  title            text not null,
  summary          text not null default '',
  body_markdown    text not null default '',
  category         text not null check (category in ('estudio', 'bienestar', 'valores', 'otro')),
  cover_image_url  text,
  emoji            text not null default '📄',
  published_at     timestamptz,
  created_by       uuid references global_admins(id) on delete set null,
  active           boolean not null default true,
  created_at       timestamptz not null default now()
);

alter table global_resources enable row level security;

-- ── 3. Funciones helper ───────────────────────────────────────────────────────
-- Definidas DESPUÉS de las tablas para que Postgres pueda validar los cuerpos.
-- Todas usan SECURITY DEFINER + set search_path para prevenir inyección de search_path.

-- Devuelve el family_id del usuario autenticado.
-- Devuelve NULL si el usuario no tiene fila en profiles (ej: admin_global).
create or replace function auth_family_id()
returns uuid language sql stable security definer
set search_path = public, pg_temp
as $$
  select family_id from profiles where id = auth.uid()
$$;

-- Devuelve el role del usuario autenticado ('padre' | 'hijo').
-- Devuelve NULL si el usuario no tiene fila en profiles (ej: admin_global).
create or replace function auth_role()
returns text language sql stable security definer
set search_path = public, pg_temp
as $$
  select role from profiles where id = auth.uid()
$$;

-- Devuelve true si el usuario autenticado es admin_global.
create or replace function is_global_admin()
returns boolean language sql stable security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from global_admins where id = auth.uid())
$$;

-- Calcula métricas en vivo. Sin tabla global_metrics.
-- Ejecutable solo por admin_global. No devuelve datos identificables.
create or replace function get_global_metrics()
returns jsonb language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  _result jsonb;
begin
  if not exists (select 1 from global_admins where id = auth.uid()) then
    raise exception 'Acceso denegado: se requiere rol admin_global';
  end if;

  select jsonb_build_object(
    'total_families',        (select count(*) from families),
    'total_hijos',           (select count(*) from profiles where role = 'hijo'),
    'total_padres',          (select count(*) from profiles where role = 'padre'),
    'families_active_week',  (
      select count(distinct family_id) from weekly_state
      where created_at > now() - interval '7 days'
    ),
    'tasks_completed_week',  (
      -- TODO: reemplazar por COUNT desde task_completions cuando Módulo 1 esté implementado
      select count(*) from weekly_state
      where created_at > now() - interval '7 days'
    ),
    'mi_mundo_entries_week', (
      select count(*) from mi_mundo_entries
      where updated_at > now() - interval '7 days'
    ),
    'calculated_at', now()
  ) into _result;

  return _result;
end;
$$;

-- ── 4. Políticas RLS ──────────────────────────────────────────────────────────

-- families
create policy "family members can read own family"
  on families for select
  using (id = auth_family_id());

create policy "family members can update own family"
  on families for update
  using (id = auth_family_id())
  with check (id = auth_family_id());

-- profiles
create policy "family members can read profiles"
  on profiles for select
  using (family_id = auth_family_id());

create policy "family members can update own profile"
  on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- tasks
create policy "family members can read tasks"
  on tasks for select
  using (family_id = auth_family_id());

create policy "padre can insert tasks"
  on tasks for insert
  with check (family_id = auth_family_id() and auth_role() = 'padre');

create policy "padre can update tasks"
  on tasks for update
  using  (family_id = auth_family_id() and auth_role() = 'padre')
  with check (family_id = auth_family_id() and auth_role() = 'padre');

create policy "padre can delete tasks"
  on tasks for delete
  using (family_id = auth_family_id() and auth_role() = 'padre');

-- weekly_state: padre ve todas las filas de su familia; hijo solo las suyas
create policy "weekly_state select"
  on weekly_state for select
  using (
    family_id = auth_family_id()
    and (auth_role() = 'padre' or user_id = auth.uid())
  );

create policy "weekly_state insert"
  on weekly_state for insert
  with check (
    family_id = auth_family_id()
    and user_id = auth.uid()
    and auth_role() = 'hijo'
  );

create policy "weekly_state update"
  on weekly_state for update
  using  (family_id = auth_family_id() and user_id = auth.uid())
  with check (family_id = auth_family_id() and user_id = auth.uid());

-- events: todos leen, solo padre escribe
create policy "family can read events"
  on events for select
  using (family_id = auth_family_id());

create policy "padre can insert events"
  on events for insert
  with check (family_id = auth_family_id() and auth_role() = 'padre');

create policy "padre can update events"
  on events for update
  using  (family_id = auth_family_id() and auth_role() = 'padre')
  with check (family_id = auth_family_id() and auth_role() = 'padre');

create policy "padre can delete events"
  on events for delete
  using (family_id = auth_family_id() and auth_role() = 'padre');

-- mi_mundo_entries: padre lee todas las de su familia; hijo solo las suyas
create policy "mi_mundo select"
  on mi_mundo_entries for select
  using (
    family_id = auth_family_id()
    and (auth_role() = 'padre' or author_id = auth.uid())
  );

create policy "mi_mundo insert"
  on mi_mundo_entries for insert
  with check (
    family_id = auth_family_id()
    and author_id = auth.uid()
    and auth_role() = 'hijo'
  );

create policy "mi_mundo update"
  on mi_mundo_entries for update
  using  (family_id = auth_family_id() and author_id = auth.uid())
  with check (family_id = auth_family_id() and author_id = auth.uid());

-- invite_codes: solo padre puede leer, crear y borrar códigos de su familia
create policy "padre can read own family codes"
  on invite_codes for select
  using (family_id = auth_family_id() and auth_role() = 'padre');

create policy "padre can insert codes"
  on invite_codes for insert
  with check (family_id = auth_family_id() and auth_role() = 'padre');

create policy "padre can delete codes"
  on invite_codes for delete
  using (family_id = auth_family_id() and auth_role() = 'padre');

-- global_admins: cada admin solo puede leer su propia fila
-- INSERT/UPDATE/DELETE solo vía service_role (sin política para authenticated)
create policy "global_admin can read own row"
  on global_admins for select
  using (id = auth.uid());

-- global_resources: lectura para todos los autenticados; escritura solo admin_global
create policy "authenticated users can read active resources"
  on global_resources for select
  using (auth.role() = 'authenticated' and active = true);

create policy "global_admin can insert resources"
  on global_resources for insert
  with check (is_global_admin());

create policy "global_admin can update resources"
  on global_resources for update
  using  (is_global_admin())
  with check (is_global_admin());

create policy "global_admin can delete resources"
  on global_resources for delete
  using (is_global_admin());

-- ── 5. Índices de performance ─────────────────────────────────────────────────
-- Cada política RLS filtra por family_id. Sin índice, cada query hace full scan.

create index profiles_family_idx        on profiles         (family_id);
create index tasks_family_idx           on tasks            (family_id);
create index weekly_state_family_idx    on weekly_state     (family_id);
create index weekly_state_user_week_idx on weekly_state     (user_id, week_key);
create index events_family_idx          on events           (family_id);
create index mi_mundo_family_idx        on mi_mundo_entries (family_id);
create index invite_codes_family_idx    on invite_codes     (family_id);
