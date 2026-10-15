-- Smoke test 012 — create_family_contract(p_intro, p_rules).
-- Correr en Supabase SQL Editor DESPUÉS de 012.
-- Cada llamada a la RPC corre con `set local role authenticated` + claims JWT del usuario,
-- para probar grants y RLS reales (no como postgres).
-- No deja datos: termina con raise exception para revertir toda la transacción.
--   Resultado esperado: ERROR "SMOKE OK: ...". Cualquier otro error = falla.

do $$
declare
  v_padre      uuid;
  v_hijo       uuid;
  v_family     uuid;
  v_prev_ver   int;
  v_c          family_contracts;
  v_rules      jsonb;
  v_orders     int[];
  v_n          int;
  v_err        text;
  v_case       record;
  v_expected   jsonb := '[
    {"emoji": "📵", "text": "Sin celular en la mesa"},
    {"emoji": "⭐", "text": "Regla sin emoji"},
    {"emoji": "⭐", "text": "Tercera regla"}
  ]'::jsonb;
begin
  -- Usuarios de prueba: padre e hijo de la familia demo (nunca una familia real).
  select p.id, p.family_id into v_padre, v_family
  from profiles p
  where p.role = 'padre'
    and p.family_id = '2bcb2cd8-b9f8-43fc-9703-cce6b6be0f25'
    and exists (select 1 from profiles h where h.family_id = p.family_id and h.role = 'hijo')
  limit 1;
  if v_padre is null then
    raise exception 'SETUP: familia demo sin padre o sin hijo';
  end if;

  select id into v_hijo from profiles where family_id = v_family and role = 'hijo' limit 1;

  select coalesce(max(version), 0) into v_prev_ver from family_contracts where family_id = v_family;

  -- ── Caso 1: válido (padre) ────────────────────────────────────────────────
  perform set_config('request.jwt.claims', json_build_object('sub', v_padre, 'role', 'authenticated')::text, true);
  set local role authenticated;

  v_c := create_family_contract(
    '  Intro de prueba  ',
    '[
      {"emoji": "📵", "text": "  Sin   celular\n en la mesa "},
      {"text": "Regla sin emoji"},
      {"emoji": "", "text": "Tercera regla"}
    ]'::jsonb
  );

  if v_c.version <> v_prev_ver + 1 then
    raise exception 'FALLA [válido]: versión % (esperada %)', v_c.version, v_prev_ver + 1;
  end if;
  if v_c.intro_text <> 'Intro de prueba' then
    raise exception 'FALLA [válido]: intro sin btrim: "%"', v_c.intro_text;
  end if;
  if v_c.rules_snapshot <> v_expected then
    raise exception 'FALLA [válido]: snapshot %', v_c.rules_snapshot;
  end if;

  -- family_rules (leído como padre, vía RLS): mismas reglas, sort_order 0..2, todas activas.
  select jsonb_agg(jsonb_build_object('emoji', emoji, 'text', text) order by sort_order),
         array_agg(sort_order order by sort_order),
         count(*) filter (where not active)
  into v_rules, v_orders, v_n
  from family_rules where family_id = v_family;
  if v_rules is distinct from v_expected then
    raise exception 'FALLA [válido]: family_rules %', v_rules;
  end if;
  if v_orders <> array[0, 1, 2] then
    raise exception 'FALLA [válido]: sort_order %', v_orders;
  end if;
  if v_n <> 0 then
    raise exception 'FALLA [válido]: % reglas inactivas', v_n;
  end if;

  select count(*) into v_n from family_contracts where family_id = v_family and active;
  if v_n <> 1 then
    raise exception 'FALLA [válido]: % contratos activos', v_n;
  end if;

  select count(*) into v_n from contract_signatures where contract_id = v_c.id and user_id = v_padre;
  if v_n <> 1 then
    raise exception 'FALLA [válido]: el padre no quedó firmado';
  end if;

  reset role;

  -- ── Casos que deben fallar ────────────────────────────────────────────────
  for v_case in
    select * from (values
      ('0 reglas',   v_padre, 'x', '[]'::jsonb,
         'El contrato necesita al menos 1 regla'),
      ('11 reglas',  v_padre, 'x',
         (select jsonb_agg(jsonb_build_object('text', 'Regla ' || g)) from generate_series(1, 11) g),
         'El contrato admite máximo 10 reglas (recibidas: 11)'),
      ('texto 121',  v_padre, 'x',
         jsonb_build_array(jsonb_build_object('text', repeat('a', 121))),
         'Regla 1: el texto supera 120 caracteres (tiene 121)'),
      ('rol hijo',   v_hijo,  'x', '[{"text": "Regla válida"}]'::jsonb,
         'Solo un padre puede crear un contrato familiar'),
      ('duplicados', v_padre, 'x',
         '[{"text": "Lavar platos"}, {"text": "Otra"}, {"text": " lavar   PLATOS"}]'::jsonb,
         'Reglas repetidas: 1, 3 (mismo texto)'),
      ('intro 2001', v_padre, repeat('i', 2001), '[{"text": "Regla válida"}]'::jsonb,
         'La introducción supera 2000 caracteres (tiene 2001)')
    ) as c(name, uid, intro, rules, expected)
  loop
    -- Fuera del sub-bloque: si la RPC falla, el rollback del savepoint revertiría el SET LOCAL.
    perform set_config('request.jwt.claims', json_build_object('sub', v_case.uid, 'role', 'authenticated')::text, true);
    set local role authenticated;

    v_err := null;
    begin
      perform create_family_contract(v_case.intro, v_case.rules);
    exception when others then
      v_err := sqlerrm;
    end;

    reset role;

    if v_err is distinct from v_case.expected then
      raise exception 'FALLA [%]: esperado "%", obtenido "%"',
        v_case.name, v_case.expected, coalesce(v_err, '(sin error)');
    end if;
  end loop;

  raise exception 'SMOKE OK: 7 casos pasaron (válido + 6 rechazos). Todo revertido.';
end;
$$;
