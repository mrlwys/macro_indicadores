import { sampleDashboardData } from "../../data/sampleDashboard.js";
import { dashboardDataSchema, type DashboardBlockCoverage, type DashboardData } from "../../lib/dashboardSchema.js";
import { diffDays, formatPeriodoPtBr, parseBrDateTime, parseCurrencyPtBr } from "./dateUtils.js";

function isInMonth(date: Date | null, month: number, year: number): boolean {
  return Boolean(date && date.getMonth() === month && date.getFullYear() === year);
}

function monthLabelsPtBr(): string[] {
  return ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
}

function safeNumber(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function isInYear(date: Date | null, year: number): boolean {
  return Boolean(date && date.getFullYear() === year);
}

function pushUnique(target: string[], ...values: string[]) {
  for (const value of values) {
    if (value && !target.includes(value)) {
      target.push(value);
    }
  }
}

function removeFields(target: string[], values: string[]) {
  return target.filter((field) => !values.includes(field));
}

function parseProcessDate(payload: Record<string, unknown>): Date | null {
  return parseBrDateTime(payload.dataCriacao) ?? parseBrDateTime(payload.dataHoraProgramada);
}

function parseInvoiceDate(payload: Record<string, unknown>): Date | null {
  const date = typeof payload.dataProcessamento === "string" ? payload.dataProcessamento.trim() : "";
  const time = typeof payload.horaProcessamento === "string" ? payload.horaProcessamento.trim() : "";

  if (!date) {
    return null;
  }

  return parseBrDateTime(time ? `${date} ${time}` : date);
}

function parsePedidoFirstInvoiceDate(payload: Record<string, unknown>): Date | null {
  const nfes = Array.isArray(payload.nfes) ? payload.nfes : [];
  const dates = nfes
    .map((item) => (item && typeof item === "object" ? parseInvoiceDate(item as Record<string, unknown>) : null))
    .filter((item): item is Date => item instanceof Date && Number.isFinite(item.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  return dates[0] ?? null;
}

function parseLinkedPedidoIds(payload: Record<string, unknown>): number[] {
  const items = Array.isArray(payload.itensPedido) ? payload.itensPedido : [];

  return items
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const id = Number((item as { idPedido?: unknown }).idPedido);
      return Number.isFinite(id) ? id : null;
    })
    .filter((item): item is number => typeof item === "number");
}

const QUALIFIED_PROCESS_STAGES = new Set([
  "Solicitação de Orçamento",
  "Orçamento em Elaboração",
  "Proposta Finalizada",
  "Proposta Enviada ao Cliente",
  "Follow-up",
  "Negociação",
  "Negociação Ganha",
]);

const NEGOTIATION_PROCESS_STAGES = new Set([
  "Proposta Enviada ao Cliente",
  "Follow-up",
  "Negociação",
  "Negociação Ganha",
]);

const ACTIVE_ORDER_STATUSES = new Set([
  "Confirmada",
  "Liberada",
  "Requisitada parcialmente",
  "Requisitada totalmente",
]);

function createBlockCoverage(input: DashboardBlockCoverage): DashboardBlockCoverage {
  return {
    status: input.status,
    sources: [...input.sources],
    real_fields: [...input.real_fields],
    mock_fields: [...input.mock_fields],
  };
}

export function buildDashboardFromNomus(input: {
  propostas: Array<Record<string, unknown>>;
  pedidos: Array<Record<string, unknown>>;
  contasReceber: Array<Record<string, unknown>>;
  processos?: Array<Record<string, unknown>>;
  ordens?: Array<Record<string, unknown>>;
  meta?: {
    generatedAt?: string;
    triedEndpoints?: string[];
    successfulEndpoints?: string[];
  };
}): DashboardData {
  const base: DashboardData = structuredClone(sampleDashboardData);
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const propostas = input.propostas;
  const pedidos = input.pedidos;
  const contasReceber = input.contasReceber;
  const processos = input.processos ?? [];
  const ordens = input.ordens ?? [];
  const successfulEndpointSet = new Set(input.meta?.successfulEndpoints ?? ["propostas", "pedidos", "contasReceber"]);
  const canUseProcessos = successfulEndpointSet.has("processos");
  const canUseOrdens = successfulEndpointSet.has("ordens");
  const canUsePedidos = successfulEndpointSet.has("pedidos");
  const canUsePropostas = successfulEndpointSet.has("propostas");

  const propostasMes = propostas.filter((item) =>
    isInMonth(parseBrDateTime(item.dataHoraAbertura), currentMonth, currentYear),
  );

  const pedidosMes = pedidos.filter((item) =>
    isInMonth(parseBrDateTime(item.dataEmissao), currentMonth, currentYear),
  );

  const propostasMesCount = propostasMes.length;
  const pedidosMesCount = pedidosMes.length;

  const pedidosMesValor = pedidosMes.reduce((acc, item) => acc + parseCurrencyPtBr(item.valorTotal), 0);

  const pipelineAtivo = propostas
    .filter((item) => {
      const date = parseBrDateTime(item.dataHoraAbertura);
      if (!date) {
        return false;
      }
      const diff = now.getTime() - date.getTime();
      return diff <= 1000 * 60 * 60 * 24 * 90;
    })
    .reduce((acc, item) => acc + parseCurrencyPtBr(item.valorTotalNfe), 0);

  const taxaConversao = propostasMesCount > 0 ? (pedidosMesCount / propostasMesCount) * 100 : 0;
  const ticketMedio = pedidosMesCount > 0 ? pedidosMesValor / pedidosMesCount : 0;

  const meses = monthLabelsPtBr();
  const metas = base.financeiro.faturamento_mensal.map((row) => row.meta);
  const realizadoPorMes = Array.from({ length: 12 }, () => 0);

  for (const pedido of pedidos) {
    const date = parseBrDateTime(pedido.dataEmissao);
    if (!date || date.getFullYear() !== currentYear) {
      continue;
    }

    realizadoPorMes[date.getMonth()] += parseCurrencyPtBr(pedido.valorTotal);
  }

  base.financeiro.faturamento_mensal = meses.map((mes, idx) => ({
    mes,
    realizado: idx <= currentMonth ? Math.round(realizadoPorMes[idx]) : null,
    meta: metas[idx] ?? 833000,
  }));

  const faturamentoYtd = base.financeiro.faturamento_mensal.reduce((acc, item) => acc + (item.realizado ?? 0), 0);

  const prazoItems = contasReceber
    .map((item) => {
      const comp = parseBrDateTime(item.dataCompetencia);
      const venc = parseBrDateTime(item.dataVencimento);
      if (!comp || !venc) {
        return null;
      }
      return diffDays(comp, venc);
    })
    .filter((item): item is number => typeof item === "number" && Number.isFinite(item) && item >= 0);

  const prazoMedio =
    prazoItems.length > 0
      ? prazoItems.reduce((acc, item) => acc + item, 0) / prazoItems.length
      : base.financeiro.prazo_medio_recebimento;

  const saldoReceberAberto = contasReceber
    .filter((item) => item.status === false)
    .reduce((acc, item) => acc + parseCurrencyPtBr(item.saldoReceber), 0);

  const processosComerciaisMes = processos.filter((item) => {
    if (!canUseProcessos) {
      return false;
    }

    const processDate = parseProcessDate(item);
    const equipe = typeof item.equipe === "string" ? item.equipe.trim() : "";
    const tipo = typeof item.tipo === "string" ? item.tipo.trim() : "";

    return isInMonth(processDate, currentMonth, currentYear) && (equipe === "Comercial" || tipo === "NOVO PIPE VENDAS");
  });

  const funilQualificadosReal = processosComerciaisMes.filter((item) => {
    const etapa = typeof item.etapa === "string" ? item.etapa.trim() : "";
    return QUALIFIED_PROCESS_STAGES.has(etapa);
  }).length;

  const funilNegociacaoReal = processosComerciaisMes.filter((item) => {
    const etapa = typeof item.etapa === "string" ? item.etapa.trim() : "";
    return NEGOTIATION_PROCESS_STAGES.has(etapa);
  }).length;

  const recurringClientesReal = pedidos
    .filter((item) => {
      if (!canUsePedidos) {
        return false;
      }

      const emissionDate = parseBrDateTime(item.dataEmissao);
      if (!emissionDate) {
        return false;
      }

      return now.getTime() - emissionDate.getTime() <= 1000 * 60 * 60 * 24 * 365;
    })
    .reduce((acc, item) => {
      const clienteId = Number(item.idPessoaCliente);
      if (!Number.isFinite(clienteId)) {
        return acc;
      }

      acc.set(clienteId, (acc.get(clienteId) ?? 0) + 1);
      return acc;
    }, new Map<number, number>());

  const clientesRecorrentes = Array.from(recurringClientesReal.values()).filter((count) => count >= 2).length;

  const pedidosById = pedidos.reduce((acc, item) => {
    const pedidoId = Number(item.id);
    if (!Number.isFinite(pedidoId)) {
      return acc;
    }

    acc.set(pedidoId, {
      deliveryDate: parseBrDateTime(item.dataEntregaPadrao),
      invoiceDate: parsePedidoFirstInvoiceDate(item),
    });

    return acc;
  }, new Map<number, { deliveryDate: Date | null; invoiceDate: Date | null }>());

  const ordensAtivas = ordens.filter((item) => {
    if (!canUseOrdens) {
      return false;
    }

    const status = typeof item.status === "string" ? item.status.trim() : "";
    return ACTIVE_ORDER_STATUSES.has(status);
  });

  const ordensComEntregaReal = ordens
    .map((item) => {
      const linkedPedidoIds = parseLinkedPedidoIds(item);
      const releaseDate = parseBrDateTime(item.dataHoraLiberacao) ?? parseBrDateTime(item.dataHoraCriacao);
      const linkedPedidos = linkedPedidoIds
        .map((pedidoId) => pedidosById.get(pedidoId) ?? null)
        .filter((pedido): pedido is { deliveryDate: Date | null; invoiceDate: Date | null } => Boolean(pedido));
      const invoiceDates = linkedPedidos
        .map((pedido) => pedido.invoiceDate)
        .filter((date): date is Date => date instanceof Date && Number.isFinite(date.getTime()))
        .sort((a, b) => a.getTime() - b.getTime());
      const deliveryDates = linkedPedidos
        .map((pedido) => pedido.deliveryDate)
        .filter((date): date is Date => date instanceof Date && Number.isFinite(date.getTime()))
        .sort((a, b) => a.getTime() - b.getTime());

      return {
        releaseDate,
        invoiceDate: invoiceDates[0] ?? null,
        promisedDate: deliveryDates[0] ?? null,
      };
    })
    .filter((item) => item.invoiceDate && isInYear(item.invoiceDate, currentYear));

  const fabricacaoDurations = ordensComEntregaReal
    .filter((item) => item.releaseDate && item.invoiceDate)
    .map((item) => diffDays(item.releaseDate as Date, item.invoiceDate as Date))
    .filter((item) => Number.isFinite(item) && item >= 0);

  const tempoMedioFabricacao =
    fabricacaoDurations.length > 0
      ? fabricacaoDurations.reduce((acc, item) => acc + item, 0) / fabricacaoDurations.length
      : base.producao.tempo_medio_fab_dias;

  const entregasNoPrazoElegiveis = ordensComEntregaReal.filter((item) => item.promisedDate && item.invoiceDate);
  const entregasNoPrazo =
    entregasNoPrazoElegiveis.length > 0
      ? (entregasNoPrazoElegiveis.filter((item) => (item.invoiceDate as Date).getTime() <= (item.promisedDate as Date).getTime()).length /
          entregasNoPrazoElegiveis.length) *
        100
      : base.producao.entregas_no_prazo_pct;

  base.periodo = formatPeriodoPtBr(now);

  base.comercial.oportunidades_mes = propostasMesCount;
  base.comercial.orcamentos_emitidos = propostasMesCount;
  base.comercial.taxa_conversao = safeNumber(Number(taxaConversao.toFixed(1)), base.comercial.taxa_conversao);
  base.comercial.ticket_medio = Math.round(safeNumber(ticketMedio, base.comercial.ticket_medio));
  base.comercial.pipeline_ativo = Math.round(safeNumber(pipelineAtivo, base.comercial.pipeline_ativo));
  if (canUsePedidos) {
    base.comercial.clientes_recorrencia = clientesRecorrentes;
  }
  base.comercial.funil = {
    oportunidades: propostasMesCount,
    qualificados: canUseProcessos ? funilQualificadosReal : Math.round(propostasMesCount * 0.76),
    orcados: propostasMesCount,
    negociacao: canUseProcessos ? funilNegociacaoReal : Math.round(propostasMesCount * 0.42),
    fechados: pedidosMesCount,
  };

  base.orcamentacao.emitidos_mes = propostasMesCount;

  base.financeiro.faturamento_ytd = Math.round(faturamentoYtd);
  base.financeiro.prazo_medio_recebimento = Number(safeNumber(prazoMedio, base.financeiro.prazo_medio_recebimento).toFixed(1));
  base.financeiro.reserva_caixa = Math.round(
    Math.max(base.financeiro.reserva_caixa, saldoReceberAberto * 0.12),
  );
  if (canUseOrdens) {
    base.producao.projetos_simultaneos = ordensAtivas.length;
  }
  if (canUseOrdens && canUsePedidos) {
    base.producao.tempo_medio_fab_dias = Number(safeNumber(tempoMedioFabricacao, base.producao.tempo_medio_fab_dias).toFixed(1));
    base.producao.entregas_no_prazo_pct = Number(safeNumber(entregasNoPrazo, base.producao.entregas_no_prazo_pct).toFixed(1));
  }

  base.alertas = [
    {
      tipo: base.comercial.taxa_conversao >= base.comercial.conversao_meta ? "success" : "warning",
      setor: "Comercial",
      msg:
        base.comercial.taxa_conversao >= base.comercial.conversao_meta
          ? `Taxa de conversão em ${base.comercial.taxa_conversao.toFixed(1)}% no mês, dentro da meta.`
          : `Taxa de conversão em ${base.comercial.taxa_conversao.toFixed(1)}% no mês, abaixo da meta de ${base.comercial.conversao_meta}%.`,
    },
    {
      tipo: "success",
      setor: "Financeiro",
      msg: `Faturamento acumulado no ano atualizado para R$ ${Math.round(faturamentoYtd).toLocaleString("pt-BR")}.`,
    },
    {
      tipo: base.financeiro.prazo_medio_recebimento <= base.financeiro.prazo_meta ? "success" : "warning",
      setor: "Financeiro",
      msg: `Prazo médio de recebimento calculado em ${base.financeiro.prazo_medio_recebimento} dias.`,
    },
  ];
  if (canUseOrdens && canUsePedidos && entregasNoPrazoElegiveis.length > 0) {
    base.alertas.push({
      tipo: base.producao.entregas_no_prazo_pct >= base.producao.meta_entregas ? "success" : "warning",
      setor: "Produção",
      msg: `Entregas faturadas no prazo em ${base.producao.entregas_no_prazo_pct.toFixed(1)}% no ano, calculadas a partir de ordens vinculadas a pedidos com NF-e.`,
    });
  }

  const triedEndpoints = input.meta?.triedEndpoints ?? ["propostas", "pedidos", "contasReceber", "processos", "ordens"];
  const successfulEndpoints = input.meta?.successfulEndpoints ?? ["propostas", "pedidos", "contasReceber", "processos", "ordens"];
  const failedEndpoints = triedEndpoints.filter((endpoint) => !successfulEndpoints.includes(endpoint));
  const generatedAt = input.meta?.generatedAt ?? new Date().toISOString();
  const financeiroSources = ["sampleDashboardData", "nomus:pedidos", "nomus:contasReceber"];
  const comercialSources = ["sampleDashboardData"];
  const producaoSources = ["sampleDashboardData"];
  const comercialRealFields = [
    "oportunidades_mes",
    "orcamentos_emitidos",
    "taxa_conversao",
    "ticket_medio",
    "pipeline_ativo",
    "funil.oportunidades",
    "funil.orcados",
    "funil.fechados",
  ];
  const comercialMockFields = [
    "oportunidades_meta",
    "orcamentos_meta",
    "tempo_resposta_hrs",
    "tempo_meta_hrs",
    "conversao_meta",
    "ticket_meta",
    "pipeline_meta",
    "followup_pct",
    "followup_meta",
    "perdas_demora_mes",
    "perdas_demora_meta",
    "clientes_recorrencia",
    "recorrencia_meta",
    "receita_prospeccao_pct",
    "prospeccao_meta",
    "funil.qualificados",
    "funil.negociacao",
  ];
  const producaoRealFields: string[] = [];
  const producaoMockFields = [
    "entregas_no_prazo_pct",
    "meta_entregas",
    "projetos_simultaneos",
    "horas_retrabalho_pct",
    "meta_retrabalho",
    "tempo_medio_fab_dias",
    "meta_fab_dias",
    "travados_material",
    "meta_travados",
    "tempo_ceo_fabrica_pct",
    "meta_ceo_fabrica",
    "standups_realizados_pct",
    "meta_standups",
  ];

  if (canUsePropostas) {
    pushUnique(comercialSources, "nomus:propostas");
  }
  if (canUsePedidos) {
    pushUnique(comercialSources, "nomus:pedidos");
    pushUnique(comercialRealFields, "clientes_recorrencia");
  }
  if (canUseProcessos) {
    pushUnique(comercialSources, "nomus:processos");
    pushUnique(comercialRealFields, "funil.qualificados", "funil.negociacao");
  }
  if (canUseOrdens) {
    pushUnique(producaoSources, "nomus:ordens");
    pushUnique(producaoRealFields, "projetos_simultaneos");
  }
  if (canUseOrdens && canUsePedidos) {
    pushUnique(producaoSources, "nomus:pedidos");
    pushUnique(producaoRealFields, "entregas_no_prazo_pct", "tempo_medio_fab_dias");
  }

  base._meta = {
    data_source_status: "mixed",
    is_mixed: true,
    generated_from: ["sampleDashboardData", ...successfulEndpoints.map((endpoint) => `nomus:${endpoint}`)],
    last_successful_real_sync_at: generatedAt,
    source_coverage: {
      nomus: {
        tried_endpoints: triedEndpoints,
        successful_endpoints: successfulEndpoints,
        failed_endpoints: failedEndpoints,
      },
    },
    block_coverage: {
      financeiro: createBlockCoverage({
        status: "partial",
        sources: financeiroSources,
        real_fields: ["faturamento_mensal", "faturamento_ytd", "prazo_medio_recebimento", "reserva_caixa"],
        mock_fields: [
          "meta_anual",
          "margem_bruta",
          "margem_liquida",
          "margem_meta",
          "custo_fixo_mensal",
          "reserva_meta_meses",
          "prazo_meta",
          "custo_antecipacao_mensal",
          "dre_fechado_dia10",
          "fluxo_caixa_projetado",
          "pct_faturamento_reserva",
        ],
      }),
      comercial: createBlockCoverage({
        status: "partial",
        sources: comercialSources,
        real_fields: comercialRealFields,
        mock_fields: removeFields(comercialMockFields, comercialRealFields),
      }),
      orcamentacao: createBlockCoverage({
        status: "partial",
        sources: ["sampleDashboardData", "nomus:propostas"],
        real_fields: ["emitidos_mes"],
        mock_fields: [
          "meta_emitidos",
          "tempo_medio_resposta_hrs",
          "meta_tempo",
          "backlog",
          "meta_backlog",
          "pct_72h",
          "meta_72h",
          "templates_criados",
          "meta_templates",
          "desvio_template_pct",
          "meta_desvio",
          "perdas_demora",
          "meta_perdas",
        ],
      }),
      engenharia: createBlockCoverage({
        status: "mock",
        sources: ["sampleDashboardData"],
        real_fields: [],
        mock_fields: [
          "checklist_compliance",
          "meta_checklist",
          "tempo_medio_projeto_dias",
          "projetos_devolvidos_pct",
          "meta_devolvidos",
          "pops_documentados",
          "meta_pops_jun",
          "meta_pops_out",
          "bom_antecedencia_dias",
          "meta_bom_dias",
          "horas_retrabalho",
        ],
      }),
      producao: createBlockCoverage({
        status: producaoRealFields.length > 0 ? "partial" : "mock",
        sources: producaoSources,
        real_fields: producaoRealFields,
        mock_fields: removeFields(producaoMockFields, producaoRealFields),
      }),
      diretoria: createBlockCoverage({
        status: "mock",
        sources: ["sampleDashboardData"],
        real_fields: [],
        mock_fields: [
          "tempo_ceo_estrategico_pct",
          "meta_estrategico",
          "rituais_realizados",
          "roadmap_progresso_pct",
          "papeis_definidos",
          "agenda_ceo_blindada",
        ],
      }),
      alertas: createBlockCoverage({
        status: "partial",
        sources: Array.from(new Set(["sampleDashboardData", "nomus:propostas", "nomus:pedidos", "nomus:contasReceber", ...(canUseOrdens ? ["nomus:ordens"] : [])])),
        real_fields: ["alertas"],
        mock_fields: ["thresholds_e_metas_subjacentes"],
      }),
      acoes_pendentes: createBlockCoverage({
        status: "mock",
        sources: ["sampleDashboardData"],
        real_fields: [],
        mock_fields: ["acoes_pendentes"],
      }),
    },
  };

  return dashboardDataSchema.parse(base);
}
