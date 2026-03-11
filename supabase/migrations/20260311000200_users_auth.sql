create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  access_level text not null check (access_level in ('admin', 'user')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists app_users_access_level_idx
  on public.app_users (access_level);

drop trigger if exists trg_app_users_updated_at on public.app_users;
create trigger trg_app_users_updated_at
before update on public.app_users
for each row
execute function public.set_updated_at();

insert into public.app_users (username, password_hash, access_level, is_active)
values ('admin', '$2b$10$F46xkjKLRPn1ggiVxAEanO0326F9fv/iKQQqSHtgbF/z6NmyFsuEe', 'admin', true)
on conflict (username) do nothing;
