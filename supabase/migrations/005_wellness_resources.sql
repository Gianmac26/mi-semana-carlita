-- Contenido curado de bienestar. Global (no por familia).
create table if not exists wellness_resources (
  id             uuid primary key default uuid_generate_v4(),
  slug           text not null unique,
  category       text not null check (category in ('crisis','tca','bullying','violencia','emociones','valores')),
  title          text not null,
  emoji          text not null default '📄',
  summary        text not null default '',
  body_markdown  text not null default '',
  action_steps   jsonb not null default '[]'::jsonb,
  helpline_refs  jsonb not null default '[]'::jsonb,
  sort_order     int not null default 0,
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);

alter table wellness_resources enable row level security;

-- Cualquier usuario autenticado puede leer recursos activos.
-- El admin_global también ve los inactivos (para poder reactivarlos).
create policy "authenticated users can read wellness resources"
  on wellness_resources for select
  using (auth.role() = 'authenticated' and (active = true or is_global_admin()));

-- Solo admin_global puede crear/editar/eliminar
create policy "global_admin can insert wellness resources"
  on wellness_resources for insert
  with check (is_global_admin());

create policy "global_admin can update wellness resources"
  on wellness_resources for update
  using (is_global_admin())
  with check (is_global_admin());

create policy "global_admin can delete wellness resources"
  on wellness_resources for delete
  using (is_global_admin());

create index if not exists wellness_resources_category_idx
  on wellness_resources (category, sort_order);
