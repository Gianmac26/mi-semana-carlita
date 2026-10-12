-- Aprobación/rechazo del padre sobre task_completions.

-- 1. Columna comment para el feedback del padre.
alter table task_completions
  add column if not exists comment text;

-- 2. Índice para la cola del padre.
create index if not exists task_completions_family_status_idx
  on task_completions (family_id, status);

-- 3. Trigger de protección de columnas.
-- RLS no puede restringir columnas: este trigger decide qué puede cambiar cada rol.
-- Sin rol (service role / SQL Editor / seed) no aplica ninguna restricción.
create or replace function enforce_completion_review_columns()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth_role() = 'hijo' then
    -- El hijo no puede tocar campos de identidad ni de review.
    new.task_id := old.task_id;
    new.user_id := old.user_id;
    new.family_id := old.family_id;
    new.week_key := old.week_key;
    new.day := old.day;
    new.created_at := old.created_at;

    -- Excepción: remarcar tras rechazo limpia el review (fresh start)
    -- y cuenta como una completion nueva.
    if old.status = 'rejected' and new.status = 'done' then
      new.completed_at := now();
      new.comment := null;
      new.reviewed_at := null;
      new.reviewed_by := null;
    else
      new.completed_at := old.completed_at;
      new.comment := old.comment;
      new.reviewed_at := old.reviewed_at;
      new.reviewed_by := old.reviewed_by;
    end if;
  elsif auth_role() = 'padre' then
    -- El padre solo revisa: no puede tocar la completion en sí.
    new.task_id := old.task_id;
    new.user_id := old.user_id;
    new.family_id := old.family_id;
    new.week_key := old.week_key;
    new.day := old.day;
    new.completed_at := old.completed_at;
    new.created_at := old.created_at;
    new.notes := old.notes;
    new.evidence_url := old.evidence_url;

    -- Solo se puede revisar desde 'done'.
    if old.status <> 'done' then
      raise exception 'Solo se puede revisar una completion en estado done';
    end if;
    if new.status not in ('approved', 'rejected') then
      raise exception 'El padre solo puede aprobar o rechazar';
    end if;

    -- reviewed_at/reviewed_by los fija el servidor (no se aceptan del cliente).
    new.reviewed_at := now();
    new.reviewed_by := auth.uid();
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists task_completions_review_guard on task_completions;
create trigger task_completions_review_guard
  before update on task_completions
  for each row
  execute function enforce_completion_review_columns();
