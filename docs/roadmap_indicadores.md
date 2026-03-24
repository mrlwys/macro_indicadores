# Roadmap de Indicadores - Dashboard Grupo Musso

Atualizado em: **11/03/2026**

## Legenda de status

- **REAL**: indicador já alimentado por dados reais (Nomus -> Supabase -> API -> front-end).
- **PARCIAL**: indicador combina dado real com regra fixa, aproximação ou valor de referência em mock.
- **MOCK**: indicador ainda vem de valor estático (`sampleDashboardData`) ou está hardcoded no front-end.

## Estado atual por indicador

### 1) Cabeçalho e visão geral

| Indicador (front-end)  | Campo/cálculo atual                               | Status  | Fonte atual                                  | Fonte do dado | Pendência principal                                        |
| ---------------------- | ------------------------------------------------- | ------- | -------------------------------------------- | ------------- | ---------------------------------------------------------- |
| Período                | `periodo`                                         | PARCIAL | Data atual do servidor (`formatPeriodoPtBr`) |               | Opcional: alinhar período à competência real do fechamento |
| Health Score           | Cálculo no front (`healthScore`)                  | PARCIAL | 1 regra real + 6 regras em mock              |               | Migrar as regras que ainda dependem de campos mock         |
| YTD (cabeçalho)        | Soma de `financeiro.faturamento_mensal.realizado` | REAL    | `pedidos`                                    | NOMUS         | Nenhuma técnica crítica                                    |
| Meta anual (cabeçalho) | `financeiro.meta_anual`                           | MOCK    | `sampleDashboardData`                        | CONFIG        | Criar tabela de metas por ano                              |
| Faturamento Médio/Mês  | `faturamentoYTD / mesesComDados`                  | REAL    | `pedidos`                                    | NOMUS         | Nenhuma técnica crítica                                    |
| Margem Líquida         | `financeiro.margem_liquida`                       | MOCK    | `sampleDashboardData`                        |               | Conectar DRE real                                          |
| Taxa de Conversão      | `comercial.taxa_conversao`                        | REAL    | `propostas` + `pedidos`                      | NOMUS         | Refinar regra de vínculo proposta->pedido                  |
| Entregas no Prazo      | `producao.entregas_no_prazo_pct`                  | MOCK    | `sampleDashboardData`                        | NOMUS         | Conectar módulo de produção                                |
| SLA 72h Orçamento      | `orcamentacao.pct_72h`                            | MOCK    | `sampleDashboardData`                        | NOMUS         | Conectar tempos de orçamentação                            |
| CEO no Estratégico     | `diretoria.tempo_ceo_estrategico_pct`             | MOCK    | `sampleDashboardData`                        |               | Criar input manual com histórico                           |

### 2) Comercial

| Indicador (front-end) | Campo/cálculo atual                | Status  | Fonte atual                       | Fonte do dado | Pendência principal                          |
| --------------------- | ---------------------------------- | ------- | --------------------------------- | ------------- | -------------------------------------------- |
| Oportunidades/Mês     | `comercial.oportunidades_mes`      | REAL    | `propostas`                       | NOMUS         | Nenhuma técnica crítica                      |
| Orçamentos Emitidos   | `comercial.orcamentos_emitidos`    | REAL    | `propostas`                       | NOMUS         | Validar conceito de "emitido" no ERP         |
| Tempo de Resposta (h) | `comercial.tempo_resposta_hrs`     | MOCK    | `sampleDashboardData`             | NOMUS         | Precisar carimbo de envio de orçamento       |
| Taxa de Conversão     | `comercial.taxa_conversao`         | REAL    | `propostas` + `pedidos`           | NOMUS         | Melhorar rastreabilidade de conversão        |
| Ticket Médio          | `comercial.ticket_medio`           | REAL    | `pedidos`                         | NOMUS         | Nenhuma técnica crítica                      |
| Pipeline Ativo        | `comercial.pipeline_ativo`         | REAL    | `propostas` (janela 90 dias)      | NOMUS         | Ajustar critério de pipeline por status real |
| Follow-up (%)         | `comercial.followup_pct`           | MOCK    | `sampleDashboardData`             | NOMUS         | Integrar atividades/tarefas comerciais       |
| Perdas por Demora     | `comercial.perdas_demora_mes`      | MOCK    | `sampleDashboardData`             | NOMUS         | Integrar motivo de perda/status de proposta  |
| Clientes Recorrentes  | `comercial.clientes_recorrencia`   | MOCK    | `sampleDashboardData`             | NOMUS         | Integrar histórico por cliente               |
| Receita de Prospecção | `comercial.receita_prospeccao_pct` | MOCK    | `sampleDashboardData`             | NOMUS         | Classificar origem de oportunidade           |
| Funil - Oportunidades | `comercial.funil.oportunidades`    | REAL    | `propostas`                       | NOMUS         | Nenhuma técnica crítica                      |
| Funil - Qualificados  | `comercial.funil.qualificados`     | PARCIAL | Estimativa (76% de oportunidades) | NOMUS         | Ler etapa real do funil                      |
| Funil - Orçados       | `comercial.funil.orcados`          | REAL    | `propostas`                       | NOMUS         | Refinar conceito com status real             |
| Funil - Negociação    | `comercial.funil.negociacao`       | PARCIAL | Estimativa (42% de oportunidades) | NOMUS         | Ler etapa real do funil                      |
| Funil - Fechados      | `comercial.funil.fechados`         | REAL    | `pedidos`                         | NOMUS         | Melhorar vínculo com proposta original       |

### 3) Orçamentação

| Indicador (front-end) | Campo/cálculo atual | Status | Fonte atual | Fonte do dado | Pendência principal |
| --- | --- | --- | --- | --- | --- |
| Emitidos/Mês | `orcamentacao.emitidos_mes` | REAL | `propostas` |  | Validar definição operacional de "emitido" |
| Tempo de Resposta (h) | `orcamentacao.tempo_medio_resposta_hrs` | MOCK | `sampleDashboardData` |  | Capturar timestamps de entrada e envio |
| Backlog (fila) | `orcamentacao.backlog` | MOCK | `sampleDashboardData` |  | Construir backlog real por status aberto |
| % em 72h | `orcamentacao.pct_72h` | MOCK | `sampleDashboardData` |  | Calcular SLA real por orçamento |
| Templates Criados | `orcamentacao.templates_criados` | MOCK | `sampleDashboardData` |  | Definir fonte para templates |
| Desvio de Template | `orcamentacao.desvio_template_pct` | MOCK | `sampleDashboardData` |  | Medir desvio real template x orçamento |
| Perdas por Demora | `orcamentacao.perdas_demora` | MOCK | `sampleDashboardData` |  | Integrar motivo de perda |
| Semáforo de Backlog (<48h / 48-72h / >72h) | Valores hardcoded (`3`, `2`, `2`) | MOCK | Front-end |  | Substituir por agregação real |

### 4) Engenharia

| Indicador (front-end)  | Campo/cálculo atual                   | Status | Fonte atual           | Fonte do dado | Pendência principal                  |
| ---------------------- | ------------------------------------- | ------ | --------------------- | ------------- | ------------------------------------ |
| Checklist Compliance   | `engenharia.checklist_compliance`     | MOCK   | `sampleDashboardData` |               | Integrar formulário/checklist        |
| Tempo Médio de Projeto | `engenharia.tempo_medio_projeto_dias` | MOCK   | `sampleDashboardData` |               | Integrar workflow engenharia         |
| Projetos Devolvidos    | `engenharia.projetos_devolvidos_pct`  | MOCK   | `sampleDashboardData` |               | Integrar apontamento de devolução    |
| POPs Documentados      | `engenharia.pops_documentados`        | MOCK   | `sampleDashboardData` |               | Integrar repositório de POPs         |
| BOM Antecedência       | `engenharia.bom_antecedencia_dias`    | MOCK   | `sampleDashboardData` |               | Integrar datas BOM x início produção |
| Horas de Retrabalho    | `engenharia.horas_retrabalho`         | MOCK   | `sampleDashboardData` |               | Integrar apontamento de horas        |

### 5) Produção

| Indicador (front-end)     | Campo/cálculo atual                | Status | Fonte atual           | Fonte do dado | Pendência principal                   |
| ------------------------- | ---------------------------------- | ------ | --------------------- | ------------- | ------------------------------------- |
| Entregas no Prazo         | `producao.entregas_no_prazo_pct`   | MOCK   | `sampleDashboardData` | NOMUS         | Integrar ordens de produção/entrega   |
| Projetos Simultâneos      | `producao.projetos_simultaneos`    | MOCK   | `sampleDashboardData` | NOMUS         | Integrar WIP real                     |
| Retrabalho (%)            | `producao.horas_retrabalho_pct`    | MOCK   | `sampleDashboardData` |               | Integrar apontamento de retrabalho    |
| Tempo Médio de Fabricação | `producao.tempo_medio_fab_dias`    | MOCK   | `sampleDashboardData` | NOMUS         | Integrar datas de início/fim produção |
| Travados por Material     | `producao.travados_material`       | MOCK   | `sampleDashboardData` |               | Integrar bloqueios por material       |
| CEO na Fábrica            | `producao.tempo_ceo_fabrica_pct`   | MOCK   | `sampleDashboardData` |               | Criar input manual                    |
| Standups Realizados       | `producao.standups_realizados_pct` | MOCK   | `sampleDashboardData` |               | Criar coleta simples por rotina       |

### 6) Financeiro

| Indicador (front-end)                             | Campo/cálculo atual                     | Status  | Fonte atual                     | Fonte do dado | Pendência principal                     |
| ------------------------------------------------- | --------------------------------------- | ------- | ------------------------------- | ------------- | --------------------------------------- |
| Faturamento YTD                                   | `financeiro.faturamento_ytd`            | REAL    | `pedidos`                       | NOMUS         | Nenhuma técnica crítica                 |
| Faturamento Médio/Mês                             | Derivado de `faturamento_mensal`        | REAL    | `pedidos`                       | NOMUS         | Nenhuma técnica crítica                 |
| Faturamento Mensal vs Meta (gráfico)              | `faturamento_mensal.realizado` + `meta` | PARCIAL | Realizado real / Meta mock      |               | Mover metas para banco                  |
| Margem Bruta                                      | `financeiro.margem_bruta`               | MOCK    | `sampleDashboardData`           |               | Conectar DRE real                       |
| Margem Líquida                                    | `financeiro.margem_liquida`             | MOCK    | `sampleDashboardData`           |               | Conectar DRE real                       |
| Prazo de Recebimento                              | `financeiro.prazo_medio_recebimento`    | REAL    | `contasReceber`                 |               | Nenhuma técnica crítica                 |
| Reserva de Caixa                                  | `max(mock, saldoReceberAberto*0.12)`    | PARCIAL | `contasReceber` + base mock     |               | Definir fórmula final de negócio        |
| Custo de Antecipação/Mês                          | `financeiro.custo_antecipacao_mensal`   | MOCK    | `sampleDashboardData`           |               | Integrar custos de antecipação          |
| % Faturamento -> Reserva                          | `financeiro.pct_faturamento_reserva`    | MOCK    | `sampleDashboardData`           |               | Calcular sobre fluxo de caixa real      |
| DRE fechado até dia 10                            | `financeiro.dre_fechado_dia10`          | MOCK    | `sampleDashboardData`           |               | Input manual (checkbox por competência) |
| Fluxo de caixa projetado 90 dias                  | `financeiro.fluxo_caixa_projetado`      | MOCK    | `sampleDashboardData`           |               | Input manual + trilha de auditoria      |
| Estrutura da DRE (Receita, Impostos, CPV, EBITDA) | Fórmula fixa sobre `faturamentoMedio`   | PARCIAL | Parte real + coeficientes fixos |               | Substituir por DRE real por competência |

### 7) Alertas e listas

| Indicador (front-end) | Campo/cálculo atual | Status | Fonte atual | Fonte do dado | Pendência principal |
| --- | --- | --- | --- | --- | --- |
| Alertas Ativos | `alertas` (3 regras dinâmicas) | PARCIAL | Regras em `nomusDashboardMapper` |  | Evoluir para motor de alertas completo |
| Ações do Roadmap | `acoes_pendentes` | MOCK | `sampleDashboardData` |  | Criar CRUD em tabela própria |

## O que já está conectado a fonte real

- **Nomus -> Supabase (ingestão incremental)** dos endpoints: `propostas`, `pedidos`, `contasReceber`.
- Persistência em:
  - `public.nomus_raw_records`
  - `public.nomus_sync_state`
- Indicadores já alimentados por essa trilha:
  - Comercial: oportunidades, orçamentos emitidos, taxa de conversão, ticket médio, pipeline ativo e partes do funil.
  - Orçamentação: emitidos/mês.
  - Financeiro: faturamento mensal, faturamento YTD, prazo médio de recebimento e reserva de caixa (parcial).
  - Alertas: geração dinâmica baseada nesses números.

## Roadmap de implementação das pendências

### Fase 1 - Fechar lacunas com o que já existe no Nomus (curto prazo)

- Criar camada normalizada no Supabase (`fact_propostas`, `fact_pedidos`, `fact_recebiveis`) a partir de `nomus_raw_records`.
- Substituir todos os usos de meta fixa em código por tabela de metas (`kpi_targets`) por período/setor.
- Tornar o funil 100% real (sem estimativas de 76% e 42%), caso existam etapas no ERP; se não existirem, registrar como dado operacional manual.
- Remover hardcode do semáforo de backlog e calcular por idade real dos orçamentos.

### Fase 2 - Comercial e Orçamentação avançados (curto/médio prazo)

- Integrar fonte para:
  - tempo de resposta,
  - follow-up,
  - perdas por demora e motivos de perda,
  - recorrência e origem de receita.
- Criar tabela de eventos comerciais (`crm_events`) para manter histórico e auditoria dos indicadores.

### Fase 3 - Financeiro completo (médio prazo)

- Integrar DRE real mensal (margem bruta, margem líquida, EBITDA, fechamento até dia 10).
- Integrar custos de antecipação e cálculo real de `% faturamento -> reserva`.
- Trocar o bloco de "Estrutura da DRE" de fórmula fixa para dados contábeis reais por competência.

### Fase 4 - Engenharia, Produção e Diretoria (médio prazo)

- Integrar módulos operacionais (engenharia/produção) do ERP, se existirem.
- Onde não houver API nativa, criar coleta manual com trilha de auditoria:
  - checklists,
  - POPs,
  - standups,
  - tempo do CEO (estratégico x fábrica),
  - ações pendentes.

### Fase 5 - Confiabilidade e operação (contínuo)

- Definir SLA de atualização por indicador (15 min, 1h, diário, mensal).
- Criar monitoramento do sync (falhas por endpoint, atraso de atualização, volume ingerido).
- Adicionar testes automatizados de consistência dos KPIs.

## Pendências imediatas (ordem sugerida)

1. Criar tabela de metas (`kpi_targets`) e retirar metas hardcoded do front-end.
2. Substituir semáforo de backlog hardcoded por cálculo real.
3. Definir fonte oficial para tempo de resposta e perdas por demora.
4. Modelar DRE real no Supabase para eliminar margens em mock.
5. Criar CRUD de `acoes_pendentes` no backend e remover a lista estática.
