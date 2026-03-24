import { useState, useMemo } from "react";

// ============================================================
// DATA MODEL - All inputs needed to feed the dashboard
// ============================================================
const SAMPLE_DATA = {
  periodo: "Fevereiro 2026",
  financeiro: {
    faturamento_mensal: [
      { mes: "Jan", realizado: 334852, meta: 650000 },
      { mes: "Fev", realizado: 527453, meta: 700000 },
      { mes: "Mar", realizado: 580000, meta: 750000 },
      { mes: "Abr", realizado: 620000, meta: 780000 },
      { mes: "Mai", realizado: 710000, meta: 800000 },
      { mes: "Jun", realizado: 890000, meta: 833000 },
      { mes: "Jul", realizado: 780000, meta: 833000 },
      { mes: "Ago", realizado: 920000, meta: 833000 },
      { mes: "Set", realizado: null, meta: 833000 },
      { mes: "Out", realizado: null, meta: 833000 },
      { mes: "Nov", realizado: null, meta: 833000 },
      { mes: "Dez", realizado: null, meta: 833000 },
    ],
    faturamento_ytd: 5362305,
    meta_anual: 10000000,
    margem_bruta: 27.3,
    margem_liquida: 13.1,
    margem_meta: 12,
    custo_fixo_mensal: 285000,
    reserva_caixa: 198000,
    reserva_meta_meses: 2,
    prazo_medio_recebimento: 92,
    prazo_meta: 75,
    custo_antecipacao_mensal: 18500,
    dre_fechado_dia10: true,
    fluxo_caixa_projetado: true,
    pct_faturamento_reserva: 3.2,
  },
  comercial: {
    oportunidades_mes: 68,
    oportunidades_meta: 70,
    orcamentos_emitidos: 61,
    orcamentos_meta: 70,
    tempo_resposta_hrs: 58,
    tempo_meta_hrs: 72,
    taxa_conversao: 31.2,
    conversao_meta: 35,
    ticket_medio: 46200,
    ticket_meta: 50000,
    pipeline_ativo: 2850000,
    pipeline_meta: 2499000, // 3x meta mensal
    followup_pct: 87,
    followup_meta: 100,
    perdas_demora_mes: 8,
    perdas_demora_meta: 4,
    clientes_recorrencia: 6,
    recorrencia_meta: 10,
    receita_prospeccao_pct: 28,
    prospeccao_meta: 40,
    funil: {
      oportunidades: 68,
      qualificados: 52,
      orcados: 61,
      negociacao: 24,
      fechados: 18,
    },
  },
  orcamentacao: {
    emitidos_mes: 61,
    meta_emitidos: 70,
    tempo_medio_resposta_hrs: 58,
    meta_tempo: 72,
    backlog: 7,
    meta_backlog: 10,
    pct_72h: 82,
    meta_72h: 90,
    templates_criados: 6,
    meta_templates: 10,
    desvio_template_pct: 6.2,
    meta_desvio: 8,
    perdas_demora: 8,
    meta_perdas: 4,
  },
  engenharia: {
    checklist_compliance: 78,
    meta_checklist: 100,
    tempo_medio_projeto_dias: 12,
    projetos_devolvidos_pct: 8,
    meta_devolvidos: 5,
    pops_documentados: 3,
    meta_pops_jun: 5,
    meta_pops_out: 10,
    bom_antecedencia_dias: 3.5,
    meta_bom_dias: 5,
    horas_retrabalho: 32,
  },
  producao: {
    entregas_no_prazo_pct: 68,
    meta_entregas: 80,
    projetos_simultaneos: 8,
    horas_retrabalho_pct: 4.2,
    meta_retrabalho: 3,
    tempo_medio_fab_dias: 58,
    meta_fab_dias: 55,
    travados_material: 3,
    meta_travados: 2,
    tempo_ceo_fabrica_pct: 45,
    meta_ceo_fabrica: 30,
    standups_realizados_pct: 85,
    meta_standups: 100,
  },
  diretoria: {
    tempo_ceo_estrategico_pct: 38,
    meta_estrategico: 50,
    rituais_realizados: {
      standup_prod: 85,
      pipeline_semanal: 100,
      eng_compras: 75,
      indicadores_mensal: 100,
      revisao_trimestral: null,
    },
    roadmap_progresso_pct: 52,
    papeis_definidos: true,
    agenda_ceo_blindada: true,
  },
  alertas: [
    { tipo: "danger", setor: "Engenharia", msg: "Checklist compliance em 78% — meta é 100%. 2 projetos entraram sem validação completa esta semana." },
    { tipo: "warning", setor: "Orçamentação", msg: "8 perdas por demora este mês — meta é máximo 4. Backlog aumentou para 7 orçamentos pendentes." },
    { tipo: "warning", setor: "Produção", msg: "3 projetos travados por falta de material. Adenilton precisa alinhar com engenharia." },
    { tipo: "success", setor: "Financeiro", msg: "DRE gerencial fechado no dia 8. Margem líquida real identificada: 13,1% — acima da meta de 12%." },
    { tipo: "success", setor: "Comercial", msg: "Tempo de resposta de orçamento em 58h — dentro do SLA de 72h pela 3ª semana consecutiva." },
  ],
  acoes_pendentes: [
    { acao: "Contratar 2º orçamentista", resp: "Jorge", prazo: "15/Mar", status: "em_andamento" },
    { acao: "Completar 5 POPs de engenharia", resp: "Paulo", prazo: "30/Jun", status: "em_andamento" },
    { acao: "Reserva de caixa = 1 mês custo fixo", resp: "Amanda", prazo: "31/Ago", status: "em_andamento" },
    { acao: "Mapeamento de concorrência", resp: "Dir. Comercial", prazo: "31/Ago", status: "pendente" },
    { acao: "1ª proposta com automação integrada", resp: "Engenharia", prazo: "31/Jul", status: "pendente" },
    { acao: "Padronizar 3 linhas de equipamento", resp: "Engenharia + Comercial", prazo: "31/Out", status: "pendente" },
  ],
};

// ============================================================
// COMPONENTS
// ============================================================

const COLORS = {
  bg: "#0B1120",
  card: "#111827",
  cardHover: "#1a2332",
  border: "#1E293B",
  borderLight: "#334155",
  text: "#E2E8F0",
  textMuted: "#94A3B8",
  textDim: "#64748B",
  white: "#FFFFFF",
  blue: "#3B82F6",
  blueLight: "#60A5FA",
  blueDim: "#1E3A5F",
  green: "#10B981",
  greenLight: "#34D399",
  greenDim: "#064E3B",
  red: "#EF4444",
  redLight: "#F87171",
  redDim: "#7F1D1D",
  yellow: "#F59E0B",
  yellowLight: "#FBBF24",
  yellowDim: "#78350F",
  purple: "#8B5CF6",
  purpleLight: "#A78BFA",
  purpleDim: "#3B0764",
  orange: "#F97316",
  orangeLight: "#FB923C",
  orangeDim: "#7C2D12",
  cyan: "#06B6D4",
  cyanLight: "#22D3EE",
  cyanDim: "#164E63",
};

const SECTOR_COLORS = {
  financeiro: { main: COLORS.green, light: COLORS.greenLight, dim: COLORS.greenDim, label: "Financeiro" },
  comercial: { main: COLORS.blue, light: COLORS.blueLight, dim: COLORS.blueDim, label: "Comercial" },
  orcamentacao: { main: COLORS.purple, light: COLORS.purpleLight, dim: COLORS.purpleDim, label: "Orçamentação" },
  engenharia: { main: COLORS.cyan, light: COLORS.cyanLight, dim: COLORS.cyanDim, label: "Engenharia" },
  producao: { main: COLORS.orange, light: COLORS.orangeLight, dim: COLORS.orangeDim, label: "Produção" },
  diretoria: { main: COLORS.yellow, light: COLORS.yellowLight, dim: COLORS.yellowDim, label: "Diretoria" },
};

const COVERAGE_STYLES = {
  real: {
    label: "Dados reais",
    color: COLORS.greenLight,
    border: `${COLORS.green}45`,
    background: `${COLORS.green}14`,
  },
  mixed: {
    label: "Dados mistos",
    color: COLORS.blueLight,
    border: `${COLORS.blue}45`,
    background: `${COLORS.blue}14`,
  },
  partial: {
    label: "Cobertura parcial",
    color: COLORS.yellowLight,
    border: `${COLORS.yellow}45`,
    background: `${COLORS.yellow}14`,
  },
  mock: {
    label: "Mock",
    color: COLORS.textMuted,
    border: `${COLORS.textDim}55`,
    background: `${COLORS.textDim}14`,
  },
  unknown: {
    label: "Cobertura não informada",
    color: COLORS.textMuted,
    border: `${COLORS.textDim}55`,
    background: `${COLORS.textDim}14`,
  },
};

function getStatus(value, target, inverted = false) {
  if (value === null || value === undefined) return "neutral";
  const ratio = inverted ? target / value : value / target;
  if (ratio >= 0.95) return "good";
  if (ratio >= 0.75) return "warning";
  return "danger";
}

function statusColor(status) {
  if (status === "good") return COLORS.green;
  if (status === "warning") return COLORS.yellow;
  if (status === "danger") return COLORS.red;
  return COLORS.textDim;
}

function statusDot(status) {
  return (
    <span style={{
      display: "inline-block", width: 8, height: 8, borderRadius: "50%",
      background: statusColor(status), marginRight: 6, boxShadow: `0 0 6px ${statusColor(status)}60`
    }} />
  );
}

function formatBRL(v) {
  if (v === null || v === undefined) return "—";
  if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(0)}k`;
  return `R$ ${v.toFixed(0)}`;
}

function formatPct(v) { return v !== null && v !== undefined ? `${v.toFixed(1)}%` : "—"; }
function formatNum(v) { return v !== null && v !== undefined ? v.toLocaleString("pt-BR") : "—"; }
function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function resolveCoverageVisual(status) {
  return COVERAGE_STYLES[status] ?? COVERAGE_STYLES.unknown;
}

function getCoverageBlock(meta, block) {
  return meta?.block_coverage?.[block] ?? null;
}

function summarizeDashboardCoverage(dataProvided, payload) {
  const meta = payload?._meta;

  if (!meta) {
    if (!dataProvided) {
      return {
        status: "mock",
        label: "Mock local",
        description: "Exibindo a base local simulada enquanto nenhum snapshot compatível é carregado.",
        lastSuccessfulRealSyncAt: null,
      };
    }

    return {
      status: "unknown",
      label: "Cobertura não informada",
      description: "Este snapshot é compatível, mas não traz metadados de cobertura. Trate os blocos com cautela.",
      lastSuccessfulRealSyncAt: null,
    };
  }

  const coverages = Object.values(meta.block_coverage ?? {});
  const realBlocks = coverages.filter((block) => block.status === "real").length;
  const partialBlocks = coverages.filter((block) => block.status === "partial").length;
  const mockBlocks = coverages.filter((block) => block.status === "mock").length;
  const failedEndpoints = meta.source_coverage?.nomus?.failed_endpoints?.length ?? 0;

  if (failedEndpoints > 0) {
    return {
      status: "partial",
      label: "Cobertura parcial",
      description: `${failedEndpoints} endpoint(s) não contribuíram neste snapshot. Parte dos blocos pode estar desatualizada.`,
      lastSuccessfulRealSyncAt: meta.last_successful_real_sync_at ?? null,
    };
  }

  if (meta.data_source_status === "real") {
    return {
      status: "real",
      label: "Dados reais",
      description: `Snapshot montado com cobertura real nos blocos integrados${realBlocks ? ` (${realBlocks} bloco(s) totalmente reais)` : ""}.`,
      lastSuccessfulRealSyncAt: meta.last_successful_real_sync_at ?? null,
    };
  }

  if (meta.data_source_status === "mock") {
    return {
      status: "mock",
      label: "Dados simulados",
      description: "Snapshot montado a partir de base simulada. Use apenas para validação visual.",
      lastSuccessfulRealSyncAt: meta.last_successful_real_sync_at ?? null,
    };
  }

  return {
    status: "mixed",
    label: "Dados mistos",
    description: `${partialBlocks} bloco(s) parcial(is) e ${mockBlocks} em mock. O dashboard está visualmente íntegro, mas a cobertura ainda não é completa.`,
    lastSuccessfulRealSyncAt: meta.last_successful_real_sync_at ?? null,
  };
}

// Micro bar chart
function MiniBar({ data, color, height = 48 }) {
  const max = Math.max(...data.filter(d => d.v !== null).map(d => Math.max(d.v, d.m)));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height }}>
      {data.map((d, i) => {
        const h = d.v !== null ? (d.v / max) * height : 0;
        const metaH = (d.m / max) * height;
        const isAbove = d.v !== null && d.v >= d.m;
        return (
          <div key={i} style={{ position: "relative", flex: 1, height }} title={`${d.l}: ${d.v !== null ? formatBRL(d.v) : "—"} / Meta: ${formatBRL(d.m)}`}>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: metaH, borderTop: `1px dashed ${COLORS.textDim}` }} />
            <div style={{
              position: "absolute", bottom: 0, left: "15%", right: "15%", height: h,
              background: d.v !== null ? (isAbove ? `${color}CC` : `${COLORS.red}99`) : `${COLORS.textDim}33`,
              borderRadius: "2px 2px 0 0", transition: "height 0.5s ease"
            }} />
          </div>
        );
      })}
    </div>
  );
}

// Gauge ring
function GaugeRing({ value, target, size = 64, color, label, suffix = "%" }) {
  const pct = Math.min(value / target * 100, 100);
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const status = getStatus(value, target);
  const ringColor = statusColor(status);

  return (
    <div style={{ textAlign: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={COLORS.border} strokeWidth={5} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={ringColor} strokeWidth={5}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div style={{ marginTop: -size + 8, height: size - 8, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: COLORS.white }}>{value !== null ? value : "—"}{suffix && value !== null ? suffix : ""}</span>
      </div>
      {label && <div style={{ fontSize: 10, color: COLORS.textDim, marginTop: 4 }}>{label}</div>}
    </div>
  );
}

// KPI Card
function KPICard({ title, value, meta, format = "num", inverted = false, color, subtitle }) {
  const display = format === "brl" ? formatBRL(value) : format === "pct" ? formatPct(value) : formatNum(value);
  const metaDisplay = format === "brl" ? formatBRL(meta) : format === "pct" ? formatPct(meta) : formatNum(meta);
  const status = getStatus(value, meta, inverted);

  return (
    <div style={{
      background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "14px 16px",
      borderLeft: `3px solid ${statusColor(status)}`,
    }}>
      <div style={{ fontSize: 11, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{title}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: COLORS.white }}>{display}</span>
        <span style={{ fontSize: 11, color: COLORS.textDim }}>/ {metaDisplay}</span>
      </div>
      {subtitle && <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 4 }}>{subtitle}</div>}
      <div style={{ marginTop: 8, height: 3, background: COLORS.border, borderRadius: 2 }}>
        <div style={{
          height: "100%", borderRadius: 2, transition: "width 0.8s ease",
          width: `${Math.min((inverted ? meta / value : value / meta) * 100, 100)}%`,
          background: statusColor(status),
        }} />
      </div>
    </div>
  );
}

function CoverageBadge({ status, label, title }) {
  const visual = resolveCoverageVisual(status);

  return (
    <span
      title={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 8px",
        borderRadius: 999,
        border: `1px solid ${visual.border}`,
        background: visual.background,
        color: visual.color,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 0.3,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: visual.color, boxShadow: `0 0 10px ${visual.color}55` }} />
      {label ?? visual.label}
    </span>
  );
}

function SectionHeader({ color, label, icon, coverage }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 16, marginTop: 28,
      paddingBottom: 10, borderBottom: `2px solid ${color}40`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: `${color}20`, border: `1px solid ${color}40`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
        }}>{icon}</div>
        <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.white, letterSpacing: 0.3 }}>{label}</span>
      </div>
      {coverage ? <CoverageBadge status={coverage.status} /> : null}
    </div>
  );
}

// ============================================================
// MAIN DASHBOARD
// ============================================================
export default function DashboardGrupoMusso({ data, showHeader = true }) {
  const [activeTab, setActiveTab] = useState("geral");
  const d = data || SAMPLE_DATA;
  const dashboardSummary = summarizeDashboardCoverage(Boolean(data), d);
  const meta = d?._meta;
  const alertasCoverage = getCoverageBlock(meta, "alertas");
  const acoesCoverage = getCoverageBlock(meta, "acoes_pendentes");
  const comercialCoverage = getCoverageBlock(meta, "comercial");
  const orcamentacaoCoverage = getCoverageBlock(meta, "orcamentacao");
  const engenhariaCoverage = getCoverageBlock(meta, "engenharia");
  const producaoCoverage = getCoverageBlock(meta, "producao");
  const financeiroCoverage = getCoverageBlock(meta, "financeiro");

  const tabs = [
    { id: "geral", label: "Visão Geral", icon: "◉" },
    { id: "comercial", label: "Comercial", icon: "◈" },
    { id: "orcamento", label: "Orçamentos", icon: "◇" },
    { id: "engenharia", label: "Engenharia", icon: "⬡" },
    { id: "producao", label: "Produção", icon: "⬢" },
    { id: "financeiro", label: "Financeiro", icon: "◆" },
    { id: "inputs", label: "Inputs & Dados", icon: "⚙" },
  ];

  const faturamentoYTD = d.financeiro.faturamento_mensal.reduce((s, m) => s + (m.realizado || 0), 0);
  const metaYTD = d.financeiro.faturamento_mensal.reduce((s, m) => s + m.meta, 0);
  const mesesComDados = d.financeiro.faturamento_mensal.filter(m => m.realizado !== null).length;
  const faturamentoMedio = faturamentoYTD / mesesComDados;

  const healthScore = useMemo(() => {
    const checks = [
      d.financeiro.margem_liquida >= d.financeiro.margem_meta,
      d.comercial.taxa_conversao >= d.comercial.conversao_meta * 0.85,
      d.comercial.tempo_resposta_hrs <= d.comercial.tempo_meta_hrs,
      d.engenharia.checklist_compliance >= 90,
      d.producao.entregas_no_prazo_pct >= d.producao.meta_entregas * 0.85,
      d.financeiro.dre_fechado_dia10,
      d.producao.tempo_ceo_fabrica_pct <= d.producao.meta_ceo_fabrica * 1.2,
    ];
    return Math.round(checks.filter(Boolean).length / checks.length * 100);
  }, [d]);

  return (
    <div style={{
      minHeight: "100vh", background: COLORS.bg, color: COLORS.text,
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif", padding: 0,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${COLORS.bg}; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.borderLight}; border-radius: 3px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        .fade-in { animation: fadeIn 0.4s ease forwards; }
      `}</style>

      {/* HEADER */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.card} 0%, #0F172A 100%)`,
        borderBottom: `1px solid ${COLORS.border}`, padding: "16px 24px",
        display: showHeader ? "block" : "none",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `linear-gradient(135deg, ${COLORS.blue}, ${COLORS.cyan})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: COLORS.white }}>GM</div>
              <div>
                <h1 style={{ fontSize: 18, fontWeight: 700, color: COLORS.white, letterSpacing: -0.3 }}>GRUPO MUSSO</h1>
                <div style={{ fontSize: 11, color: COLORS.textDim }}>Dashboard Gerencial • {d.periodo}</div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: COLORS.textDim, textTransform: "uppercase" }}>Health Score</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: healthScore >= 70 ? COLORS.green : healthScore >= 50 ? COLORS.yellow : COLORS.red }}>{healthScore}%</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: COLORS.textDim, textTransform: "uppercase" }}>YTD</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.white }}>{formatBRL(faturamentoYTD)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: COLORS.textDim, textTransform: "uppercase" }}>Meta Anual</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.textMuted }}>{formatBRL(d.financeiro.meta_anual)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{
        display: "flex", gap: 2, padding: "0 24px", background: COLORS.card,
        borderBottom: `1px solid ${COLORS.border}`, overflowX: "auto",
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: "10px 16px", fontSize: 12, fontWeight: activeTab === t.id ? 700 : 500,
            color: activeTab === t.id ? COLORS.white : COLORS.textDim,
            background: activeTab === t.id ? `${COLORS.blue}15` : "transparent",
            border: "none", borderBottom: activeTab === t.id ? `2px solid ${COLORS.blue}` : "2px solid transparent",
            cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit", whiteSpace: "nowrap",
          }}>
            <span style={{ marginRight: 6 }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ padding: "20px 24px", maxWidth: 1400, margin: "0 auto" }} className="fade-in" key={activeTab}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 20,
          padding: "12px 14px",
          background: COLORS.card,
          border: `1px solid ${resolveCoverageVisual(dashboardSummary.status).border}`,
          borderRadius: 10,
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ fontSize: 11, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.5 }}>Origem dos dados</div>
              <CoverageBadge status={dashboardSummary.status} label={dashboardSummary.label} />
            </div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, lineHeight: 1.5 }}>{dashboardSummary.description}</div>
          </div>
          <div style={{ textAlign: "right", minWidth: 170 }}>
            <div style={{ fontSize: 10, color: COLORS.textDim, textTransform: "uppercase" }}>Última sync real</div>
            <div style={{ fontSize: 12, color: COLORS.text, fontWeight: 600 }}>
              {formatDateTime(dashboardSummary.lastSuccessfulRealSyncAt)}
            </div>
          </div>
        </div>

        {activeTab === "geral" && (
          <>
            {/* TOP ROW - Big numbers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
              <KPICard title="Faturamento Médio/Mês" value={faturamentoMedio} meta={833000} format="brl" subtitle={`${mesesComDados} meses apurados`} />
              <KPICard title="Margem Líquida" value={d.financeiro.margem_liquida} meta={d.financeiro.margem_meta} format="pct" />
              <KPICard title="Taxa de Conversão" value={d.comercial.taxa_conversao} meta={d.comercial.conversao_meta} format="pct" />
              <KPICard title="Entregas no Prazo" value={d.producao.entregas_no_prazo_pct} meta={d.producao.meta_entregas} format="pct" />
              <KPICard title="SLA 72h Orçamento" value={d.orcamentacao.pct_72h} meta={d.orcamentacao.meta_72h} format="pct" />
              <KPICard title="CEO no Estratégico" value={d.diretoria.tempo_ceo_estrategico_pct} meta={d.diretoria.meta_estrategico} format="pct" />
            </div>

            {/* REVENUE CHART */}
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.white, marginBottom: 12 }}>Faturamento Mensal vs Meta</div>
              <MiniBar
                data={d.financeiro.faturamento_mensal.map(m => ({ l: m.mes, v: m.realizado, m: m.meta }))}
                color={COLORS.blue} height={80}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                {d.financeiro.faturamento_mensal.map((m, i) => (
                  <span key={i} style={{ fontSize: 9, color: COLORS.textDim, flex: 1, textAlign: "center" }}>{m.mes}</span>
                ))}
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
                <span style={{ fontSize: 10, color: COLORS.textDim }}>
                  <span style={{ display: "inline-block", width: 8, height: 8, background: `${COLORS.blue}CC`, borderRadius: 2, marginRight: 4 }}/>Realizado
                </span>
                <span style={{ fontSize: 10, color: COLORS.textDim }}>
                  <span style={{ display: "inline-block", width: 8, height: 1, borderTop: `1px dashed ${COLORS.textDim}`, marginRight: 4, verticalAlign: "middle" }}/>Meta
                </span>
              </div>
            </div>

            {/* SECTOR GAUGES */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginBottom: 20 }}>
              {[
                { s: "comercial", gauges: [
                  { v: d.comercial.taxa_conversao, t: 35, l: "Conversão" },
                  { v: d.comercial.followup_pct, t: 100, l: "Follow-up" },
                  { v: d.comercial.receita_prospeccao_pct, t: 40, l: "Prospecção" },
                ]},
                { s: "orcamentacao", gauges: [
                  { v: d.orcamentacao.pct_72h, t: 90, l: "SLA 72h" },
                  { v: (d.orcamentacao.templates_criados / d.orcamentacao.meta_templates) * 100, t: 100, l: "Templates" },
                  { v: d.orcamentacao.emitidos_mes, t: 70, l: "Emitidos", suf: "" },
                ]},
                { s: "engenharia", gauges: [
                  { v: d.engenharia.checklist_compliance, t: 100, l: "Checklist" },
                  { v: (d.engenharia.pops_documentados / d.engenharia.meta_pops_jun) * 100, t: 100, l: "POPs" },
                  { v: 100 - d.engenharia.projetos_devolvidos_pct, t: 95, l: "Sem devolução" },
                ]},
                { s: "producao", gauges: [
                  { v: d.producao.entregas_no_prazo_pct, t: 80, l: "No prazo" },
                  { v: d.producao.standups_realizados_pct, t: 100, l: "Standups" },
                  { v: 100 - d.producao.horas_retrabalho_pct, t: 97, l: "Sem retrabalho" },
                ]},
              ].map(({ s, gauges }) => {
                const sc = SECTOR_COLORS[s];
                return (
                  <div key={s} style={{
                    background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 14,
                    borderTop: `2px solid ${sc.main}`,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: sc.light, marginBottom: 12 }}>{sc.label}</div>
                    <div style={{ display: "flex", justifyContent: "space-around" }}>
                      {gauges.map((g, i) => (
                        <GaugeRing key={i} value={Math.round(g.v)} target={g.t} size={58} color={sc.main} label={g.l} suffix={g.suf !== undefined ? g.suf : "%"} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ALERTS + ACTIONS */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.white }}>⚠ Alertas Ativos</div>
                  {alertasCoverage ? <CoverageBadge status={alertasCoverage.status} /> : null}
                </div>
                {alertasCoverage?.status && alertasCoverage.status !== "real" ? (
                  <div style={{ fontSize: 10, color: COLORS.textDim, lineHeight: 1.5, marginBottom: 10 }}>
                    Leitura parcial: estes alertas usam parte dos dados reais já integrados, mas ainda dependem de metas e blocos não totalmente conectados.
                  </div>
                ) : null}
                {d.alertas.map((a, i) => (
                  <div key={i} style={{
                    padding: "8px 10px", marginBottom: 6, borderRadius: 6, fontSize: 11, lineHeight: 1.4,
                    background:
                      a.tipo === "danger"
                        ? `${COLORS.red}10`
                        : a.tipo === "warning"
                          ? `${COLORS.yellow}10`
                          : a.tipo === "neutral"
                            ? `${COLORS.textDim}12`
                            : `${COLORS.green}10`,
                    borderLeft: `3px solid ${
                      a.tipo === "danger"
                        ? COLORS.red
                        : a.tipo === "warning"
                          ? COLORS.yellow
                          : a.tipo === "neutral"
                            ? COLORS.textDim
                            : COLORS.green
                    }`,
                    color: COLORS.textMuted,
                  }}>
                    <span style={{
                      color:
                        a.tipo === "danger"
                          ? COLORS.redLight
                          : a.tipo === "warning"
                            ? COLORS.yellowLight
                            : a.tipo === "neutral"
                              ? COLORS.text
                              : COLORS.greenLight,
                      fontWeight: 600,
                    }}>{a.setor}: </span>
                    {a.msg}
                  </div>
                ))}
              </div>
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.white }}>📋 Ações do Roadmap</div>
                  {acoesCoverage ? <CoverageBadge status={acoesCoverage.status} /> : null}
                </div>
                {d.acoes_pendentes.map((a, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "7px 10px", marginBottom: 4, borderRadius: 6, fontSize: 11,
                    background: `${COLORS.border}40`,
                  }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ color: COLORS.text }}>{a.acao}</span>
                      <span style={{ color: COLORS.textDim, marginLeft: 8 }}>• {a.resp}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 10, color: COLORS.textDim }}>{a.prazo}</span>
                      <span style={{
                        fontSize: 9, padding: "2px 6px", borderRadius: 4, fontWeight: 600,
                        background: a.status === "em_andamento" ? `${COLORS.blue}20` : `${COLORS.textDim}20`,
                        color: a.status === "em_andamento" ? COLORS.blueLight : COLORS.textDim,
                      }}>{a.status === "em_andamento" ? "EM ANDAMENTO" : "PENDENTE"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === "comercial" && (
          <>
            <SectionHeader color={COLORS.blue} label="Painel Comercial" icon="◈" coverage={comercialCoverage} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 20 }}>
              <KPICard title="Oportunidades/Mês" value={d.comercial.oportunidades_mes} meta={d.comercial.oportunidades_meta} />
              <KPICard title="Orçamentos Emitidos" value={d.comercial.orcamentos_emitidos} meta={d.comercial.orcamentos_meta} />
              <KPICard title="Tempo Resposta (h)" value={d.comercial.tempo_resposta_hrs} meta={d.comercial.tempo_meta_hrs} inverted subtitle="Menor = melhor" />
              <KPICard title="Taxa Conversão" value={d.comercial.taxa_conversao} meta={d.comercial.conversao_meta} format="pct" />
              <KPICard title="Ticket Médio" value={d.comercial.ticket_medio} meta={d.comercial.ticket_meta} format="brl" />
              <KPICard title="Pipeline Ativo" value={d.comercial.pipeline_ativo} meta={d.comercial.pipeline_meta} format="brl" />
              <KPICard title="Follow-up (%)" value={d.comercial.followup_pct} meta={d.comercial.followup_meta} format="pct" />
              <KPICard title="Perdas por Demora" value={d.comercial.perdas_demora_mes} meta={d.comercial.perdas_demora_meta} inverted subtitle="Menor = melhor" />
              <KPICard title="Clientes Recorrentes" value={d.comercial.clientes_recorrencia} meta={d.comercial.recorrencia_meta} />
              <KPICard title="Receita Prospecção" value={d.comercial.receita_prospeccao_pct} meta={d.comercial.prospeccao_meta} format="pct" />
            </div>
            {/* FUNNEL */}
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.white, marginBottom: 16 }}>Funil Comercial do Mês</div>
              {Object.entries(d.comercial.funil).map(([key, val], i, arr) => {
                const labels = { oportunidades: "Oportunidades", qualificados: "Qualificados", orcados: "Orçados", negociacao: "Em Negociação", fechados: "Fechados" };
                const maxVal = arr[0][1];
                const pct = (val / maxVal) * 100;
                return (
                  <div key={key} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 11, color: COLORS.textMuted }}>{labels[key]}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.white }}>{val}</span>
                    </div>
                    <div style={{ height: 18, background: COLORS.border, borderRadius: 4 }}>
                      <div style={{
                        height: "100%", borderRadius: 4, transition: "width 0.8s ease",
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${COLORS.blue}${i === arr.length - 1 ? "" : "90"}, ${COLORS.cyan}${i === arr.length - 1 ? "" : "70"})`,
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === "orcamento" && (
          <>
            <SectionHeader color={COLORS.purple} label="Painel de Orçamentação" icon="◇" coverage={orcamentacaoCoverage} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 20 }}>
              <KPICard title="Emitidos/Mês" value={d.orcamentacao.emitidos_mes} meta={d.orcamentacao.meta_emitidos} />
              <KPICard title="Tempo Resposta (h)" value={d.orcamentacao.tempo_medio_resposta_hrs} meta={d.orcamentacao.meta_tempo} inverted />
              <KPICard title="Backlog (fila)" value={d.orcamentacao.backlog} meta={d.orcamentacao.meta_backlog} inverted />
              <KPICard title="% em 72h" value={d.orcamentacao.pct_72h} meta={d.orcamentacao.meta_72h} format="pct" />
              <KPICard title="Templates Criados" value={d.orcamentacao.templates_criados} meta={d.orcamentacao.meta_templates} subtitle="Meta: 10 até Jun" />
              <KPICard title="Desvio Template" value={d.orcamentacao.desvio_template_pct} meta={d.orcamentacao.meta_desvio} format="pct" inverted subtitle="Menor = melhor" />
              <KPICard title="Perdas por Demora" value={d.orcamentacao.perdas_demora} meta={d.orcamentacao.meta_perdas} inverted />
            </div>
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.white, marginBottom: 8 }}>Semáforo de Backlog</div>
              <div style={{ display: "flex", gap: 12 }}>
                {[
                  { label: "< 48h", count: 3, color: COLORS.green },
                  { label: "48-72h", count: 2, color: COLORS.yellow },
                  { label: "> 72h", count: 2, color: COLORS.red },
                ].map((s, i) => (
                  <div key={i} style={{ flex: 1, background: `${s.color}10`, border: `1px solid ${s.color}30`, borderRadius: 8, padding: 12, textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.count}</div>
                    <div style={{ fontSize: 10, color: COLORS.textDim, marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === "engenharia" && (
          <>
            <SectionHeader color={COLORS.cyan} label="Painel de Engenharia" icon="⬡" coverage={engenhariaCoverage} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 20 }}>
              <KPICard title="Checklist Compliance" value={d.engenharia.checklist_compliance} meta={d.engenharia.meta_checklist} format="pct" />
              <KPICard title="Tempo Médio Projeto" value={d.engenharia.tempo_medio_projeto_dias} meta={15} subtitle="dias (referência)" />
              <KPICard title="Projetos Devolvidos" value={d.engenharia.projetos_devolvidos_pct} meta={d.engenharia.meta_devolvidos} format="pct" inverted />
              <KPICard title="POPs Documentados" value={d.engenharia.pops_documentados} meta={d.engenharia.meta_pops_jun} subtitle="Meta Jun: 5 / Out: 10" />
              <KPICard title="BOM Antecedência" value={d.engenharia.bom_antecedencia_dias} meta={d.engenharia.meta_bom_dias} subtitle="dias antes da produção" />
              <KPICard title="Horas Retrabalho" value={d.engenharia.horas_retrabalho} meta={20} inverted subtitle="horas/mês" />
            </div>
          </>
        )}

        {activeTab === "producao" && (
          <>
            <SectionHeader color={COLORS.orange} label="Painel de Produção" icon="⬢" coverage={producaoCoverage} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 20 }}>
              <KPICard title="Entregas no Prazo" value={d.producao.entregas_no_prazo_pct} meta={d.producao.meta_entregas} format="pct" />
              <KPICard title="Projetos Simultâneos" value={d.producao.projetos_simultaneos} meta={10} subtitle="capacidade estimada" />
              <KPICard title="Retrabalho (%)" value={d.producao.horas_retrabalho_pct} meta={d.producao.meta_retrabalho} format="pct" inverted />
              <KPICard title="Tempo Médio Fab." value={d.producao.tempo_medio_fab_dias} meta={d.producao.meta_fab_dias} inverted subtitle="dias" />
              <KPICard title="Travados por Material" value={d.producao.travados_material} meta={d.producao.meta_travados} inverted subtitle="projetos/mês" />
              <KPICard title="CEO na Fábrica" value={d.producao.tempo_ceo_fabrica_pct} meta={d.producao.meta_ceo_fabrica} format="pct" inverted subtitle="Menor = melhor" />
              <KPICard title="Standups Realizados" value={d.producao.standups_realizados_pct} meta={d.producao.meta_standups} format="pct" />
            </div>
          </>
        )}

        {activeTab === "financeiro" && (
          <>
            <SectionHeader color={COLORS.green} label="Painel Financeiro" icon="◆" coverage={financeiroCoverage} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 20 }}>
              <KPICard title="Faturamento YTD" value={faturamentoYTD} meta={d.financeiro.meta_anual} format="brl" />
              <KPICard title="Faturamento Médio/Mês" value={faturamentoMedio} meta={833000} format="brl" />
              <KPICard title="Margem Bruta" value={d.financeiro.margem_bruta} meta={25} format="pct" />
              <KPICard title="Margem Líquida" value={d.financeiro.margem_liquida} meta={d.financeiro.margem_meta} format="pct" />
              <KPICard title="Prazo Recebimento" value={d.financeiro.prazo_medio_recebimento} meta={d.financeiro.prazo_meta} inverted subtitle="dias — menor = melhor" />
              <KPICard title="Reserva de Caixa" value={d.financeiro.reserva_caixa} meta={d.financeiro.custo_fixo_mensal * d.financeiro.reserva_meta_meses} format="brl" subtitle={`Meta: ${d.financeiro.reserva_meta_meses} meses custo fixo`} />
              <KPICard title="Custo Antecipação/Mês" value={d.financeiro.custo_antecipacao_mensal} meta={10000} format="brl" inverted subtitle="FIDCs — menor = melhor" />
              <KPICard title="% Fatur. → Reserva" value={d.financeiro.pct_faturamento_reserva} meta={5} format="pct" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.white, marginBottom: 10 }}>Controles Operacionais</div>
                {[
                  { label: "DRE fechado até dia 10", ok: d.financeiro.dre_fechado_dia10 },
                  { label: "Fluxo de caixa projetado 90 dias", ok: d.financeiro.fluxo_caixa_projetado },
                ].map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", fontSize: 12 }}>
                    <span style={{ fontSize: 16, color: c.ok ? COLORS.green : COLORS.red }}>{c.ok ? "✓" : "✗"}</span>
                    <span style={{ color: c.ok ? COLORS.text : COLORS.textDim }}>{c.label}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.white, marginBottom: 10 }}>Estrutura da DRE</div>
                {[
                  { l: "Receita Bruta", v: faturamentoMedio, c: COLORS.text },
                  { l: "(-) Impostos", v: -faturamentoMedio * 0.085, c: COLORS.redLight },
                  { l: "(=) Receita Líquida", v: faturamentoMedio * 0.915, c: COLORS.white, bold: true },
                  { l: "(-) CPV", v: -faturamentoMedio * 0.915 * 0.702, c: COLORS.redLight },
                  { l: "(=) Margem Bruta", v: faturamentoMedio * 0.915 * 0.298, c: COLORS.greenLight, bold: true },
                  { l: "(-) Despesas Op.", v: -faturamentoMedio * 0.915 * 0.155, c: COLORS.redLight },
                  { l: "(=) EBITDA", v: faturamentoMedio * 0.915 * 0.143, c: COLORS.greenLight, bold: true },
                ].map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 11, fontWeight: r.bold ? 700 : 400, color: r.c, borderTop: r.bold ? `1px solid ${COLORS.border}` : "none" }}>
                    <span>{r.l}</span><span>{formatBRL(r.v)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === "inputs" && (
          <>
            <SectionHeader color={COLORS.textMuted} label="Especificação de Inputs — Estrutura de Dados" icon="⚙" />
            <p style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 16, lineHeight: 1.6 }}>
              Abaixo está a especificação completa de todos os dados que precisam ser coletados para alimentar este dashboard.
              Cada setor tem seus inputs obrigatórios, a frequência de coleta, e quem é responsável por fornecer o dado.
            </p>

            {[
              { setor: "Financeiro", color: COLORS.green, inputs: [
                { campo: "faturamento_mensal", tipo: "R$ (moeda)", freq: "Mensal", fonte: "NFs emitidas", resp: "Amanda", obs: "Faturamento bruto total de NFs do mês" },
                { campo: "margem_bruta", tipo: "% (percentual)", freq: "Mensal", fonte: "DRE gerencial", resp: "Amanda", obs: "Receita Líq. - CPV / Receita Líq." },
                { campo: "margem_liquida", tipo: "% (percentual)", freq: "Mensal", fonte: "DRE gerencial", resp: "Amanda", obs: "Resultado Líq. / Receita Bruta" },
                { campo: "custo_fixo_mensal", tipo: "R$ (moeda)", freq: "Mensal", fonte: "Financeiro", resp: "Amanda", obs: "Folha + encargos + aluguel + energia + fixos" },
                { campo: "reserva_caixa", tipo: "R$ (moeda)", freq: "Semanal", fonte: "Conta separada", resp: "Amanda", obs: "Saldo acumulado na conta de reserva" },
                { campo: "prazo_medio_recebimento", tipo: "Dias (inteiro)", freq: "Mensal", fonte: "Contas a receber", resp: "Amanda", obs: "Média ponderada dos prazos de recebimento" },
                { campo: "custo_antecipacao", tipo: "R$ (moeda)", freq: "Mensal", fonte: "Extratos FIDCs", resp: "Edineia", obs: "Total de taxas e juros pagos em antecipações" },
                { campo: "dre_fechado_dia10", tipo: "Sim/Não", freq: "Mensal", fonte: "Auto-reporte", resp: "Amanda", obs: "DRE do mês anterior fechado até dia 10?" },
                { campo: "fluxo_caixa_projetado", tipo: "Sim/Não", freq: "Semanal", fonte: "Auto-reporte", resp: "Amanda", obs: "Projeção 90 dias atualizada?" },
              ]},
              { setor: "Comercial", color: COLORS.blue, inputs: [
                { campo: "oportunidades_recebidas", tipo: "Quantidade", freq: "Semanal", fonte: "CRM", resp: "Jorge", obs: "Total de novas oportunidades na semana" },
                { campo: "orcamentos_emitidos", tipo: "Quantidade", freq: "Semanal", fonte: "CRM", resp: "Jorge", obs: "Or\u00E7amentos efetivamente enviados ao cliente" },
                { campo: "tempo_resposta_orcamento", tipo: "Horas (média)", freq: "Semanal", fonte: "CRM", resp: "Jorge", obs: "Data entrada - data envio do orçamento" },
                { campo: "taxa_conversao", tipo: "% (percentual)", freq: "Mensal", fonte: "CRM", resp: "Jorge", obs: "Fechados / orçamentos emitidos no período" },
                { campo: "ticket_medio", tipo: "R$ (moeda)", freq: "Mensal", fonte: "CRM + NFs", resp: "Jorge", obs: "Faturamento / nº projetos fechados" },
                { campo: "pipeline_ativo", tipo: "R$ (moeda)", freq: "Semanal", fonte: "CRM", resp: "Jorge", obs: "Soma de todos orçamentos em aberto (não decididos)" },
                { campo: "followup_realizado", tipo: "% (percentual)", freq: "Semanal", fonte: "CRM", resp: "Jorge", obs: "% orçamentos com follow-up feito (D+3,7,14)" },
                { campo: "perdas_por_demora", tipo: "Quantidade", freq: "Mensal", fonte: "CRM", resp: "Jorge", obs: "Oportunidades perdidas com motivo = demora" },
                { campo: "motivos_de_perda", tipo: "Texto categorizado", freq: "Por evento", fonte: "CRM", resp: "Jorge", obs: "Preço / Prazo / Concorrente / Desistiu / Não respondeu" },
                { campo: "clientes_recorrentes", tipo: "Quantidade", freq: "Trimestral", fonte: "CRM + NFs", resp: "Dir. Comercial", obs: "Clientes com 2+ compras nos últimos 12 meses" },
                { campo: "receita_prospeccao_ativa", tipo: "% (percentual)", freq: "Mensal", fonte: "CRM", resp: "Dir. Comercial", obs: "Receita de clientes vindos de prospecção ativa / total" },
              ]},
              { setor: "Orçamentação", color: COLORS.purple, inputs: [
                { campo: "backlog_orcamentos", tipo: "Quantidade", freq: "Diário", fonte: "Planilha/CRM", resp: "Vitor", obs: "Orçamentos na fila aguardando elaboração" },
                { campo: "backlog_por_faixa", tipo: "Qtd por faixa", freq: "Diário", fonte: "Planilha", resp: "Vitor", obs: "<48h / 48-72h / >72h (semáforo)" },
                { campo: "templates_criados", tipo: "Quantidade", freq: "Mensal", fonte: "Pasta de templates", resp: "Vitor", obs: "Templates finalizados e validados" },
                { campo: "desvio_template_real", tipo: "% (percentual)", freq: "Mensal", fonte: "Comparação", resp: "Vitor", obs: "Desvio médio entre template e orçamento real" },
              ]},
              { setor: "Engenharia", color: COLORS.cyan, inputs: [
                { campo: "projetos_liberados_checklist", tipo: "% (percentual)", freq: "Semanal", fonte: "Formulários", resp: "Paulo", obs: "% projetos que passaram pelo checklist completo" },
                { campo: "projetos_devolvidos", tipo: "% (percentual)", freq: "Semanal", fonte: "Registro", resp: "Paulo", obs: "% projetos devolvidos por info incompleta" },
                { campo: "tempo_medio_projeto", tipo: "Dias (média)", freq: "Mensal", fonte: "Registro", resp: "Paulo", obs: "Da entrada do pedido à liberação para produção" },
                { campo: "pops_documentados", tipo: "Quantidade", freq: "Mensal", fonte: "Pasta POPs", resp: "Paulo", obs: "POPs finalizados por família de equipamento" },
                { campo: "bom_antecedencia", tipo: "Dias (média)", freq: "Semanal", fonte: "Registro", resp: "Paulo", obs: "Dias entre envio BOM para compras e início prod." },
                { campo: "horas_retrabalho_projeto", tipo: "Horas", freq: "Mensal", fonte: "Registro", resp: "Paulo", obs: "Horas gastas corrigindo projetos já liberados" },
              ]},
              { setor: "Produção", color: COLORS.orange, inputs: [
                { campo: "entregas_no_prazo", tipo: "% (percentual)", freq: "Semanal", fonte: "Quadro prod.", resp: "Líderes", obs: "Projetos entregues na data vs total entregues" },
                { campo: "projetos_em_andamento", tipo: "Quantidade", freq: "Semanal", fonte: "Quadro prod.", resp: "Líderes", obs: "Projetos simultâneos em fabricação" },
                { campo: "horas_retrabalho", tipo: "% (percentual)", freq: "Mensal", fonte: "Apontamento", resp: "Líderes", obs: "Horas retrabalho / total horas produtivas" },
                { campo: "tempo_medio_fabricacao", tipo: "Dias (média)", freq: "Mensal", fonte: "Registro", resp: "Líderes", obs: "Data início fabricação - data conclusão" },
                { campo: "travados_por_material", tipo: "Quantidade", freq: "Semanal", fonte: "Quadro prod.", resp: "Líderes", obs: "Projetos parados por falta de material" },
                { campo: "tempo_ceo_fabrica", tipo: "% (percentual)", freq: "Semanal", fonte: "Auto-reporte", resp: "Romulo", obs: "Estimativa: % tempo na fábrica vs escritório" },
                { campo: "standups_realizados", tipo: "% (percentual)", freq: "Semanal", fonte: "Registro", resp: "Líderes", obs: "Standups diários realizados / dias úteis" },
              ]},
              { setor: "Diretoria", color: COLORS.yellow, inputs: [
                { campo: "tempo_ceo_estrategico", tipo: "% (percentual)", freq: "Semanal", fonte: "Auto-reporte", resp: "Romulo", obs: "% tempo em gestão estratégica vs operacional" },
                { campo: "rituais_realizados", tipo: "Sim/Não p/ ritual", freq: "Semanal", fonte: "Atas", resp: "Romulo", obs: "Cada ritual agendado foi realizado?" },
                { campo: "roadmap_progresso", tipo: "% (percentual)", freq: "Mensal", fonte: "Checklist BP", resp: "Romulo", obs: "Ações do roadmap concluídas / total planejado" },
                { campo: "acoes_pendentes", tipo: "Lista", freq: "Semanal", fonte: "Atas reuniões", resp: "Romulo", obs: "Ações em aberto com responsável e prazo" },
              ]},
            ].map(({ setor, color, inputs }) => (
              <div key={setor} style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color, marginBottom: 8, paddingBottom: 6, borderBottom: `1px solid ${color}30` }}>{setor}</div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                    <thead>
                      <tr>
                        {["Campo", "Tipo", "Frequência", "Fonte", "Responsável", "Observação"].map(h => (
                          <th key={h} style={{ textAlign: "left", padding: "6px 8px", borderBottom: `1px solid ${COLORS.border}`, color: COLORS.textDim, fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {inputs.map((inp, i) => (
                        <tr key={i} style={{ background: i % 2 ? `${COLORS.border}20` : "transparent" }}>
                          <td style={{ padding: "5px 8px", color: COLORS.white, fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>{inp.campo}</td>
                          <td style={{ padding: "5px 8px", color: COLORS.textMuted }}>{inp.tipo}</td>
                          <td style={{ padding: "5px 8px", color: COLORS.textMuted }}>{inp.freq}</td>
                          <td style={{ padding: "5px 8px", color: COLORS.textMuted }}>{inp.fonte}</td>
                          <td style={{ padding: "5px 8px", color, fontWeight: 600 }}>{inp.resp}</td>
                          <td style={{ padding: "5px 8px", color: COLORS.textDim }}>{inp.obs}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            <div style={{ background: `${COLORS.yellow}10`, border: `1px solid ${COLORS.yellow}30`, borderRadius: 10, padding: 16, marginTop: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.yellowLight, marginBottom: 8 }}>Resumo: Estrutura do Sistema</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, lineHeight: 1.6 }}>
                <strong style={{ color: COLORS.white }}>Total de inputs:</strong> 47 campos de dados distribuídos em 6 setores.<br/>
                <strong style={{ color: COLORS.white }}>Coleta diária:</strong> 2 campos (backlog orçamentos).<br/>
                <strong style={{ color: COLORS.white }}>Coleta semanal:</strong> 22 campos (maioria operacional).<br/>
                <strong style={{ color: COLORS.white }}>Coleta mensal:</strong> 19 campos (financeiro + consolidações).<br/>
                <strong style={{ color: COLORS.white }}>Coleta trimestral:</strong> 2 campos (clientes recorrentes, POPs).<br/>
                <strong style={{ color: COLORS.white }}>Por evento:</strong> 2 campos (motivos de perda, alertas).<br/><br/>
                <strong style={{ color: COLORS.white }}>Fontes principais:</strong> CRM (16 campos), registros/planilhas internos (15), DRE/financeiro (9), auto-reporte (5), formulários (2).<br/>
                <strong style={{ color: COLORS.white }}>Responsáveis:</strong> Jorge (11), Amanda (7), Paulo (6), Líderes produção (5), Vitor (4), Romulo (4), Dir. Comercial (3), Edineia (1), outros (6).
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
