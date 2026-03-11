import { sampleDashboardData } from "../data/sampleDashboard.js";
import type { DashboardData } from "../lib/types.js";
import { buildSourceAdapters } from "../services/sourceAdapters/registry.js";

export async function runSyncJob(): Promise<{
  mergedPayload: DashboardData;
  sourcesTried: string[];
  sourcesSucceeded: string[];
  errors: string[];
}> {
  const adapters = buildSourceAdapters();
  const sourcesTried = adapters.map((adapter) => adapter.name);
  const sourcesSucceeded: string[] = [];
  const errors: string[] = [];

  // Start from current shape so frontend remains unchanged while real adapters are connected.
  const mergedPayload: DashboardData = structuredClone(sampleDashboardData);

  for (const adapter of adapters) {
    try {
      const partialData = await adapter.fetch();
      Object.assign(mergedPayload, partialData);
      sourcesSucceeded.push(adapter.name);
    } catch (error) {
      errors.push(`${adapter.name}: ${(error as Error).message}`);
    }
  }

  return { mergedPayload, sourcesTried, sourcesSucceeded, errors };
}
