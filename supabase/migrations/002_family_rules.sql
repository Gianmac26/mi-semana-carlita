-- 002_family_rules.sql
-- Reglas de oro editables por familia.
-- Ejecutar en Supabase SQL Editor después de 001_schema.sql.

-- ── Tabla ─────────────────────────────────────────────────────────────────────

create table if not exists family_rules (
  id           uuid        primary key default uuid_generate_v4(),
  family_id    uuid        not null references families(id) on delete cascade,
  emoji        text        not null default '⭐',
  text         text        not null,
  sort_order   int         not null default 0,
  active       boolean     not null default true,
  created_at   timestamptz not null default now(),
  unique (family_id, sort_order)
);

alter table family_rules enable row level security;

-- ── RLS ───────────────────────────────────────────────────────────────────────

-- Cualquier miembro de la familia puede leer las reglas
create policy "family_rules_select" on family_rules
  for select using (family_id = auth_family_id());

-- Solo el padre puede crear, editar y borrar reglas
create policy "family_rules_insert" on family_rules
  for insert with check (family_id = auth_family_id() and auth_role() = 'padre');

create policy "family_rules_update" on family_rules
  for update using (family_id = auth_family_id() and auth_role() = 'padre');

create policy "family_rules_delete" on family_rules
  for delete using (family_id = auth_family_id() and auth_role() = 'padre');

-- ── Índice ────────────────────────────────────────────────────────────────────

create index if not exists family_rules_family_idx on family_rules (family_id);
