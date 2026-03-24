alter table if exists public.source_sync_runs
  add column if not exists sync_key text not null default 'default';

create index if not exists source_sync_runs_sync_key_idx
  on public.source_sync_runs (sync_key, started_at desc);

create unique index if not exists source_sync_runs_active_unique_idx
  on public.source_sync_runs (sync_key)
  where finished_at is null and status = 'running';
