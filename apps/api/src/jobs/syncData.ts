import { env } from "../config/env.js";
import { sampleDashboardData } from "../data/sampleDashboard.js";
import type { DashboardData } from "../lib/types.js";
import { runNomusSyncAndBuildDashboard } from "../services/nomus/nomusSyncService.js";
import { buildSourceAdapters } from "../services/sourceAdapters/registry.js";

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

export async function runSyncJob(): Promise<{
  status: "success" | "degraded" | "failed";
  canPersistSnapshot: boolean;
  mergedPayload: DashboardData;
  sourcesTried: string[];
  sourcesSucceeded: string[];
  errors: string[];
  details?: Record<string, unknown>;
}> {
  if (env.NOMUS_SYNC_ENABLED) {
    try {
      const nomus = await runNomusSyncAndBuildDashboard();
      const status = nomus.errors.length > 0 ? "degraded" : "success";
      return {
        status,
        canPersistSnapshot: status === "success",
        mergedPayload: nomus.payload,
        sourcesTried: nomus.endpointsTried.map((endpoint) => `nomus:${endpoint}`),
        sourcesSucceeded: nomus.endpointsSucceeded.map((endpoint) => `nomus:${endpoint}`),
        errors: nomus.errors,
        details: {
          nomus: {
            endpointResults: nomus.endpointResults,
          },
        },
      };
    } catch (error) {
      return {
        status: "failed",
        canPersistSnapshot: false,
        mergedPayload: structuredClone(sampleDashboardData),
        sourcesTried: ["nomus"],
        sourcesSucceeded: [],
        errors: [getErrorMessage(error)],
      };
    }
  }

  const adapters = buildSourceAdapters();
  const sourcesTried = adapters.map((adapter) => adapter.name);
  const sourcesSucceeded: string[] = [];
  const errors: string[] = [];

  const mergedPayload: DashboardData = structuredClone(sampleDashboardData);

  for (const adapter of adapters) {
    try {
      const partialData = await adapter.fetch();
      Object.assign(mergedPayload, partialData);
      sourcesSucceeded.push(adapter.name);
    } catch (error) {
      errors.push(`${adapter.name}: ${getErrorMessage(error)}`);
    }
  }

  const status = errors.length > 0 ? "degraded" : "success";

  return {
    status,
    canPersistSnapshot: status === "success",
    mergedPayload,
    sourcesTried,
    sourcesSucceeded,
    errors,
  };
}
