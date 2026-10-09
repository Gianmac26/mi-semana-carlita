-- 1. Agregar week_key (nullable primero para backfill)
alter table mi_mundo_entries add column week_key text;

-- 2. Backfill: usar el lunes de la semana del created_at
update mi_mundo_entries
set week_key = to_char(
  date_trunc('week', created_at at time zone 'America/Lima')::date,
  'YYYY-MM-DD'
)
where week_key is null;

-- 3. NOT NULL después del backfill
alter table mi_mundo_entries alter column week_key set not null;

-- 4. Cambiar unique constraint
alter table mi_mundo_entries drop constraint mi_mundo_entries_family_id_author_id_key_key;
alter table mi_mundo_entries
  add constraint mi_mundo_entries_family_author_key_week_key
  unique (family_id, author_id, key, week_key);

-- 5. Índice para queries por hijo + semana
create index if not exists mi_mundo_author_week_idx
  on mi_mundo_entries (author_id, week_key desc);

-- 6. RLS: agregar DELETE para el hijo (borrar sus propias respuestas)
drop policy if exists "mi_mundo delete" on mi_mundo_entries;
create policy "mi_mundo delete"
  on mi_mundo_entries for delete
  using (family_id = auth_family_id() and author_id = auth.uid());
