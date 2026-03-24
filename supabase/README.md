# Supabase notes

1. Run migration `supabase/migrations/20260311000100_init.sql`.
2. Run migration `supabase/migrations/20260311000200_users_auth.sql`.
3. Run migration `supabase/migrations/20260311000300_users_profile_fields.sql`.
4. Run migration `supabase/migrations/20260311000400_nomus_ingestion.sql`.
5. Run migration `supabase/migrations/20260316000100_source_sync_runs_lock.sql`.
6. Run seed `supabase/seed.sql` (optional for dashboard snapshot).
7. Default app user from migration: `admin` / `admin`.
8. Use service role key in API only (`SUPABASE_SERVICE_ROLE_KEY`).
9. Frontend should never receive service role key.
