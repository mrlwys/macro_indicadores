import { z } from "zod";

export const dashboardBlockStatusSchema = z.enum(["real", "partial", "mock"]);

export const dashboardBlockCoverageSchema = z.object({
  status: dashboardBlockStatusSchema,
  sources: z.array(z.string()).default([]),
  real_fields: z.array(z.string()).default([]),
  mock_fields: z.array(z.string()).default([]),
});

export const dashboardMetaSchema = z.object({
  data_source_status: z.enum(["mock", "mixed", "real"]),
  is_mixed: z.boolean(),
  generated_from: z.array(z.string()),
  last_successful_real_sync_at: z.string().datetime().nullable().optional(),
  source_coverage: z.object({
    nomus: z
      .object({
        tried_endpoints: z.array(z.string()),
        successful_endpoints: z.array(z.string()),
        failed_endpoints: z.array(z.string()),
      })
      .optional(),
    config: z
      .object({
        applied_keys: z.array(z.string()),
      })
      .optional(),
  }),
  block_coverage: z.object({
    financeiro: dashboardBlockCoverageSchema,
    comercial: dashboardBlockCoverageSchema,
    orcamentacao: dashboardBlockCoverageSchema,
    engenharia: dashboardBlockCoverageSchema,
    producao: dashboardBlockCoverageSchema,
    diretoria: dashboardBlockCoverageSchema,
    alertas: dashboardBlockCoverageSchema,
    acoes_pendentes: dashboardBlockCoverageSchema,
  }),
});

export const dashboardAlertSchema = z.object({
  tipo: z.enum(["danger", "warning", "success", "neutral"]),
  setor: z.string().min(1),
  msg: z.string().min(1),
});

export const dashboardActionSchema = z.object({
  acao: z.string().min(1),
  resp: z.string().min(1),
  prazo: z.string().min(1),
  status: z.enum(["em_andamento", "pendente", "concluida"]),
});

export const dashboardRevenueMonthSchema = z.object({
  mes: z.string().min(1),
  realizado: z.number().nullable(),
  meta: z.number(),
});

export const dashboardDataSchema = z.object({
  periodo: z.string().min(1),
  financeiro: z.object({
    faturamento_mensal: z.array(dashboardRevenueMonthSchema).length(12),
    faturamento_ytd: z.number(),
    meta_anual: z.number(),
    margem_bruta: z.number(),
    margem_liquida: z.number(),
    margem_meta: z.number(),
    custo_fixo_mensal: z.number(),
    reserva_caixa: z.number(),
    reserva_meta_meses: z.number(),
    prazo_medio_recebimento: z.number(),
    prazo_meta: z.number(),
    custo_antecipacao_mensal: z.number(),
    dre_fechado_dia10: z.boolean(),
    fluxo_caixa_projetado: z.boolean(),
    pct_faturamento_reserva: z.number(),
  }),
  comercial: z.object({
    oportunidades_mes: z.number(),
    oportunidades_meta: z.number(),
    orcamentos_emitidos: z.number(),
    orcamentos_meta: z.number(),
    tempo_resposta_hrs: z.number(),
    tempo_meta_hrs: z.number(),
    taxa_conversao: z.number(),
    conversao_meta: z.number(),
    ticket_medio: z.number(),
    ticket_meta: z.number(),
    pipeline_ativo: z.number(),
    pipeline_meta: z.number(),
    followup_pct: z.number(),
    followup_meta: z.number(),
    perdas_demora_mes: z.number(),
    perdas_demora_meta: z.number(),
    clientes_recorrencia: z.number(),
    recorrencia_meta: z.number(),
    receita_prospeccao_pct: z.number(),
    prospeccao_meta: z.number(),
    funil: z.object({
      oportunidades: z.number(),
      qualificados: z.number(),
      orcados: z.number(),
      negociacao: z.number(),
      fechados: z.number(),
    }),
  }),
  orcamentacao: z.object({
    emitidos_mes: z.number(),
    meta_emitidos: z.number(),
    tempo_medio_resposta_hrs: z.number(),
    meta_tempo: z.number(),
    backlog: z.number(),
    meta_backlog: z.number(),
    pct_72h: z.number(),
    meta_72h: z.number(),
    templates_criados: z.number(),
    meta_templates: z.number(),
    desvio_template_pct: z.number(),
    meta_desvio: z.number(),
    perdas_demora: z.number(),
    meta_perdas: z.number(),
  }),
  engenharia: z.object({
    checklist_compliance: z.number(),
    meta_checklist: z.number(),
    tempo_medio_projeto_dias: z.number(),
    projetos_devolvidos_pct: z.number(),
    meta_devolvidos: z.number(),
    pops_documentados: z.number(),
    meta_pops_jun: z.number(),
    meta_pops_out: z.number(),
    bom_antecedencia_dias: z.number(),
    meta_bom_dias: z.number(),
    horas_retrabalho: z.number(),
  }),
  producao: z.object({
    entregas_no_prazo_pct: z.number(),
    meta_entregas: z.number(),
    projetos_simultaneos: z.number(),
    horas_retrabalho_pct: z.number(),
    meta_retrabalho: z.number(),
    tempo_medio_fab_dias: z.number(),
    meta_fab_dias: z.number(),
    travados_material: z.number(),
    meta_travados: z.number(),
    tempo_ceo_fabrica_pct: z.number(),
    meta_ceo_fabrica: z.number(),
    standups_realizados_pct: z.number(),
    meta_standups: z.number(),
  }),
  diretoria: z.object({
    tempo_ceo_estrategico_pct: z.number(),
    meta_estrategico: z.number(),
    rituais_realizados: z.object({
      standup_prod: z.number().nullable(),
      pipeline_semanal: z.number().nullable(),
      eng_compras: z.number().nullable(),
      indicadores_mensal: z.number().nullable(),
      revisao_trimestral: z.number().nullable(),
    }),
    roadmap_progresso_pct: z.number(),
    papeis_definidos: z.boolean(),
    agenda_ceo_blindada: z.boolean(),
  }),
  alertas: z.array(dashboardAlertSchema),
  acoes_pendentes: z.array(dashboardActionSchema),
  _meta: dashboardMetaSchema.optional(),
});

export const dashboardSnapshotSchema = z.object({
  id: z.string().uuid().optional(),
  source: z.string().min(1),
  reference_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  payload: dashboardDataSchema,
  created_at: z.string().datetime().optional(),
});

export type DashboardAlert = z.infer<typeof dashboardAlertSchema>;
export type DashboardAction = z.infer<typeof dashboardActionSchema>;
export type DashboardRevenueMonth = z.infer<typeof dashboardRevenueMonthSchema>;
export type DashboardBlockCoverage = z.infer<typeof dashboardBlockCoverageSchema>;
export type DashboardMeta = z.infer<typeof dashboardMetaSchema>;
export type DashboardData = z.infer<typeof dashboardDataSchema>;
export type DashboardSnapshot = z.infer<typeof dashboardSnapshotSchema>;
