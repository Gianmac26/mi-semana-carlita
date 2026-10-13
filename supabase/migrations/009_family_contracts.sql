-- 009 — Contrato familiar (Fase 4, Parte 1).
-- Intro editable + snapshot de las reglas de oro vigentes. Cada versión es una fila
-- nueva e inmutable; solo 1 activa por familia. Firmas sin distinguir rol.
-- Los contratos solo se crean vía RPC create_family_contract (sin policy de INSERT).
-- La insignia contract_signed se otorga por trigger al firmar un hijo (sin puntos).

-- 1. Tablas

create table if not exists family_contracts (
  id             uuid primary key default uuid_generate_v4(),
  family_id      uuid not null references families(id) on delete cascade,
  version        int not null default 1,
  intro_text     text not null default '',
  rules_snapshot jsonb not null default '[]'::jsonb,
  active         boolean not null default true,
  created_by     uuid references profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  unique (family_id, version)
);

create unique index if not exists family_contracts_one_active_idx
  on family_contracts (family_id) where active;

create table if not exists contract_signatures (
  id          uuid primary key default uuid_generate_v4(),
  contract_id uuid not null references family_contracts(id) on delete cascade,
  family_id   uuid not null references families(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  signed_at   timestamptz not null default now(),
  unique (contract_id, user_id)
);

create index if not exists contract_signatures_contract_idx on contract_signatures (contract_id);
create index if not exists contract_signatures_user_idx on contract_signatures (user_id);

-- 2. RLS

alter table family_contracts     enable row level security;
alter table contract_signatures  enable row level security;

-- family_contracts: SELECT + UPDATE (desactivar). Sin INSERT ni DELETE.
drop policy if exists "contracts select family" on family_contracts;
create policy "contracts select family"
  on family_contracts for select
  using (family_id = auth_family_id());

drop policy if exists "contracts update padre" on family_contracts;
create policy "contracts update padre"
  on family_contracts for update
  using (family_id = auth_family_id() and auth_role() = 'padre')
  with check (family_id = auth_family_id() and auth_role() = 'padre');

-- contract_signatures: SELECT + INSERT. Sin UPDATE ni DELETE.
drop policy if exists "signatures select family" on contract_signatures;
create policy "signatures select family"
  on contract_signatures for select
  using (family_id = auth_family_id());

drop policy if exists "signatures insert own" on contract_signatures;
create policy "signatures insert own"
  on contract_signatures for insert
  with check (
    family_id = auth_family_id()
    and user_id = auth.uid()
    and exists (
      select 1 from family_contracts fc
      where fc.id = contract_id
        and fc.family_id = auth_family_id()
        and fc.active = true
    )
  );

-- 3. Trigger guardián de inmutabilidad (SIN security definer)

create or replace function family_contracts_guard_update()
returns trigger
language plpgsql
as $$
begin
  if old.family_id      is distinct from new.family_id
     or old.version       is distinct from new.version
     or old.intro_text    is distinct from new.intro_text
     or old.rules_snapshot is distinct from new.rules_snapshot
     or old.created_by    is distinct from new.created_by
     or old.created_at    is distinct from new.created_at
     or (old.active = false and new.active = true) then
    raise exception 'Los contratos son inmutables: solo se puede desactivar';
  end if;
  return new;
end;
$$;

drop trigger if exists family_contracts_guard_update_trigger on family_contracts;
create trigger family_contracts_guard_update_trigger
  before update on family_contracts
  for each row
  execute function family_contracts_guard_update();

-- 4. Trigger de insignia al firmar un hijo

create or replace function award_contract_signature_badge()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_role text;
begin
  select role into v_role from profiles where id = new.user_id;
  if v_role = 'hijo' then
    insert into badges (user_id, family_id, badge_slug)
    values (new.user_id, new.family_id, 'contract_signed')
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists contract_signatures_award on contract_signatures;
create trigger contract_signatures_award
  after insert on contract_signatures
  for each row
  execute function award_contract_signature_badge();

-- 5. RPC create_family_contract

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

  -- Bloqueo contra concurrencia: dos padres creando a la vez.
  perform 1 from families where id = v_family_id for update;

  -- Snapshot de reglas vigentes.
  select coalesce(jsonb_agg(jsonb_build_object('emoji', emoji, 'text', text) order by sort_order), '[]'::jsonb)
  into v_snapshot
  from family_rules
  where family_id = v_family_id and active = true;

  -- Siguiente versión.
  select coalesce(max(version), 0) + 1 into v_version
  from family_contracts
  where family_id = v_family_id;

  -- Desactivar contrato activo actual.
  update family_contracts
  set active = false
  where family_id = v_family_id and active = true;

  -- Insertar nuevo contrato.
  insert into family_contracts (family_id, version, intro_text, rules_snapshot, active, created_by)
  values (v_family_id, v_version, coalesce(p_intro, ''), v_snapshot, true, auth.uid())
  returning * into v_new;

  -- El creador firma automáticamente.
  insert into contract_signatures (contract_id, family_id, user_id)
  values (v_new.id, v_family_id, auth.uid());

  return v_new;
end;
$$;

revoke execute on function create_family_contract(text) from public, anon;
grant execute on function create_family_contract(text) to authenticated;
