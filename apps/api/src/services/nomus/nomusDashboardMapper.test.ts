import { describe, expect, it } from "vitest";
import { buildDashboardFromNomus } from "./nomusDashboardMapper.js";

describe("buildDashboardFromNomus", () => {
  it("marks the resulting payload as mixed and exposes block coverage metadata", () => {
    const payload = buildDashboardFromNomus({
      propostas: [
        {
          id: 1,
          dataHoraAbertura: "16/03/2026 00:00:00",
          valorTotalNfe: "10.000,00",
        },
      ],
      pedidos: [
        {
          id: 2,
          dataEmissao: "16/03/2026 00:00:00",
          valorTotal: "8.000,00",
        },
      ],
      contasReceber: [
        {
          id: 3,
          dataCompetencia: "16/03/2026",
          dataVencimento: "30/03/2026",
          saldoReceber: "8.000,00",
          status: false,
        },
      ],
      meta: {
        generatedAt: "2026-03-16T12:00:00.000Z",
        triedEndpoints: ["propostas", "pedidos", "contasReceber"],
        successfulEndpoints: ["propostas", "pedidos", "contasReceber"],
      },
    });

    expect(payload._meta).toBeDefined();
    expect(payload._meta?.data_source_status).toBe("mixed");
    expect(payload._meta?.is_mixed).toBe(true);
    expect(payload._meta?.generated_from).toContain("sampleDashboardData");
    expect(payload._meta?.generated_from).toContain("nomus:propostas");
    expect(payload._meta?.block_coverage.financeiro.status).toBe("partial");
    expect(payload._meta?.block_coverage.financeiro.real_fields).toContain("faturamento_ytd");
    expect(payload._meta?.block_coverage.alertas.status).toBe("partial");
    expect(payload._meta?.block_coverage.alertas.mock_fields).toContain("thresholds_e_metas_subjacentes");
    expect(payload._meta?.block_coverage.engenharia.status).toBe("mock");
    expect(payload._meta?.block_coverage.acoes_pendentes.status).toBe("mock");
    expect(payload._meta?.source_coverage.nomus?.failed_endpoints).toEqual([]);
  });

  it("keeps partial blocks identifiable even when some domains remain mock", () => {
    const payload = buildDashboardFromNomus({
      propostas: [],
      pedidos: [],
      contasReceber: [],
      meta: {
        generatedAt: "2026-03-16T12:00:00.000Z",
        triedEndpoints: ["propostas", "pedidos", "contasReceber"],
        successfulEndpoints: ["propostas", "pedidos", "contasReceber"],
      },
    });

    expect(payload._meta?.block_coverage.comercial.status).toBe("partial");
    expect(payload._meta?.block_coverage.orcamentacao.status).toBe("partial");
    expect(payload._meta?.block_coverage.producao.status).toBe("mock");
  });

  it("derives commercial funnel and production metrics from processos and ordens when available", () => {
    const payload = buildDashboardFromNomus({
      propostas: [
        {
          id: 10,
          dataHoraAbertura: "10/03/2026 08:00:00",
          valorTotalNfe: "20.000,00",
        },
      ],
      pedidos: [
        {
          id: 200,
          idPessoaCliente: 9001,
          dataEmissao: "12/03/2026 00:00:00",
          dataEntregaPadrao: "20/03/2026 00:00:00",
          valorTotal: "18.000,00",
          nfes: [
            {
              dataProcessamento: "18/03/2026",
              horaProcessamento: "09:00:00",
            },
          ],
        },
        {
          id: 201,
          idPessoaCliente: 9001,
          dataEmissao: "13/03/2026 00:00:00",
          dataEntregaPadrao: "21/03/2026 00:00:00",
          valorTotal: "5.000,00",
          nfes: [],
        },
      ],
      contasReceber: [],
      processos: [
        {
          id: 300,
          dataCriacao: "10/03/2026",
          equipe: "Comercial",
          tipo: "NOVO PIPE VENDAS",
          etapa: "Solicitação de Orçamento",
        },
        {
          id: 301,
          dataCriacao: "11/03/2026",
          equipe: "Comercial",
          tipo: "NOVO PIPE VENDAS",
          etapa: "Follow-up",
        },
      ],
      ordens: [
        {
          id: 400,
          status: "Liberada",
          dataHoraLiberacao: "15/03/2026 08:00:00",
          itensPedido: [{ idPedido: 200 }],
        },
      ],
      meta: {
        generatedAt: "2026-03-23T12:00:00.000Z",
        triedEndpoints: ["propostas", "pedidos", "contasReceber", "processos", "ordens"],
        successfulEndpoints: ["propostas", "pedidos", "contasReceber", "processos", "ordens"],
      },
    });

    expect(payload.comercial.funil.qualificados).toBe(2);
    expect(payload.comercial.funil.negociacao).toBe(1);
    expect(payload.comercial.clientes_recorrencia).toBe(1);
    expect(payload.producao.projetos_simultaneos).toBe(1);
    expect(payload.producao.entregas_no_prazo_pct).toBe(100);
    expect(payload.producao.tempo_medio_fab_dias).toBe(3);
    expect(payload._meta?.block_coverage.producao.status).toBe("partial");
    expect(payload._meta?.block_coverage.producao.real_fields).toContain("entregas_no_prazo_pct");
    expect(payload._meta?.block_coverage.comercial.real_fields).toContain("clientes_recorrencia");
  });
});
