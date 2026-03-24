import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

type AnySupabaseClient = SupabaseClient<any, string, string, any, any>;

let client: AnySupabaseClient | null = null;

export function getSupabaseAdminClient(): AnySupabaseClient | null {
  if (!env.SUPABASE_URL) {
    return null;
  }

  const token = env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_ANON_KEY;
  if (!token) {
    return null;
  }

  if (!client) {
    client = createClient(env.SUPABASE_URL, token, {
      db: { schema: env.SUPABASE_SCHEMA },
      auth: { persistSession: false },
    });
  }

  return client;
}
