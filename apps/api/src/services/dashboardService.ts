import { getSupabaseAdminClient } from "../lib/supabase.js";
import type { DashboardData, DashboardSnapshot } from "../lib/types.js";
import { sampleDashboardData } from "../data/sampleDashboard.js";

export async function getLatestDashboard(): Promise<DashboardSnapshot> {
  const client = getSupabaseAdminClient();
  const fallback: DashboardSnapshot = {
    source: "sample",
    reference_date: new Date().toISOString().slice(0, 10),
    payload: sampleDashboardData,
  };

  if (!client) {
    return fallback;
  }

  const { data, error } = await client
    .from("dashboard_snapshots")
    .select("id, source, reference_date, payload, created_at")
    .order("reference_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return fallback;
  }

  const latest = data[0] as DashboardSnapshot;
  return latest;
}

export async function createDashboardSnapshot(input: {
  source: string;
  referenceDate: string;
  payload: DashboardData;
}): Promise<DashboardSnapshot | null> {
  const client = getSupabaseAdminClient();
  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from("dashboard_snapshots")
    .insert({
      source: input.source,
      reference_date: input.referenceDate,
      payload: input.payload,
    })
    .select("id, source, reference_date, payload, created_at")
    .single();

  if (error) {
    throw error;
  }

  return data as DashboardSnapshot;
}
