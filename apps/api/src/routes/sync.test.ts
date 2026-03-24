import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const runSyncJobMock = vi.fn();
const createDashboardSnapshotMock = vi.fn();
const startSyncRunMock = vi.fn();
const finishSyncRunMock = vi.fn();

vi.mock("../middleware/auth.js", () => ({
  requireAuth: (req: { authUser?: unknown }, _res: unknown, next: () => void) => {
    req.authUser = { id: "admin-id", username: "admin", accessLevel: "admin" };
    next();
  },
  requireAdmin: (_req: unknown, _res: unknown, next: () => void) => {
    next();
  },
}));

vi.mock("../jobs/syncData.js", () => ({
  runSyncJob: runSyncJobMock,
}));

vi.mock("../services/dashboardService.js", () => ({
  createDashboardSnapshot: createDashboardSnapshotMock,
  getLatestDashboard: vi.fn(),
}));

vi.mock("../services/syncRunsService.js", () => ({
  startSyncRun: startSyncRunMock,
  finishSyncRun: finishSyncRunMock,
}));

describe("POST /api/sync", () => {
  beforeEach(() => {
    vi.resetModules();
    runSyncJobMock.mockReset();
    createDashboardSnapshotMock.mockReset();
    startSyncRunMock.mockReset();
    finishSyncRunMock.mockReset();
  });

  it(
    "saves a snapshot only when sync is fully successful",
    async () => {
    vi.doMock("../config/env.js", () => ({
      env: {
        CORS_ORIGIN: "http://localhost:5173",
        SYNC_SECRET: undefined,
      },
    }));

    const { sampleDashboardData } = await import("../data/sampleDashboard.js");

    startSyncRunMock.mockResolvedValue({ id: "run-1", sync_key: "nomus_sync", status: "running" });
    runSyncJobMock.mockResolvedValue({
      status: "success",
      canPersistSnapshot: true,
      mergedPayload: sampleDashboardData,
      sourcesTried: ["nomus:propostas"],
      sourcesSucceeded: ["nomus:propostas"],
      errors: [],
      details: {},
    });
    createDashboardSnapshotMock.mockResolvedValue({
      id: "snapshot-1",
      source: "sync_job",
      reference_date: "2026-03-16",
      payload: sampleDashboardData,
    });
    finishSyncRunMock.mockResolvedValue(undefined);

    const { createApp } = await import("../app.js");
    const app = createApp();

    const response = await request(app).post("/api/sync");

    expect(response.status).toBe(202);
    expect(response.body.snapshotSaved).toBe(true);
    expect(createDashboardSnapshotMock).toHaveBeenCalledTimes(1);
    expect(finishSyncRunMock).toHaveBeenCalledTimes(1);
    },
    15000,
  );

  it(
    "does not save a snapshot when sync is degraded",
    async () => {
    vi.doMock("../config/env.js", () => ({
      env: {
        CORS_ORIGIN: "http://localhost:5173",
        SYNC_SECRET: undefined,
      },
    }));

    const { sampleDashboardData } = await import("../data/sampleDashboard.js");

    startSyncRunMock.mockResolvedValue({ id: "run-2", sync_key: "nomus_sync", status: "running" });
    runSyncJobMock.mockResolvedValue({
      status: "degraded",
      canPersistSnapshot: false,
      mergedPayload: sampleDashboardData,
      sourcesTried: ["nomus:propostas", "nomus:pedidos"],
      sourcesSucceeded: ["nomus:propostas"],
      errors: ["nomus:pedidos timeout"],
      details: {},
    });
    finishSyncRunMock.mockResolvedValue(undefined);

    const { createApp } = await import("../app.js");
    const app = createApp();

    const response = await request(app).post("/api/sync");

    expect(response.status).toBe(202);
    expect(response.body.snapshotSaved).toBe(false);
    expect(createDashboardSnapshotMock).not.toHaveBeenCalled();
    },
    15000,
  );

  it(
    "returns 409 when another sync is already running",
    async () => {
    vi.doMock("../config/env.js", () => ({
      env: {
        CORS_ORIGIN: "http://localhost:5173",
        SYNC_SECRET: undefined,
      },
    }));

    startSyncRunMock.mockRejectedValue(new Error("SYNC_ALREADY_RUNNING"));

    const { createApp } = await import("../app.js");
    const app = createApp();

    const response = await request(app).post("/api/sync");

    expect(response.status).toBe(409);
    expect(response.body.message).toContain("sincronização");
    },
    15000,
  );
});
