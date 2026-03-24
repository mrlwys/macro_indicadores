import { beforeEach, describe, expect, it, vi } from "vitest";

const listEndpointMock = vi.fn();
const getNomusSyncStateMock = vi.fn();
const loadNomusRawPayloadsMock = vi.fn();
const upsertNomusRawRecordsMock = vi.fn();
const upsertNomusSyncStateMock = vi.fn();
const buildDashboardFromNomusMock = vi.fn();

vi.mock("./nomusClient.js", () => ({
  NomusClient: vi.fn().mockImplementation(() => ({
    listEndpoint: listEndpointMock,
  })),
}));

vi.mock("./nomusRepository.js", () => ({
  getNomusSyncState: getNomusSyncStateMock,
  loadNomusRawPayloads: loadNomusRawPayloadsMock,
  upsertNomusRawRecords: upsertNomusRawRecordsMock,
  upsertNomusSyncState: upsertNomusSyncStateMock,
}));

vi.mock("./nomusDashboardMapper.js", () => ({
  buildDashboardFromNomus: buildDashboardFromNomusMock,
}));

describe("runNomusSyncAndBuildDashboard", () => {
  beforeEach(() => {
    vi.resetModules();
    listEndpointMock.mockReset();
    getNomusSyncStateMock.mockReset();
    loadNomusRawPayloadsMock.mockReset();
    upsertNomusRawRecordsMock.mockReset();
    upsertNomusSyncStateMock.mockReset();
    buildDashboardFromNomusMock.mockReset();
  });

  it("replays recent pages and fetches only the uncovered id range", async () => {
    vi.doMock("../../config/env.js", () => ({
      env: {
        NOMUS_SYNC_ENABLED: true,
        NOMUS_INTEGRATION_KEY: "secret",
        NOMUS_ENABLED_ENDPOINTS: ["propostas"],
        NOMUS_INCREMENTAL_LOOKBACK_PAGES: 2,
        NOMUS_PAGE_START: 1,
        NOMUS_MAX_PAGES_PER_RUN: 10,
      },
    }));

    const { sampleDashboardData } = await import("../../data/sampleDashboard.js");
    getNomusSyncStateMock.mockResolvedValue({
      endpoint: "propostas",
      last_max_id: 100,
      total_records_synced: 10,
      last_sync_started_at: null,
      last_sync_finished_at: null,
      last_sync_status: "success",
      last_error: null,
    });
    listEndpointMock
      .mockResolvedValueOnce([{ id: 105 }, { id: 104 }])
      .mockResolvedValueOnce([{ id: 103 }, { id: 102 }, { id: 101 }]);
    upsertNomusRawRecordsMock.mockResolvedValue(1);
    upsertNomusSyncStateMock.mockResolvedValue(undefined);
    loadNomusRawPayloadsMock.mockResolvedValue([]);
    buildDashboardFromNomusMock.mockReturnValue(sampleDashboardData);

    const { runNomusSyncAndBuildDashboard } = await import("./nomusSyncService.js");
    const result = await runNomusSyncAndBuildDashboard();

    expect(listEndpointMock).toHaveBeenNthCalledWith(1, { endpoint: "propostas", page: 1 });
    expect(listEndpointMock).toHaveBeenNthCalledWith(2, {
      endpoint: "propostas",
      page: 1,
      query: "id>100;id<104",
    });
    expect(result.endpointResults[0]).toMatchObject({
      endpoint: "propostas",
      strategy: "last_max_id_with_page_lookback",
      lookbackPagesFetched: 1,
      lookbackRecordsFetched: 2,
      lookbackNewRecordsFetched: 2,
      incrementalRecordsFetched: 3,
      lastMaxIdBefore: 100,
      lastMaxIdAfter: 105,
    });
    expect(upsertNomusSyncStateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "propostas",
        lastMaxId: 105,
        totalRecordsSynced: 15,
      }),
    );
  });

  it("skips lookback replay on first sync and uses only id backfill", async () => {
    vi.doMock("../../config/env.js", () => ({
      env: {
        NOMUS_SYNC_ENABLED: true,
        NOMUS_INTEGRATION_KEY: "secret",
        NOMUS_ENABLED_ENDPOINTS: ["propostas"],
        NOMUS_INCREMENTAL_LOOKBACK_PAGES: 3,
        NOMUS_PAGE_START: 1,
        NOMUS_MAX_PAGES_PER_RUN: 10,
      },
    }));

    const { sampleDashboardData } = await import("../../data/sampleDashboard.js");
    getNomusSyncStateMock.mockResolvedValue(null);
    listEndpointMock.mockResolvedValueOnce([{ id: 3 }, { id: 2 }, { id: 1 }]);
    upsertNomusRawRecordsMock.mockResolvedValue(3);
    upsertNomusSyncStateMock.mockResolvedValue(undefined);
    loadNomusRawPayloadsMock.mockResolvedValue([]);
    buildDashboardFromNomusMock.mockReturnValue(sampleDashboardData);

    const { runNomusSyncAndBuildDashboard } = await import("./nomusSyncService.js");
    const result = await runNomusSyncAndBuildDashboard();

    expect(listEndpointMock).toHaveBeenCalledTimes(1);
    expect(listEndpointMock).toHaveBeenCalledWith({
      endpoint: "propostas",
      page: 1,
      query: "id>0",
    });
    expect(result.endpointResults[0]).toMatchObject({
      lookbackPagesFetched: 0,
      incrementalRecordsFetched: 3,
      lastMaxIdBefore: 0,
      lastMaxIdAfter: 3,
    });
  });
});
