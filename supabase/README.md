# Supabase notes

1. Run migration `supabase/migrations/20260311000100_init.sql`.
2. Run migration `supabase/migrations/20260311000200_users_auth.sql`.
3. Run migration `supabase/migrations/20260311000300_users_profile_fields.sql`.
4. Run seed `supabase/seed.sql` (optional for dashboard snapshot).
5. Default app user from migration: `admin` / `admin`.
6. Use service role key in API only (`SUPABASE_SERVICE_ROLE_KEY`).
7. Frontend should never receive service role key.
