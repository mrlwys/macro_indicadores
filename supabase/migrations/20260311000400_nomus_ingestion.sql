create table if not exists public.nomus_raw_records (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null,
  external_id bigint not null,
  payload jsonb not null,
  source_updated_at timestamptz,
  ingested_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (endpoint, external_id)
);

create index if not exists nomus_raw_records_endpoint_idx
  on public.nomus_raw_records (endpoint);

create index if not exists nomus_raw_records_source_updated_idx
  on public.nomus_raw_records (endpoint, source_updated_at desc nulls last);

create index if not exists nomus_raw_records_external_id_idx
  on public.nomus_raw_records (endpoint, external_id desc);

create table if not exists public.nomus_sync_state (
  endpoint text primary key,
  last_max_id bigint not null default 0,
  total_records_synced bigint not null default 0,
  last_sync_started_at timestamptz,
  last_sync_finished_at timestamptz,
  last_sync_status text not null default 'never',
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_nomus_raw_records_updated_at on public.nomus_raw_records;
create trigger trg_nomus_raw_records_updated_at
before update on public.nomus_raw_records
for each row
execute function public.set_updated_at();

drop trigger if exists trg_nomus_sync_state_updated_at on public.nomus_sync_state;
create trigger trg_nomus_sync_state_updated_at
before update on public.nomus_sync_state
for each row
execute function public.set_updated_at();
