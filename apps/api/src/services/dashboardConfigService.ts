import { getSupabaseAdminClient } from "../lib/supabase.js";
import type { DashboardData } from "../lib/types.js";

export type DashboardConfigValueType = "number" | "boolean" | "text";

export type DashboardConfigDefinition = {
  key: string;
  label: string;
  description: string;
  section: string;
  value_type: DashboardConfigValueType;
  input_type: "currency" | "number" | "boolean" | "text";
};

export type DashboardConfigEntry = {
  id: string;
  config_key: string;
  reference_date: string;
  value_type: DashboardConfigValueType;
  value_number: number | null;
  value_boolean: boolean | null;
  value_text: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type DashboardConfigHistoryItem = {
  id: string;
  config_entry_id: string | null;
  action: "created" | "updated" | "deleted";
  snapshot: DashboardConfigEntry;
  acted_by: string | null;
  acted_at: string;
};

type DashboardConfigEntryRow = {
  id: string;
  config_key: string;
  reference_date: string;
  value_type: DashboardConfigValueType;
  value_number: number | string | null;
  value_boolean: boolean | null;
  value_text: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type DashboardConfigHistoryRow = {
  id: string;
  config_entry_id: string | null;
  action: "created" | "updated" | "deleted";
  snapshot: DashboardConfigEntryRow;
  acted_by: string | null;
  acted_at: string;
};

export const DASHBOARD_CONFIG_DEFINITIONS: DashboardConfigDefinition[] = [
  {
    key: "financeiro.meta_anual",
    label: "Meta anual de faturamento",
    description: "Valor anual usado no cabeçalho e nas metas financeiras do dashboard.",
    section: "Financeiro",
    value_type: "number",
    input_type: "currency",
  },
];

function normalizeEntry(row: DashboardConfigEntryRow): DashboardConfigEntry {
  return {
    id: row.id,
    config_key: row.config_key,
    reference_date: row.reference_date,
    value_type: row.value_type,
    value_number: row.value_number === null ? null : Number(row.value_number),
    value_boolean: row.value_boolean,
    value_text: row.value_text,
    notes: row.notes,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function toSnapshot(row: DashboardConfigEntry): DashboardConfigEntry {
  return {
    ...row,
    value_number: row.value_number === null ? null : Number(row.value_number),
  };
}

async function appendHistory(input: {
  configEntry: DashboardConfigEntry;
  action: "created" | "updated" | "deleted";
  actedBy: string | null;
}) {
  const client = getSupabaseAdminClient();
  if (!client) {
    throw new Error("Supabase is not configured");
  }

  const { error } = await client.from("dashboard_config_history").insert({
    config_entry_id: input.configEntry.id,
    action: input.action,
    snapshot: toSnapshot(input.configEntry),
    acted_by: input.actedBy,
  });

  if (error) {
    throw error;
  }
}

export function listDashboardConfigDefinitions(): DashboardConfigDefinition[] {
  return DASHBOARD_CONFIG_DEFINITIONS.map((item) => ({ ...item }));
}

export async function listDashboardConfigEntries(): Promise<DashboardConfigEntry[]> {
  const client = getSupabaseAdminClient();
  if (!client) {
    throw new Error("Supabase is not configured");
  }

  const { data, error } = await client
    .from("dashboard_config_entries")
    .select("id, config_key, reference_date, value_type, value_number, value_boolean, value_text, notes, created_by, created_at, updated_at")
    .order("config_key", { ascending: true })
    .order("reference_date", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as DashboardConfigEntryRow[]).map((row) => normalizeEntry(row));
}

export async function listDashboardConfigHistory(): Promise<DashboardConfigHistoryItem[]> {
  const client = getSupabaseAdminClient();
  if (!client) {
    throw new Error("Supabase is not configured");
  }

  const { data, error } = await client
    .from("dashboard_config_history")
    .select("id, config_entry_id, action, snapshot, acted_by, acted_at")
    .order("acted_at", { ascending: false })
    .limit(200);

  if (error) {
    throw error;
  }

  return ((data ?? []) as DashboardConfigHistoryRow[]).map((row) => ({
    id: row.id,
    config_entry_id: row.config_entry_id,
    action: row.action,
    snapshot: normalizeEntry(row.snapshot),
    acted_by: row.acted_by,
    acted_at: row.acted_at,
  }));
}

export async function createDashboardConfigEntry(input: {
  configKey: string;
  referenceDate: string;
  valueType: DashboardConfigValueType;
  valueNumber: number | null;
  valueBoolean: boolean | null;
  valueText: string | null;
  notes: string | null;
  actedBy: string | null;
}): Promise<DashboardConfigEntry> {
  const client = getSupabaseAdminClient();
  if (!client) {
    throw new Error("Supabase is not configured");
  }

  const { data, error } = await client
    .from("dashboard_config_entries")
    .insert({
      config_key: input.configKey,
      reference_date: input.referenceDate,
      value_type: input.valueType,
      value_number: input.valueNumber,
      value_boolean: input.valueBoolean,
      value_text: input.valueText,
      notes: input.notes,
      created_by: input.actedBy,
    })
    .select("id, config_key, reference_date, value_type, value_number, value_boolean, value_text, notes, created_by, created_at, updated_at")
    .single();

  if (error) {
    throw error;
  }

  const entry = normalizeEntry(data as DashboardConfigEntryRow);
  await appendHistory({
    configEntry: entry,
    action: "created",
    actedBy: input.actedBy,
  });
  return entry;
}

export async function updateDashboardConfigEntry(input: {
  id: string;
  configKey: string;
  referenceDate: string;
  valueType: DashboardConfigValueType;
  valueNumber: number | null;
  valueBoolean: boolean | null;
  valueText: string | null;
  notes: string | null;
  actedBy: string | null;
}): Promise<DashboardConfigEntry | null> {
  const client = getSupabaseAdminClient();
  if (!client) {
    throw new Error("Supabase is not configured");
  }

  const { data, error } = await client
    .from("dashboard_config_entries")
    .update({
      config_key: input.configKey,
      reference_date: input.referenceDate,
      value_type: input.valueType,
      value_number: input.valueNumber,
      value_boolean: input.valueBoolean,
      value_text: input.valueText,
      notes: input.notes,
    })
    .eq("id", input.id)
    .select("id, config_key, reference_date, value_type, value_number, value_boolean, value_text, notes, created_by, created_at, updated_at")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  const entry = normalizeEntry(data as DashboardConfigEntryRow);
  await appendHistory({
    configEntry: entry,
    action: "updated",
    actedBy: input.actedBy,
  });
  return entry;
}

export async function deleteDashboardConfigEntry(input: {
  id: string;
  actedBy: string | null;
}): Promise<boolean> {
  const client = getSupabaseAdminClient();
  if (!client) {
    throw new Error("Supabase is not configured");
  }

  const { data, error } = await client
    .from("dashboard_config_entries")
    .delete()
    .eq("id", input.id)
    .select("id, config_key, reference_date, value_type, value_number, value_boolean, value_text, notes, created_by, created_at, updated_at")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return false;
    }
    throw error;
  }

  const entry = normalizeEntry(data as DashboardConfigEntryRow);
  await appendHistory({
    configEntry: entry,
    action: "deleted",
    actedBy: input.actedBy,
  });
  return true;
}

function pickConfigEntryForReferenceDate(entries: DashboardConfigEntry[], referenceDate: string): DashboardConfigEntry | null {
  if (entries.length === 0) {
    return null;
  }

  const targetDate = new Date(`${referenceDate}T00:00:00Z`);
  const targetYear = targetDate.getUTCFullYear();
  const exactYear = entries.find((entry) => new Date(`${entry.reference_date}T00:00:00Z`).getUTCFullYear() === targetYear);
  if (exactYear) {
    return exactYear;
  }

  const sorted = [...entries].sort((a, b) => b.reference_date.localeCompare(a.reference_date));
  const latestBeforeOrEqual = sorted.find((entry) => entry.reference_date <= referenceDate);
  return latestBeforeOrEqual ?? sorted[0];
}

export async function applyDashboardConfigEntries(input: {
  payload: DashboardData;
  referenceDate: string;
}): Promise<DashboardData> {
  const client = getSupabaseAdminClient();
  if (!client) {
    return input.payload;
  }

  const entries = await listDashboardConfigEntries();
  if (entries.length === 0) {
    return input.payload;
  }

  const grouped = entries.reduce((acc, entry) => {
    const list = acc.get(entry.config_key) ?? [];
    list.push(entry);
    acc.set(entry.config_key, list);
    return acc;
  }, new Map<string, DashboardConfigEntry[]>());

  const payload = structuredClone(input.payload);
  const appliedKeys: string[] = [];

  const metaAnualEntry = pickConfigEntryForReferenceDate(grouped.get("financeiro.meta_anual") ?? [], input.referenceDate);
  if (metaAnualEntry && metaAnualEntry.value_type === "number" && metaAnualEntry.value_number !== null) {
    payload.financeiro.meta_anual = Number(metaAnualEntry.value_number);
    appliedKeys.push("financeiro.meta_anual");
  }

  if (appliedKeys.length === 0) {
    return payload;
  }

  if (payload._meta) {
    payload._meta.generated_from = Array.from(new Set([...payload._meta.generated_from, ...appliedKeys.map((item) => `config:${item}`)]));
    payload._meta.source_coverage = {
      ...payload._meta.source_coverage,
      config: {
        applied_keys: appliedKeys,
      },
    };

    const financeiroCoverage = payload._meta.block_coverage.financeiro;
    financeiroCoverage.sources = Array.from(new Set([...financeiroCoverage.sources, ...appliedKeys.map((item) => `config:${item}`)]));
    financeiroCoverage.real_fields = Array.from(new Set([...financeiroCoverage.real_fields, ...appliedKeys]));
    financeiroCoverage.mock_fields = financeiroCoverage.mock_fields.filter((field) => !appliedKeys.includes(field));
  }

  return payload;
}
