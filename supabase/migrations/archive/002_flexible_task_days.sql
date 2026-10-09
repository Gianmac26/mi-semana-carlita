-- Replace the rigid weekday/saturday split with a flexible per-day assignment,
-- so a task can repeat Mon–Fri, happen once a week (e.g. only Tuesdays), or any
-- other combination of days.

alter table tasks add column days text[] not null default '{}';

update tasks set days = case
  when day_type = 'weekday'  then array['mon','tue','wed','thu','fri']
  when day_type = 'saturday' then array['sat']
  else '{}'
end;

alter table tasks drop column day_type;

alter table tasks add constraint tasks_days_valid check (
  days <@ array['mon','tue','wed','thu','fri','sat','sun']
);
