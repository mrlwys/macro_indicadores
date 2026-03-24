import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleDashboardData } from "../data/sampleDashboard.js";
import { applyDashboardConfigEntries } from "./dashboardConfigService.js";

const { getSupabaseAdminClient } = vi.hoisted(() => ({
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock("../lib/supabase.js", () => ({
  getSupabaseAdminClient,
}));

function buildEntriesQuery(data: Array<Record<string, unknown>>) {
  let callCount = 0;
  const query = {
    order: vi.fn().mockImplementation(() => {
      callCount += 1;
      if (callCount >= 2) {
        return Promise.resolve({
          data,
          error: null,
        });
      }

      return query;
    }),
  };

  return query;
}

describe("dashboardConfigService", () => {
  beforeEach(() => {
    getSupabaseAdminClient.mockReset();
  });

  it("applies the latest compatible config entry to the dashboard payload and updates metadata", async () => {
    getSupabaseAdminClient.mockReturnValue({
      from(table: string) {
        expect(table).toBe("dashboard_config_entries");
        return {
          select() {
            return buildEntriesQuery([
              {
                id: "7a0bbbf4-fd6e-4b4b-95fb-a79ec6811111",
                config_key: "financeiro.meta_anual",
                reference_date: "2026-01-01",
                value_type: "number",
                value_number: "12500000",
                value_boolean: null,
                value_text: null,
                notes: "Meta anual ajustada",
                created_by: null,
                created_at: "2026-03-23T12:00:00.000Z",
                updated_at: "2026-03-23T12:00:00.000Z",
              },
            ]);
          },
        };
      },
    });

    const payload = await applyDashboardConfigEntries({
      payload: structuredClone(sampleDashboardData),
      referenceDate: "2026-03-23",
    });

    expect(payload.financeiro.meta_anual).toBe(12500000);
    expect(payload._meta?.generated_from).toContain("config:financeiro.meta_anual");
    expect(payload._meta?.source_coverage.config?.applied_keys).toContain("financeiro.meta_anual");
    expect(payload._meta?.block_coverage.financeiro.real_fields).toContain("financeiro.meta_anual");
    expect(payload._meta?.block_coverage.financeiro.mock_fields).not.toContain("financeiro.meta_anual");
  });
});
