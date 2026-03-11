# Supabase notes

1. Run migration `supabase/migrations/20260311000100_init.sql` in your Supabase SQL editor.
2. Run seed `supabase/seed.sql` (optional but recommended for first load).
3. Use service role key in API only (`SUPABASE_SERVICE_ROLE_KEY`).
4. Frontend should never receive service role key.
