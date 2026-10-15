-- 011 — Tracking emocional: modelo Ekman (6 emociones básicas + intensidad 1-5).
-- La escala 1-5 deja de ser bienestar y pasa a ser INTENSIDAD de la emoción elegida.
-- El bienestar se deriva con emotion_wellbeing(); get_emotion_trend() promedia ese valor.
-- emotion_wellbeing() debe coincidir con emotionWellbeing() en lib/emotions.ts.

-- 1. Limpieza
-- Solo había datos de prueba (la Parte 2 no estaba desplegada); verificado antes de correr con:
--   select user_id, count(*) from emotion_logs group by user_id;
delete from emotion_logs;

-- 2. mood → intensity
-- El check inline de la 010 (emotion_logs_mood_check, "between 1 and 5") se conserva:
-- Postgres actualiza la referencia a la columna al renombrarla. Su nombre no cambia.
alter table emotion_logs rename column mood to intensity;

-- 3. Lista cerrada de emociones: las 6 básicas de Ekman
alter table emotion_logs drop constraint if exists emotion_logs_emotion_check;
alter table emotion_logs add constraint emotion_logs_emotion_check
  check (emotion in ('alegria','tristeza','miedo','ira','asco','sorpresa'));

-- 4. Bienestar derivado (1-5). Tabla provisional, pendiente de validar con un psicólogo.
--   tristeza, miedo, ira, asco: intensidad 1-2 → 3 · 3-4 → 2 · 5 → 1
--   alegria:                    intensidad 1-2 → 4 · 3-5 → 5
--   sorpresa:                   cualquier intensidad → 3
create or replace function emotion_wellbeing(p_emotion text, p_intensity int)
returns int
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when p_emotion in ('tristeza','miedo','ira','asco') then
      case when p_intensity <= 2 then 3 when p_intensity <= 4 then 2 else 1 end
    when p_emotion = 'alegria' then
      case when p_intensity <= 2 then 4 else 5 end
    else 3
  end;
$$;

-- 5. RPC: tendencia semanal agregada para el padre (idéntica a la 010 salvo el promedio)

-- Devuelve SOLO etiquetas por semana calendario. Sin promedio, sin count.
-- Diseñado para que el padre NO pueda reconstruir los registros diarios.
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

    select count(*), coalesce(avg(emotion_wellbeing(emotion, intensity)), 0)
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
