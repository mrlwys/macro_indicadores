create extension if not exists pgcrypto;

create table if not exists public.dashboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  reference_date date not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dashboard_snapshots_reference_date_idx
  on public.dashboard_snapshots (reference_date desc, created_at desc);

create table if not exists public.source_sync_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running',
  sources_tried text[] not null default '{}',
  sources_succeeded text[] not null default '{}',
  error_messages text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_dashboard_snapshots_updated_at on public.dashboard_snapshots;
create trigger trg_dashboard_snapshots_updated_at
before update on public.dashboard_snapshots
for each row
execute function public.set_updated_at();
