-- Tracking de tareas por hijo, con estados y metadata.
-- Fase 1: reemplaza el booleano { taskSlug: true } de weekly_state.state.
-- Los estados ricos (in_progress, overdue) llegan en Fase 2.
create table if not exists task_completions (
  id              uuid primary key default uuid_generate_v4(),
  task_id         uuid not null references tasks(id) on delete cascade,
  family_id       uuid not null references families(id) on delete cascade,
  user_id         uuid not null references profiles(id) on delete cascade,
  week_key        text not null,
  day             text not null
                    check (day in ('mon','tue','wed','thu','fri','sat','sun')),
  status          text not null default 'done'
                    check (status in ('done','approved','rejected')),
  evidence_url    text,
  notes           text,
  completed_at    timestamptz not null default now(),
  reviewed_at     timestamptz,
  reviewed_by     uuid references profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (task_id, user_id, week_key, day)
);

alter table task_completions enable row level security;

-- Padre ve todas las completions de su familia; hijo solo las suyas
-- (mismo criterio que weekly_state).
create policy "task_completions select"
  on task_completions for select
  using (
    family_id = auth_family_id()
    and (auth_role() = 'padre' or user_id = auth.uid())
  );

-- Solo el hijo inserta sus propias completions, siempre como 'done',
-- y solo sobre tareas de su familia.
create policy "hijo can insert own completions"
  on task_completions for insert
  with check (
    family_id = auth_family_id()
    and user_id = auth.uid()
    and auth_role() = 'hijo'
    and status = 'done'
    and exists (select 1 from tasks t where t.id = task_id and t.family_id = auth_family_id())
  );

-- El hijo actualiza sus propias completions mientras no estén aprobadas,
-- y no puede cambiar el status a algo distinto de 'done' (no se autoaprueba).
create policy "hijo can update own unapproved completions"
  on task_completions for update
  using (
    family_id = auth_family_id()
    and user_id = auth.uid()
    and auth_role() = 'hijo'
    and status <> 'approved'
  )
  with check (
    family_id = auth_family_id()
    and user_id = auth.uid()
    and status = 'done'
  );

-- El padre actualiza (aprueba/rechaza) las completions de su familia.
create policy "padre can update family completions"
  on task_completions for update
  using (family_id = auth_family_id() and auth_role() = 'padre')
  with check (family_id = auth_family_id() and auth_role() = 'padre');

-- Solo el hijo borra (desmarca) sus propias completions, si no están aprobadas.
create policy "hijo can delete own completions"
  on task_completions for delete
  using (
    family_id = auth_family_id()
    and user_id = auth.uid()
    and auth_role() = 'hijo'
    and status <> 'approved'
  );

create index if not exists task_completions_user_week_idx
  on task_completions (user_id, week_key);

create index if not exists task_completions_family_week_idx
  on task_completions (family_id, week_key);
