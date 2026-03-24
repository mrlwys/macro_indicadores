import { getSupabaseAdminClient } from "../lib/supabase.js";
import { env } from "../config/env.js";

export type SyncRunStatus = "running" | "success" | "failed" | "degraded";

export type SyncRunRecord = {
  id: string;
  sync_key: string;
  status: SyncRunStatus;
};

function staleBeforeIso(): string {
  return new Date(Date.now() - env.SYNC_LOCK_TTL_MINUTES * 60 * 1000).toISOString();
}

export async function startSyncRun(input: {
  syncKey: string;
  metadata?: Record<string, unknown>;
}): Promise<SyncRunRecord> {
  const client = getSupabaseAdminClient();
  if (!client) {
    throw new Error("Supabase is not configured");
  }

  const { error: cleanupError } = await client
    .from("source_sync_runs")
    .delete()
    .eq("sync_key", input.syncKey)
    .eq("status", "running")
    .is("finished_at", null)
    .lt("started_at", staleBeforeIso());

  if (cleanupError) {
    throw cleanupError;
  }

  const { data, error } = await client
    .from("source_sync_runs")
    .insert({
      sync_key: input.syncKey,
      status: "running",
      metadata: input.metadata ?? {},
    })
    .select("id, sync_key, status")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("SYNC_ALREADY_RUNNING");
    }

    throw error;
  }

  return data as SyncRunRecord;
}

export async function finishSyncRun(input: {
  runId: string;
  status: Exclude<SyncRunStatus, "running">;
  sourcesTried: string[];
  sourcesSucceeded: string[];
  errors: string[];
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const client = getSupabaseAdminClient();
  if (!client) {
    throw new Error("Supabase is not configured");
  }

  const { error } = await client
    .from("source_sync_runs")
    .update({
      finished_at: new Date().toISOString(),
      status: input.status,
      sources_tried: input.sourcesTried,
      sources_succeeded: input.sourcesSucceeded,
      error_messages: input.errors,
      metadata: input.metadata ?? {},
    })
    .eq("id", input.runId);

  if (error) {
    throw error;
  }
}
