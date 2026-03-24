import { beforeEach, describe, expect, it, vi } from "vitest";

const runNomusSyncAndBuildDashboardMock = vi.fn();
const buildSourceAdaptersMock = vi.fn();

vi.mock("../services/nomus/nomusSyncService.js", () => ({
  runNomusSyncAndBuildDashboard: runNomusSyncAndBuildDashboardMock,
}));

vi.mock("../services/sourceAdapters/registry.js", () => ({
  buildSourceAdapters: buildSourceAdaptersMock,
}));

describe("runSyncJob", () => {
  beforeEach(() => {
    vi.resetModules();
    runNomusSyncAndBuildDashboardMock.mockReset();
    buildSourceAdaptersMock.mockReset();
  });

  it("allows snapshot persistence only on full Nomus success", async () => {
    vi.doMock("../config/env.js", () => ({
      env: {
        NOMUS_SYNC_ENABLED: true,
      },
    }));

    const { sampleDashboardData } = await import("../data/sampleDashboard.js");
    runNomusSyncAndBuildDashboardMock.mockResolvedValue({
      payload: sampleDashboardData,
      endpointsTried: ["propostas", "pedidos", "contasReceber"],
      endpointsSucceeded: ["propostas", "pedidos", "contasReceber"],
      endpointResults: [],
      errors: [],
    });

    const { runSyncJob } = await import("./syncData.js");
    const result = await runSyncJob();

    expect(result.status).toBe("success");
    expect(result.canPersistSnapshot).toBe(true);
  });

  it("blocks snapshot persistence on degraded Nomus sync", async () => {
    vi.doMock("../config/env.js", () => ({
      env: {
        NOMUS_SYNC_ENABLED: true,
      },
    }));

    const { sampleDashboardData } = await import("../data/sampleDashboard.js");
    runNomusSyncAndBuildDashboardMock.mockResolvedValue({
      payload: sampleDashboardData,
      endpointsTried: ["propostas", "pedidos", "contasReceber"],
      endpointsSucceeded: ["propostas", "pedidos"],
      endpointResults: [],
      errors: ["contasReceber: timeout"],
    });

    const { runSyncJob } = await import("./syncData.js");
    const result = await runSyncJob();

    expect(result.status).toBe("degraded");
    expect(result.canPersistSnapshot).toBe(false);
  });

  it("falls back to failed status when Nomus throws", async () => {
    vi.doMock("../config/env.js", () => ({
      env: {
        NOMUS_SYNC_ENABLED: true,
      },
    }));

    runNomusSyncAndBuildDashboardMock.mockRejectedValue(new Error("boom"));

    const { runSyncJob } = await import("./syncData.js");
    const result = await runSyncJob();

    expect(result.status).toBe("failed");
    expect(result.canPersistSnapshot).toBe(false);
    expect(result.errors).toEqual(["boom"]);
  });
});
