import { env } from "../../config/env.js";
import type { DashboardData } from "../../lib/types.js";
import {
  getNomusSyncState,
  loadNomusRawPayloads,
  upsertNomusRawRecords,
  upsertNomusSyncState,
} from "./nomusRepository.js";
import { NomusClient } from "./nomusClient.js";
import { buildDashboardFromNomus } from "./nomusDashboardMapper.js";
import {
  NOMUS_SUPPORTED_ENDPOINTS,
  type NomusEndpoint,
  type NomusSyncEndpointResult,
  type NomusSyncRunResult,
} from "./types.js";

const NOMUS_PAGE_SIZE = 50;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const maybeMessage = (error as { message?: unknown }).message;
    const maybeCode = (error as { code?: unknown }).code;

    if (typeof maybeMessage === "string" && maybeMessage.trim()) {
      if (typeof maybeCode === "string" && maybeCode.trim()) {
        return `${maybeCode}: ${maybeMessage}`;
      }
      return maybeMessage;
    }
  }

  return String(error);
}

function getEnabledEndpoints(): NomusEndpoint[] {
  const configured = env.NOMUS_ENABLED_ENDPOINTS;
  const supported = new Set<string>(NOMUS_SUPPORTED_ENDPOINTS);

  const filtered = configured.filter((endpoint) => supported.has(endpoint));
  if (filtered.length > 0) {
    return filtered as NomusEndpoint[];
  }

  return [...NOMUS_SUPPORTED_ENDPOINTS];
}

function parseValidRecords(input: unknown[]): Array<Record<string, unknown>> {
  return input.filter((item) => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const id = Number((item as { id?: unknown }).id);
    return Number.isFinite(id);
  }) as Array<Record<string, unknown>>;
}

function getMinExternalId(records: Array<Record<string, unknown>>): number | null {
  if (records.length === 0) {
    return null;
  }

  return Math.min(...records.map((item) => Number(item.id)).filter((id) => Number.isFinite(id)));
}

function buildIncrementalIdQuery(input: {
  lastMaxIdBefore: number;
  replayMinId: number | null;
}): string {
  if (!input.replayMinId || input.replayMinId <= input.lastMaxIdBefore) {
    return `id>${input.lastMaxIdBefore}`;
  }

  return `id>${input.lastMaxIdBefore};id<${input.replayMinId}`;
}

async function replayRecentPages(input: {
  client: NomusClient;
  endpoint: NomusEndpoint;
  lastMaxIdBefore: number;
}): Promise<{
  recordsFetched: number;
  newRecordsFetched: number;
  pagesFetched: number;
  replayMinId: number | null;
  replayMaxId: number;
}> {
  if (input.lastMaxIdBefore <= 0 || env.NOMUS_INCREMENTAL_LOOKBACK_PAGES <= 0) {
    return {
      recordsFetched: 0,
      newRecordsFetched: 0,
      pagesFetched: 0,
      replayMinId: null,
      replayMaxId: input.lastMaxIdBefore,
    };
  }

  let page = env.NOMUS_PAGE_START;
  let recordsFetched = 0;
  let newRecordsFetched = 0;
  let pagesFetched = 0;
  let replayMinId: number | null = null;
  let replayMaxId = input.lastMaxIdBefore;

  for (let replayIndex = 0; replayIndex < env.NOMUS_INCREMENTAL_LOOKBACK_PAGES; replayIndex += 1) {
    const recordsRaw = await input.client.listEndpoint({
      endpoint: input.endpoint,
      page,
    });

    pagesFetched += 1;
    if (recordsRaw.length === 0) {
      break;
    }

    const records = parseValidRecords(recordsRaw);
    if (records.length === 0) {
      break;
    }

    await upsertNomusRawRecords({ endpoint: input.endpoint, records });
    recordsFetched += records.length;
    newRecordsFetched += records.filter((item) => Number(item.id) > input.lastMaxIdBefore).length;

    const pageMaxId = Math.max(...records.map((item) => Number(item.id)));
    const pageMinId = getMinExternalId(records);
    replayMaxId = Math.max(replayMaxId, pageMaxId);
    replayMinId = replayMinId === null || (pageMinId !== null && pageMinId < replayMinId) ? pageMinId : replayMinId;

    if (recordsRaw.length < NOMUS_PAGE_SIZE) {
      break;
    }

    page += 1;
  }

  return {
    recordsFetched,
    newRecordsFetched,
    pagesFetched,
    replayMinId,
    replayMaxId,
  };
}

async function fetchNewIdsOutsideReplayWindow(input: {
  client: NomusClient;
  endpoint: NomusEndpoint;
  lastMaxIdBefore: number;
  replayMinId: number | null;
}): Promise<{
  recordsFetched: number;
  pagesFetched: number;
  lastMaxIdAfter: number;
}> {
  let page = env.NOMUS_PAGE_START;
  let recordsFetched = 0;
  let pagesFetched = 0;
  let lastMaxIdAfter = input.lastMaxIdBefore;
  const query = buildIncrementalIdQuery({
    lastMaxIdBefore: input.lastMaxIdBefore,
    replayMinId: input.replayMinId,
  });

  while (page <= env.NOMUS_MAX_PAGES_PER_RUN) {
    const recordsRaw = await input.client.listEndpoint({
      endpoint: input.endpoint,
      page,
      query,
    });

    pagesFetched += 1;
    if (recordsRaw.length === 0) {
      break;
    }

    const records = parseValidRecords(recordsRaw);
    if (records.length === 0) {
      break;
    }

    await upsertNomusRawRecords({ endpoint: input.endpoint, records });
    recordsFetched += records.length;

    const pageMaxId = Math.max(...records.map((item) => Number(item.id)));
    lastMaxIdAfter = Math.max(lastMaxIdAfter, pageMaxId);

    if (recordsRaw.length < NOMUS_PAGE_SIZE) {
      break;
    }

    page += 1;
  }

  return {
    recordsFetched,
    pagesFetched,
    lastMaxIdAfter,
  };
}

async function syncEndpoint(
  client: NomusClient,
  endpoint: NomusEndpoint,
): Promise<NomusSyncEndpointResult> {
  const startedAt = new Date().toISOString();
  const state = await getNomusSyncState(endpoint);

  const lastMaxIdBefore = Number(state?.last_max_id ?? 0);
  let lastMaxIdAfter = lastMaxIdBefore;

  try {
    const replayResult = await replayRecentPages({
      client,
      endpoint,
      lastMaxIdBefore,
    });
    lastMaxIdAfter = Math.max(lastMaxIdAfter, replayResult.replayMaxId);

    const incrementalResult = await fetchNewIdsOutsideReplayWindow({
      client,
      endpoint,
      lastMaxIdBefore,
      replayMinId: replayResult.replayMinId,
    });
    lastMaxIdAfter = Math.max(lastMaxIdAfter, incrementalResult.lastMaxIdAfter);

    const total =
      Number(state?.total_records_synced ?? 0) +
      replayResult.newRecordsFetched +
      incrementalResult.recordsFetched;
    await upsertNomusSyncState({
      endpoint,
      lastMaxId: lastMaxIdAfter,
      totalRecordsSynced: total,
      lastSyncStatus: "success",
      lastError: null,
      startedAt,
      finishedAt: new Date().toISOString(),
    });

    return {
      endpoint,
      strategy: "last_max_id_with_page_lookback",
      recordsFetched: replayResult.recordsFetched + incrementalResult.recordsFetched,
      pagesFetched: replayResult.pagesFetched + incrementalResult.pagesFetched,
      lookbackRecordsFetched: replayResult.recordsFetched,
      lookbackNewRecordsFetched: replayResult.newRecordsFetched,
      lookbackPagesFetched: replayResult.pagesFetched,
      incrementalRecordsFetched: incrementalResult.recordsFetched,
      incrementalPagesFetched: incrementalResult.pagesFetched,
      lastMaxIdBefore,
      lastMaxIdAfter,
    };
  } catch (error) {
    const total = Number(state?.total_records_synced ?? 0);
    await upsertNomusSyncState({
      endpoint,
      lastMaxId: lastMaxIdBefore,
      totalRecordsSynced: total,
      lastSyncStatus: "failed",
      lastError: getErrorMessage(error),
      startedAt,
      finishedAt: new Date().toISOString(),
    });

    throw error;
  }
}

export async function runNomusSyncAndBuildDashboard(): Promise<
  NomusSyncRunResult & {
    payload: DashboardData;
  }
> {
  if (!env.NOMUS_SYNC_ENABLED) {
    throw new Error("Integração Nomus desabilitada no ambiente.");
  }

  if (!env.NOMUS_INTEGRATION_KEY) {
    throw new Error("NOMUS_INTEGRATION_KEY não configurada.");
  }

  const client = new NomusClient();
  const endpoints = getEnabledEndpoints();

  const endpointResults: NomusSyncEndpointResult[] = [];
  const endpointsSucceeded: NomusEndpoint[] = [];
  const errors: string[] = [];

  for (const endpoint of endpoints) {
    try {
      const result = await syncEndpoint(client, endpoint);
      endpointResults.push(result);
      endpointsSucceeded.push(endpoint);
    } catch (error) {
      errors.push(`${endpoint}: ${getErrorMessage(error)}`);
    }
  }

  const propostas = await loadNomusRawPayloads("propostas");
  const pedidos = await loadNomusRawPayloads("pedidos");
  const contasReceber = await loadNomusRawPayloads("contasReceber");
  const processos = await loadNomusRawPayloads("processos");
  const ordens = await loadNomusRawPayloads("ordens");

  const payload = buildDashboardFromNomus({
    propostas,
    pedidos,
    contasReceber,
    processos,
    ordens,
    meta: {
      generatedAt: new Date().toISOString(),
      triedEndpoints: endpoints,
      successfulEndpoints: endpointsSucceeded,
    },
  });

  return {
    endpointsTried: endpoints,
    endpointsSucceeded,
    endpointResults,
    errors,
    payload,
  };
}
