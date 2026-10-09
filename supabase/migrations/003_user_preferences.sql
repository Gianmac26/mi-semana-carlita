-- user_preferences: one row per user, stores theme + avatar settings
create table if not exists user_preferences (
  user_id       uuid primary key references profiles(id) on delete cascade,
  theme_palette text not null default 'vibrante',
  theme_mode    text not null default 'auto' check (theme_mode in ('light', 'dark', 'auto')),
  avatar_url    text,
  avatar_type   text default 'preset' check (avatar_type in ('preset', 'photo')),
  updated_at    timestamptz default now()
);

alter table user_preferences enable row level security;

-- Each user can only read/write their own row
create policy "user_preferences_select" on user_preferences
  for select using (user_id = auth.uid());

create policy "user_preferences_insert" on user_preferences
  for insert with check (user_id = auth.uid());

create policy "user_preferences_update" on user_preferences
  for update using (user_id = auth.uid());

-- Trigger: when a profile is created, insert default preferences based on role
create or replace function create_user_preferences()
returns trigger language plpgsql security definer as $$
begin
  insert into user_preferences (user_id, theme_palette, theme_mode)
  values (
    new.id,
    case new.role
      when 'padre' then 'azul_sereno'
      else 'vibrante'
    end,
    'auto'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_profile_created
  after insert on profiles
  for each row execute function create_user_preferences();
