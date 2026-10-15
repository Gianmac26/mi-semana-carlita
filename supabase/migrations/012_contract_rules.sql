-- 012 — Reglas editables dentro del contrato familiar (parte aditiva).
-- Nueva RPC create_family_contract(p_intro, p_rules): en la misma transacción reemplaza las
-- family_rules de la familia y usa esas mismas reglas como rules_snapshot. Así las Reglas de oro
-- de Semana y las del contrato activo nunca difieren.
-- La versión de 1 argumento (009) y las policies de escritura de family_rules (002) se quitan
-- en 013, que se corre DESPUÉS de que el frontend nuevo esté Ready en Vercel.

-- 1. RPC create_family_contract(p_intro, p_rules)
--    p_intro: máximo 2000 caracteres (después de btrim).
--    p_rules: [{ "emoji": "⭐", "text": "..." }, ...]
--    - 1 a 10 reglas.
--    - text: se normaliza (espacios colapsados + trim); 1 a 120 caracteres.
--    - emoji: opcional, por defecto ⭐; máximo 8 caracteres.
--    - Sin duplicados (texto normalizado, sin distinguir mayúsculas).

create or replace function create_family_contract(p_intro text, p_rules jsonb)
returns family_contracts
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_family_id  uuid := auth_family_id();
  v_role       text := auth_role();
  v_intro      text := btrim(coalesce(p_intro, ''));
  v_version    int;
  v_count      int;
  v_elem       jsonb;
  v_idx        int;
  v_text       text;
  v_emoji      text;
  v_dups       text;
  v_snapshot   jsonb := '[]'::jsonb;
  v_new        family_contracts;
begin
  if v_family_id is null then
    raise exception 'Usuario sin familia';
  end if;

  if v_role is distinct from 'padre' then
    raise exception 'Solo un padre puede crear un contrato familiar';
  end if;

  -- Validación de la introducción.
  if char_length(v_intro) > 2000 then
    raise exception 'La introducción supera 2000 caracteres (tiene %)', char_length(v_intro);
  end if;

  -- Validación y normalización de reglas.
  if p_rules is null or jsonb_typeof(p_rules) <> 'array' then
    raise exception 'Las reglas deben ser una lista';
  end if;

  v_count := jsonb_array_length(p_rules);
  if v_count < 1 then
    raise exception 'El contrato necesita al menos 1 regla';
  end if;
  if v_count > 10 then
    raise exception 'El contrato admite máximo 10 reglas (recibidas: %)', v_count;
  end if;

  for v_elem, v_idx in
    select e, ord::int from jsonb_array_elements(p_rules) with ordinality as t(e, ord)
  loop
    if jsonb_typeof(v_elem) <> 'object' or jsonb_typeof(v_elem->'text') is distinct from 'string' then
      raise exception 'Regla %: falta el texto', v_idx;
    end if;

    v_text := btrim(regexp_replace(v_elem->>'text', '\s+', ' ', 'g'));
    if char_length(v_text) < 1 then
      raise exception 'Regla %: el texto está vacío', v_idx;
    end if;
    if char_length(v_text) > 120 then
      raise exception 'Regla %: el texto supera 120 caracteres (tiene %)', v_idx, char_length(v_text);
    end if;

    if coalesce(jsonb_typeof(v_elem->'emoji'), 'null') = 'null' then
      v_emoji := '⭐';
    elsif jsonb_typeof(v_elem->'emoji') <> 'string' then
      raise exception 'Regla %: emoji inválido', v_idx;
    else
      v_emoji := coalesce(nullif(btrim(v_elem->>'emoji'), ''), '⭐');
    end if;
    if char_length(v_emoji) > 8 then
      raise exception 'Regla %: el emoji supera 8 caracteres', v_idx;
    end if;

    v_snapshot := v_snapshot || jsonb_build_array(jsonb_build_object('emoji', v_emoji, 'text', v_text));
  end loop;

  -- Duplicados: "Reglas repetidas: 2, 5" (varios grupos separados por "; ").
  select string_agg(nums, '; ')
  into v_dups
  from (
    select string_agg(ord::text, ', ' order by ord) as nums
    from jsonb_array_elements(v_snapshot) with ordinality as t(e, ord)
    group by lower(e->>'text')
    having count(*) > 1
  ) d;
  if v_dups is not null then
    raise exception 'Reglas repetidas: % (mismo texto)', v_dups;
  end if;

  -- Bloqueo contra concurrencia: dos padres creando a la vez.
  perform 1 from families where id = v_family_id for update;

  -- Reemplazar las Reglas de oro de la familia (incluye inactivas: unique (family_id, sort_order)).
  delete from family_rules where family_id = v_family_id;

  insert into family_rules (family_id, emoji, text, sort_order, active)
  select v_family_id, e->>'emoji', e->>'text', (ord - 1)::int, true
  from jsonb_array_elements(v_snapshot) with ordinality as t(e, ord);

  -- Siguiente versión.
  select coalesce(max(version), 0) + 1 into v_version
  from family_contracts
  where family_id = v_family_id;

  -- Desactivar contrato activo actual.
  update family_contracts
  set active = false
  where family_id = v_family_id and active = true;

  -- Insertar nuevo contrato con las mismas reglas como snapshot.
  insert into family_contracts (family_id, version, intro_text, rules_snapshot, active, created_by)
  values (v_family_id, v_version, v_intro, v_snapshot, true, auth.uid())
  returning * into v_new;

  -- El creador firma automáticamente.
  insert into contract_signatures (contract_id, family_id, user_id)
  values (v_new.id, v_family_id, auth.uid());

  return v_new;
end;
$$;

revoke execute on function create_family_contract(text, jsonb) from public, anon;
grant execute on function create_family_contract(text, jsonb) to authenticated;

-- 2. Refrescar el cache de esquema de PostgREST (firma nueva de la RPC).

notify pgrst, 'reload schema';

-- Rollback (manual, solo si 013 aún NO se corrió):
--   drop function if exists create_family_contract(text, jsonb);
--   notify pgrst, 'reload schema';
