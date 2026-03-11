alter table if exists public.app_users
  add column if not exists full_name text;

update public.app_users
set full_name = 'Administrador'
where username = 'admin'
  and (full_name is null or btrim(full_name) = '');

insert into public.app_users (full_name, username, password_hash, access_level, is_active)
values ('Administrador', 'admin', '$2b$10$F46xkjKLRPn1ggiVxAEanO0326F9fv/iKQQqSHtgbF/z6NmyFsuEe', 'admin', true)
on conflict (username) do update
set
  full_name = excluded.full_name,
  access_level = excluded.access_level,
  is_active = excluded.is_active;
