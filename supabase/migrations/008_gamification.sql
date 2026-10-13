-- 008 — Gamificación (Fase 3, Parte 1): puntos, rachas e insignias.
-- Todo se otorga desde el trigger award_on_approval (done → approved).
-- El cliente solo lee; el único UPDATE permitido es badges.notified_at del propio hijo.

-- 1. Tablas

-- points_ledger: registro inmutable de puntos.
-- Nunca se edita; solo el trigger escribe aquí.
create table if not exists points_ledger (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  family_id   uuid not null references families(id) on delete cascade,
  amount      int not null,
  reason      text not null check (reason in (
                'task_approved','streak_bonus','badge_earned',
                'contract_signed','emotion_logged'
              )),
  ref_id      uuid,
  created_at  timestamptz not null default now(),
  unique nulls not distinct (user_id, ref_id, reason)
);

create index if not exists points_ledger_user_idx on points_ledger (user_id);

-- streaks: una fila por hijo. Se crea LAZY en el primer trigger.
-- last_active_date = día de la TAREA más reciente que contó para la racha (no el día de la aprobación).
-- current NO se resetea en DB; la UI muestra 0 si last_active_date < hoy (Lima) - 1.
create table if not exists streaks (
  user_id           uuid primary key references profiles(id) on delete cascade,
  family_id         uuid not null references families(id) on delete cascade,
  current           int not null default 0,
  best              int not null default 0,
  last_active_date  date,
  updated_at        timestamptz not null default now()
);

-- badges: insignias ganadas por cada hijo.
create table if not exists badges (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references profiles(id) on delete cascade,
  family_id    uuid not null references families(id) on delete cascade,
  badge_slug   text not null,
  earned_at    timestamptz not null default now(),
  notified_at  timestamptz,
  unique (user_id, badge_slug)
);

create index if not exists badges_user_unnotified_idx
  on badges (user_id) where notified_at is null;

-- 2. RLS

alter table points_ledger enable row level security;
alter table streaks       enable row level security;
alter table badges        enable row level security;

drop policy if exists "points_ledger select family" on points_ledger;
create policy "points_ledger select family"
  on points_ledger for select
  using (family_id = auth_family_id()
    and (auth_role() = 'padre' or user_id = auth.uid()));

drop policy if exists "streaks select family" on streaks;
create policy "streaks select family"
  on streaks for select
  using (family_id = auth_family_id()
    and (auth_role() = 'padre' or user_id = auth.uid()));

drop policy if exists "badges select family" on badges;
create policy "badges select family"
  on badges for select
  using (family_id = auth_family_id()
    and (auth_role() = 'padre' or user_id = auth.uid()));

drop policy if exists "badges update notified own" on badges;
create policy "badges update notified own"
  on badges for update
  using (user_id = auth.uid() and family_id = auth_family_id())
  with check (user_id = auth.uid() and family_id = auth_family_id());

-- No se crean policies de INSERT/DELETE.

-- 3. Guardián de badges: el UPDATE solo puede tocar notified_at.

create or replace function badges_guard_update()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.user_id     is distinct from new.user_id
     or old.family_id is distinct from new.family_id
     or old.badge_slug is distinct from new.badge_slug
     or old.earned_at  is distinct from new.earned_at then
    raise exception 'Solo se puede actualizar notified_at';
  end if;
  return new;
end;
$$;

drop trigger if exists badges_guard_update_trigger on badges;
create trigger badges_guard_update_trigger
  before update on badges
  for each row
  execute function badges_guard_update();

-- 4. award_on_approval: puntos, racha e insignias al aprobar (done → approved).
-- Insignias permanentes: una vez otorgadas no se quitan.

create or replace function award_on_approval()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  day_offsets constant jsonb := '{"mon":0,"tue":1,"wed":2,"thu":3,"fri":4,"sat":5,"sun":6}'::jsonb;
  hoy_lima               date := (now() at time zone 'America/Lima')::date;
  fecha_tarea            date;
  prev_date              date;
  prev_current           int;
  nuevo_current          int;
  avanza_racha           boolean;
  last_active_date_nuevo date;
  bonus                  int;
  tareas_semana          int;
  completions_hijo       int;
begin
  -- Día en que el HIJO hizo la tarea: lunes de week_key + offset del day.
  fecha_tarea := (new.week_key::date + (day_offsets->>new.day)::int);

  if fecha_tarea is null then
    raise exception 'day inválido en task_completions: %', new.day;
  end if;

  -- Clamp: una tarea "futura" no contamina la racha.
  fecha_tarea := least(fecha_tarea, hoy_lima);

  -- Asegurar que existe la fila de streaks del hijo (lazy create).
  insert into streaks (user_id, family_id, current, best, last_active_date)
  values (new.user_id, new.family_id, 0, 0, null)
  on conflict (user_id) do nothing;

  -- Leer estado con lock: serializa aprobaciones simultáneas del mismo hijo.
  select last_active_date, current into prev_date, prev_current
  from streaks where user_id = new.user_id for update;

  -- La racha solo avanza con un día de tarea posterior al último contabilizado.
  -- Primera aprobación de un hijo nuevo: prev_date null → current 1 → 10 + 5 = 15 pts.
  -- Limitación conocida: aprobaciones fuera de orden cronológico no extienden la racha hacia atrás.
  -- Caso: hijo trabaja lun-mié, padre aprueba primero la del miércoles → racha=1 y lun/mar ya no cuentan.
  -- Mejora futura: trackear días contabilizados o forzar revisión en orden cronológico.
  if fecha_tarea > coalesce(prev_date, '1900-01-01'::date) then
    if fecha_tarea = prev_date + 1 then
      nuevo_current := prev_current + 1;
    else
      nuevo_current := 1;
    end if;
    avanza_racha := true;
    last_active_date_nuevo := fecha_tarea;
  else
    nuevo_current := prev_current;
    avanza_racha := false;
    last_active_date_nuevo := prev_date;
  end if;

  -- 10 pts base siempre.
  insert into points_ledger (user_id, family_id, amount, reason, ref_id)
  values (new.user_id, new.family_id, 10, 'task_approved', new.id)
  on conflict do nothing;

  -- Bonus por racha (5 × current, tope 50): solo cuando la racha avanza.
  if avanza_racha then
    bonus := least(nuevo_current * 5, 50);
    insert into points_ledger (user_id, family_id, amount, reason, ref_id)
    values (new.user_id, new.family_id, bonus, 'streak_bonus', new.id)
    on conflict do nothing;
  end if;

  -- Actualizar racha.
  update streaks set
    current = nuevo_current,
    best = greatest(best, nuevo_current),
    last_active_date = last_active_date_nuevo,
    updated_at = now()
  where user_id = new.user_id;

  -- Insignia: first_task (el trigger es AFTER UPDATE, así que el conteo ya incluye esta fila).
  select count(*) into completions_hijo
  from task_completions
  where user_id = new.user_id and status = 'approved';

  -- >= 1 (no = 1): si el hijo ya tenía aprobaciones previas al deploy de la 008,
  -- el conteo las incluye. El ON CONFLICT asegura que solo se inserte una vez.
  if completions_hijo >= 1 then
    insert into badges (user_id, family_id, badge_slug)
    values (new.user_id, new.family_id, 'first_task')
    on conflict do nothing;
  end if;

  -- Insignia: week_complete (≥5 aprobadas en la misma semana de la tarea).
  -- La insignia puede ganarse una semana después si el padre aprueba en bloque con retraso.
  -- Es aceptable: celebra la semana del trabajo, no la semana de la certificación.
  select count(*) into tareas_semana
  from task_completions
  where user_id = new.user_id
    and status = 'approved'
    and week_key = new.week_key;

  if tareas_semana >= 5 then
    insert into badges (user_id, family_id, badge_slug)
    values (new.user_id, new.family_id, 'week_complete')
    on conflict do nothing;
  end if;

  -- Insignia: 7_day_streak.
  if nuevo_current >= 7 then
    insert into badges (user_id, family_id, badge_slug)
    values (new.user_id, new.family_id, '7_day_streak')
    on conflict do nothing;
  end if;

  -- Insignia: 30_day_streak.
  if nuevo_current >= 30 then
    insert into badges (user_id, family_id, badge_slug)
    values (new.user_id, new.family_id, '30_day_streak')
    on conflict do nothing;
  end if;

  return new;
end;
$$;

-- 5. Trigger

drop trigger if exists task_completions_award on task_completions;
create trigger task_completions_award
  after update on task_completions
  for each row
  when (old.status = 'done' and new.status = 'approved')
  execute function award_on_approval();
