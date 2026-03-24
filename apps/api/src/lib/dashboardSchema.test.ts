import { describe, expect, it } from "vitest";
import { sampleDashboardData } from "../data/sampleDashboard.js";
import { dashboardDataSchema } from "./dashboardSchema.js";

describe("dashboardDataSchema", () => {
  it("accepts the current sample payload", () => {
    expect(() => dashboardDataSchema.parse(sampleDashboardData)).not.toThrow();
  });

  it("rejects malformed dashboard payloads", () => {
    const invalid = {
      ...sampleDashboardData,
      financeiro: {
        ...sampleDashboardData.financeiro,
        faturamento_mensal: [],
      },
    };

    expect(() => dashboardDataSchema.parse(invalid)).toThrow();
  });
});
