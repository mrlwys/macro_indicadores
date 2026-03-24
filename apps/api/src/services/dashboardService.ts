import { getSupabaseAdminClient } from "../lib/supabase.js";
import { dashboardDataSchema, dashboardSnapshotSchema } from "../lib/dashboardSchema.js";
import type { DashboardData, DashboardSnapshot } from "../lib/types.js";
import { sampleDashboardData } from "../data/sampleDashboard.js";
import { applyDashboardConfigEntries } from "./dashboardConfigService.js";

function buildFallbackSnapshot(source: string): DashboardSnapshot {
  return {
    source,
    reference_date: new Date().toISOString().slice(0, 10),
    payload: sampleDashboardData,
  };
}

export async function getLatestDashboard(): Promise<DashboardSnapshot> {
  const client = getSupabaseAdminClient();
  const fallback = buildFallbackSnapshot("sample");

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

  try {
    const parsed = dashboardSnapshotSchema.parse(data[0]);
    return {
      ...parsed,
      payload: await applyDashboardConfigEntries({
        payload: parsed.payload,
        referenceDate: parsed.reference_date,
      }),
    };
  } catch (parseError) {
    // eslint-disable-next-line no-console
    console.warn("Latest dashboard snapshot is invalid, falling back to sample.", parseError);
    const fallbackInvalid = buildFallbackSnapshot("sample_invalid_snapshot");
    return {
      ...fallbackInvalid,
      payload: await applyDashboardConfigEntries({
        payload: fallbackInvalid.payload,
        referenceDate: fallbackInvalid.reference_date,
      }),
    };
  }
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

  const validatedPayload = dashboardDataSchema.parse(input.payload);
  const payloadWithConfig = await applyDashboardConfigEntries({
    payload: validatedPayload,
    referenceDate: input.referenceDate,
  });

  const { data, error } = await client
    .from("dashboard_snapshots")
    .insert({
      source: input.source,
      reference_date: input.referenceDate,
      payload: payloadWithConfig,
    })
    .select("id, source, reference_date, payload, created_at")
    .single();

  if (error) {
    throw error;
  }

  return dashboardSnapshotSchema.parse(data);
}
