-- 013 — Reglas editables dentro del contrato familiar (parte destructiva).
-- ⚠️ Correr SOLO después de que el frontend que usa create_family_contract(p_intro, p_rules)
-- esté Ready en Vercel. Antes de eso, el frontend viejo en producción se rompe
-- (llama a la versión de 1 argumento y escribe family_rules directamente).

-- 1. Quitar la versión de 1 argumento (009). Queda solo create_family_contract(text, jsonb).

drop function if exists create_family_contract(text);

-- 2. family_rules: solo lectura para clientes. La RPC (security definer) es la única que escribe.

drop policy if exists "family_rules_insert" on family_rules;
drop policy if exists "family_rules_update" on family_rules;
drop policy if exists "family_rules_delete" on family_rules;

-- 3. Refrescar el cache de esquema de PostgREST.

notify pgrst, 'reload schema';

-- Rollback (manual): recrea la RPC de 1 argumento (copia de 009 §5) y las 3 policies (copia de 002).
/*
create or replace function create_family_contract(p_intro text)
returns family_contracts
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_family_id  uuid := auth_family_id();
  v_role       text := auth_role();
  v_version    int;
  v_snapshot   jsonb;
  v_new        family_contracts;
begin
  if v_family_id is null then
    raise exception 'Usuario sin familia';
  end if;

  if v_role is distinct from 'padre' then
    raise exception 'Solo un padre puede crear un contrato familiar';
  end if;

  perform 1 from families where id = v_family_id for update;

  select coalesce(jsonb_agg(jsonb_build_object('emoji', emoji, 'text', text) order by sort_order), '[]'::jsonb)
  into v_snapshot
  from family_rules
  where family_id = v_family_id and active = true;

  select coalesce(max(version), 0) + 1 into v_version
  from family_contracts
  where family_id = v_family_id;

  update family_contracts
  set active = false
  where family_id = v_family_id and active = true;

  insert into family_contracts (family_id, version, intro_text, rules_snapshot, active, created_by)
  values (v_family_id, v_version, coalesce(p_intro, ''), v_snapshot, true, auth.uid())
  returning * into v_new;

  insert into contract_signatures (contract_id, family_id, user_id)
  values (v_new.id, v_family_id, auth.uid());

  return v_new;
end;
$$;

revoke execute on function create_family_contract(text) from public, anon;
grant execute on function create_family_contract(text) to authenticated;

create policy "family_rules_insert" on family_rules
  for insert with check (family_id = auth_family_id() and auth_role() = 'padre');

create policy "family_rules_update" on family_rules
  for update using (family_id = auth_family_id() and auth_role() = 'padre');

create policy "family_rules_delete" on family_rules
  for delete using (family_id = auth_family_id() and auth_role() = 'padre');

notify pgrst, 'reload schema';
*/
