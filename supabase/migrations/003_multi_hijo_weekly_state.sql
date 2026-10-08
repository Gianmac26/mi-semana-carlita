-- ── Fase 1: Multi-hijo en weekly_state ──────────────────────────────────────
-- Agrega user_id a weekly_state y cambia el constraint único para que cada
-- hijo tenga su propio estado por semana/día.
--
-- Rollback: 003_rollback.sql

-- 1. Columna user_id (nullable primero para backfill seguro)
alter table weekly_state
  add column user_id uuid references profiles(id);

-- 2. Backfill: asignar el primer hijo de cada familia a los registros existentes
update weekly_state ws
set user_id = (
  select p.id
  from profiles p
  where p.family_id = ws.family_id
    and p.role = 'hijo'
  order by p.created_at
  limit 1
);

-- 3. Guard: abortar si quedan filas sin user_id.
--    Precondición: registra el perfil del hijo vía código de invitación y vuelve a correr.
--    Si ACEPTAS PERDER esas filas (datos de prueba), comenta el DO $$ y descomenta el DELETE.
do $$
declare
  _orphan_count int;
begin
  select count(*) into _orphan_count
  from weekly_state
  where user_id is null;

  if _orphan_count > 0 then
    raise exception
      'MIGRACIÓN ABORTADA: % fila(s) de weekly_state no tienen hijo registrado. '
      'Registra el perfil del hijo vía código de invitación y vuelve a correr.',
      _orphan_count;
  end if;
end $$;

-- DELETE explícito de huérfanas — DESCOMENTA SOLO si aceptas perder esas filas:
-- delete from weekly_state where user_id is null;

-- 4. Hacer NOT NULL después del backfill
alter table weekly_state alter column user_id set not null;

-- 5. Eliminar el constraint único viejo (family_id, week_key, day)
do $$
declare
  _name text;
begin
  select conname into _name
  from pg_constraint
  where conrelid = 'weekly_state'::regclass
    and contype = 'u'
    and pg_get_constraintdef(oid) like '%week_key%day%'
    and pg_get_constraintdef(oid) not like '%user_id%';
  if _name is not null then
    execute format('alter table weekly_state drop constraint %I', _name);
  end if;
end $$;

-- 6. Nuevo constraint único incluyendo user_id
alter table weekly_state
  add constraint weekly_state_family_week_day_user_key
  unique (family_id, week_key, day, user_id);

-- 7. Actualizar políticas RLS
drop policy if exists "family members can read weekly state"  on weekly_state;
drop policy if exists "family members can insert weekly state" on weekly_state;
drop policy if exists "family members can update weekly state" on weekly_state;

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

-- 8. Índice de performance para queries por usuario
create index if not exists weekly_state_user_week_idx
  on weekly_state (user_id, week_key);
