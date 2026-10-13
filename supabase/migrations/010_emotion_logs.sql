-- 010 — Tracking emocional (Módulo 2, Fase 4, Parte 1).
-- 1 registro por día por hijo (mood 1-5 + emoción de lista cerrada + nota privada).
-- El padre NUNCA lee emotion_logs: solo ve etiquetas semanales vía get_emotion_trend().
-- La insignia first_emotion_log se otorga por trigger al primer registro (sin puntos).

-- 1. Tabla

-- emotion_logs: 1 registro por día por usuario.
-- mood: 1-5 (1 = muy mal, 5 = muy bien).
-- emotion: lista cerrada de 8.
-- note: privada del hijo. El padre NUNCA la ve (ni el registro completo).
create table if not exists emotion_logs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  family_id   uuid not null references families(id) on delete cascade,
  log_date    date not null,
  mood        int not null check (mood between 1 and 5),
  emotion     text not null check (emotion in (
                'alegria','tristeza','enojo','miedo',
                'calma','ansiedad','orgullo','cansancio'
              )),
  note        text check (note is null or char_length(note) <= 500),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, log_date)
);

create index if not exists emotion_logs_user_date_idx
  on emotion_logs (user_id, log_date desc);

-- 2. RLS

alter table emotion_logs enable row level security;

-- Solo el propio hijo lee sus logs. El padre NUNCA los lee directamente.
drop policy if exists "emotion_logs select own" on emotion_logs;
create policy "emotion_logs select own"
  on emotion_logs for select
  using (user_id = auth.uid());

-- Solo el propio hijo inserta, y SOLO del día actual (Lima).
drop policy if exists "emotion_logs insert own today" on emotion_logs;
create policy "emotion_logs insert own today"
  on emotion_logs for insert
  with check (
    user_id = auth.uid()
    and family_id = auth_family_id()
    and auth_role() = 'hijo'
    and log_date = (now() at time zone 'America/Lima')::date
  );

-- Solo el propio hijo actualiza, y SOLO del día actual (Lima).
drop policy if exists "emotion_logs update own today" on emotion_logs;
create policy "emotion_logs update own today"
  on emotion_logs for update
  using (
    user_id = auth.uid()
    and log_date = (now() at time zone 'America/Lima')::date
  )
  with check (
    user_id = auth.uid()
    and family_id = auth_family_id()
    and log_date = (now() at time zone 'America/Lima')::date
  );

-- Sin DELETE: histórico inmutable.

-- 3. Trigger: updated_at (y created_at fijo)

create or replace function emotion_logs_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists emotion_logs_updated_at on emotion_logs;
create trigger emotion_logs_updated_at
  before update on emotion_logs
  for each row
  execute function emotion_logs_set_updated_at();

-- 4. Trigger: insignia first_emotion_log (sin puntos)

create or replace function award_first_emotion_log_badge()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into badges (user_id, family_id, badge_slug)
  values (new.user_id, new.family_id, 'first_emotion_log')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists emotion_logs_first_badge on emotion_logs;
create trigger emotion_logs_first_badge
  after insert on emotion_logs
  for each row
  execute function award_first_emotion_log_badge();

-- 5. RPC: tendencia semanal agregada para el padre

-- Devuelve SOLO etiquetas por semana calendario. Sin avg_mood, sin count.
-- Diseñado para que el padre NO pueda reconstruir los moods diarios.
create or replace function get_emotion_trend(p_user_id uuid, p_weeks_back int default 1)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_family_id uuid := auth_family_id();
  v_role      text := auth_role();
  v_result    jsonb := '[]'::jsonb;
  v_week_start date;
  v_week_end   date;
  v_count      int;
  v_avg        numeric;
  v_label      text;
  v_i          int;
begin
  if v_family_id is null then
    raise exception 'Usuario sin familia';
  end if;

  if v_role is distinct from 'padre' then
    raise exception 'Solo un padre puede consultar la tendencia emocional';
  end if;

  if p_weeks_back < 1 or p_weeks_back > 8 then
    raise exception 'p_weeks_back debe estar entre 1 y 8';
  end if;

  if not exists (
    select 1 from profiles
    where id = p_user_id and family_id = v_family_id and role = 'hijo'
  ) then
    raise exception 'Usuario no válido para esta familia';
  end if;

  for v_i in 0..(p_weeks_back - 1) loop
    v_week_start := date_trunc('week', (now() at time zone 'America/Lima')::date)::date - (v_i * 7);
    v_week_end   := v_week_start + 6;

    select count(*), coalesce(avg(mood), 0)
    into v_count, v_avg
    from emotion_logs
    where user_id = p_user_id
      and log_date between v_week_start and v_week_end;

    if v_count = 0 then
      v_label := 'sin-registros';
    elsif v_count < 3 then
      v_label := 'pocos-registros';
    elsif v_avg >= 4.0 then
      v_label := 'tranquila';
    elsif v_avg >= 3.0 then
      v_label := 'mixta';
    elsif v_avg >= 2.0 then
      v_label := 'dificil';
    else
      v_label := 'muy-dificil';
    end if;

    v_result := v_result || jsonb_build_object(
      'week_start', v_week_start,
      'week_end',   v_week_end,
      'label',      v_label
    );
  end loop;

  return jsonb_build_object(
    'user_id', p_user_id,
    'weeks',   v_result
  );
end;
$$;

revoke execute on function get_emotion_trend(uuid, int) from public, anon;
grant execute on function get_emotion_trend(uuid, int) to authenticated;
