-- ── Rollback Fase 1: Multi-hijo en weekly_state ─────────────────────────────
-- Revierte 003_multi_hijo_weekly_state.sql

-- 1. Restaurar políticas RLS originales
drop policy if exists "weekly_state select"  on weekly_state;
drop policy if exists "weekly_state insert"  on weekly_state;
drop policy if exists "weekly_state update"  on weekly_state;

create policy "family members can read weekly state"
  on weekly_state for select
  using (family_id = auth_family_id());

create policy "family members can insert weekly state"
  on weekly_state for insert
  with check (family_id = auth_family_id());

create policy "family members can update weekly state"
  on weekly_state for update
  using  (family_id = auth_family_id())
  with check (family_id = auth_family_id());

-- 2. Eliminar nuevo constraint
alter table weekly_state
  drop constraint if exists weekly_state_family_week_day_user_key;

-- 3. Restaurar constraint original
alter table weekly_state
  add constraint weekly_state_family_id_week_key_day_key
  unique (family_id, week_key, day);

-- 4. Eliminar columna user_id
alter table weekly_state drop column if exists user_id;
