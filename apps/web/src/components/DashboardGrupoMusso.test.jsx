import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { sampleDashboardData } from "../../../api/src/data/sampleDashboard.ts";
import DashboardGrupoMusso from "./DashboardGrupoMusso.jsx";

describe("DashboardGrupoMusso", () => {
  it("renders safely with semantic metadata and surfaces partial alerts coverage", () => {
    const payload = structuredClone(sampleDashboardData);

    payload._meta = {
      ...payload._meta,
      data_source_status: "mixed",
      is_mixed: true,
      last_successful_real_sync_at: "2026-03-17T12:30:00.000Z",
      block_coverage: {
        ...payload._meta.block_coverage,
        financeiro: {
          ...payload._meta.block_coverage.financeiro,
          status: "partial",
        },
        alertas: {
          ...payload._meta.block_coverage.alertas,
          status: "partial",
        },
      },
    };

    const html = renderToStaticMarkup(<DashboardGrupoMusso data={payload} showHeader={false} />);

    expect(html).toContain("Dados mistos");
    expect(html).toContain("Cobertura parcial");
    expect(html).toContain("Leitura parcial: estes alertas usam parte dos dados reais já integrados");
  });

  it("keeps compatibility with legacy snapshots that do not expose _meta", () => {
    const payload = structuredClone(sampleDashboardData);
    delete payload._meta;

    const html = renderToStaticMarkup(<DashboardGrupoMusso data={payload} showHeader={false} />);

    expect(html).toContain("Cobertura não informada");
    expect(html).toContain("Alertas Ativos");
  });
});
