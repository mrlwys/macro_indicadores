create table if not exists public.dashboard_config_entries (
  id uuid primary key default gen_random_uuid(),
  config_key text not null,
  reference_date date not null,
  value_type text not null check (value_type in ('number', 'boolean', 'text')),
  value_number numeric,
  value_boolean boolean,
  value_text text,
  notes text,
  created_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dashboard_config_entries_value_check check (
    (value_type = 'number' and value_number is not null and value_boolean is null and value_text is null) or
    (value_type = 'boolean' and value_number is null and value_boolean is not null and value_text is null) or
    (value_type = 'text' and value_number is null and value_boolean is null and value_text is not null)
  )
);

create unique index if not exists dashboard_config_entries_key_reference_idx
  on public.dashboard_config_entries (config_key, reference_date);

create index if not exists dashboard_config_entries_reference_idx
  on public.dashboard_config_entries (reference_date desc, created_at desc);

create table if not exists public.dashboard_config_history (
  id uuid primary key default gen_random_uuid(),
  config_entry_id uuid references public.dashboard_config_entries(id) on delete set null,
  action text not null check (action in ('created', 'updated', 'deleted')),
  snapshot jsonb not null,
  acted_by uuid references public.app_users(id) on delete set null,
  acted_at timestamptz not null default now()
);

create index if not exists dashboard_config_history_entry_idx
  on public.dashboard_config_history (config_entry_id, acted_at desc);

drop trigger if exists trg_dashboard_config_entries_updated_at on public.dashboard_config_entries;
create trigger trg_dashboard_config_entries_updated_at
before update on public.dashboard_config_entries
for each row
execute function public.set_updated_at();
