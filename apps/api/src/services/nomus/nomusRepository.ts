import { getSupabaseAdminClient } from "../../lib/supabase.js";
import { parseBrDateTime } from "./dateUtils.js";
import type { NomusEndpoint } from "./types.js";

type NomusSyncStateRow = {
  endpoint: string;
  last_max_id: number;
  total_records_synced: number;
  last_sync_started_at: string | null;
  last_sync_finished_at: string | null;
  last_sync_status: string;
  last_error: string | null;
};

export async function getNomusSyncState(endpoint: NomusEndpoint): Promise<NomusSyncStateRow | null> {
  const client = getSupabaseAdminClient();
  if (!client) {
    throw new Error("Supabase não configurado para sincronização do Nomus.");
  }

  const { data, error } = await client
    .from("nomus_sync_state")
    .select("endpoint, last_max_id, total_records_synced, last_sync_started_at, last_sync_finished_at, last_sync_status, last_error")
    .eq("endpoint", endpoint)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return data as NomusSyncStateRow;
}

export async function upsertNomusSyncState(input: {
  endpoint: NomusEndpoint;
  lastMaxId: number;
  totalRecordsSynced: number;
  lastSyncStatus: "success" | "failed";
  lastError: string | null;
  startedAt: string;
  finishedAt: string;
}): Promise<void> {
  const client = getSupabaseAdminClient();
  if (!client) {
    throw new Error("Supabase não configurado para sincronização do Nomus.");
  }

  const { error } = await client.from("nomus_sync_state").upsert(
    {
      endpoint: input.endpoint,
      last_max_id: input.lastMaxId,
      total_records_synced: input.totalRecordsSynced,
      last_sync_started_at: input.startedAt,
      last_sync_finished_at: input.finishedAt,
      last_sync_status: input.lastSyncStatus,
      last_error: input.lastError,
    },
    { onConflict: "endpoint" },
  );

  if (error) {
    throw error;
  }
}

function pickSourceUpdatedAt(payload: Record<string, unknown>): string | null {
  const candidates = [
    payload.dataModificacao,
    payload.dataHoraAbertura,
    payload.dataEmissao,
    payload.dataCompetencia,
    payload.dataHoraCriacao,
    payload.dataCriacao,
    payload.dataHoraLiberacao,
    payload.dataHoraEntrega,
    payload.dataHoraEdicao,
  ];

  for (const candidate of candidates) {
    const parsed = parseBrDateTime(candidate);
    if (parsed) {
      return parsed.toISOString();
    }
  }

  return null;
}

export async function upsertNomusRawRecords(input: {
  endpoint: NomusEndpoint;
  records: Array<Record<string, unknown>>;
}): Promise<number> {
  const client = getSupabaseAdminClient();
  if (!client) {
    throw new Error("Supabase não configurado para sincronização do Nomus.");
  }

  if (input.records.length === 0) {
    return 0;
  }

  const now = new Date().toISOString();
  const rows = input.records
    .map((payload) => {
      const id = Number(payload.id);
      if (!Number.isFinite(id)) {
        return null;
      }

      return {
        endpoint: input.endpoint,
        external_id: id,
        payload,
        source_updated_at: pickSourceUpdatedAt(payload),
        ingested_at: now,
      };
    })
    .filter(Boolean);

  if (rows.length === 0) {
    return 0;
  }

  const { error } = await client.from("nomus_raw_records").upsert(rows as never[], {
    onConflict: "endpoint,external_id",
    ignoreDuplicates: false,
  });

  if (error) {
    throw error;
  }

  return rows.length;
}

export async function loadNomusRawPayloads(endpoint: NomusEndpoint): Promise<Array<Record<string, unknown>>> {
  const client = getSupabaseAdminClient();
  if (!client) {
    throw new Error("Supabase não configurado para sincronização do Nomus.");
  }

  const allRows: Array<Record<string, unknown>> = [];
  const chunkSize = 1000;
  let from = 0;

  while (true) {
    const to = from + chunkSize - 1;
    const { data, error } = await client
      .from("nomus_raw_records")
      .select("payload")
      .eq("endpoint", endpoint)
      .order("external_id", { ascending: false })
      .range(from, to);

    if (error) {
      throw error;
    }

    const rows = (data ?? []) as Array<{ payload: Record<string, unknown> }>;
    if (rows.length === 0) {
      break;
    }

    for (const row of rows) {
      allRows.push(row.payload);
    }

    if (rows.length < chunkSize) {
      break;
    }

    from += chunkSize;
  }

  return allRows;
}
