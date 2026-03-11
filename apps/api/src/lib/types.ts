export type DashboardData = {
  periodo: string;
  financeiro: Record<string, unknown>;
  comercial: Record<string, unknown>;
  orcamentacao: Record<string, unknown>;
  engenharia: Record<string, unknown>;
  producao: Record<string, unknown>;
  diretoria: Record<string, unknown>;
  alertas: Array<Record<string, unknown>>;
  acoes_pendentes: Array<Record<string, unknown>>;
};

export type DashboardSnapshot = {
  id?: string;
  source: string;
  reference_date: string;
  payload: DashboardData;
  created_at?: string;
};
