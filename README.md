# Macro Indicadores - Dashboard Grupo Musso

Estrutura inicial para evoluir o mock para produto real, mantendo o mesmo frontend e preparando integracao com Supabase + conectores de APIs externas.

## Stack

- Frontend: React + Vite (`apps/web`)
- Backend: Node.js + Express + TypeScript (`apps/api`)
- Banco: Supabase (Postgres + JSON snapshots)
- Containers: Docker + Docker Compose

## Estrutura

```text
.
|-- apps
|   |-- api
|   |   |-- src
|   |   |   |-- config
|   |   |   |-- data
|   |   |   |-- jobs
|   |   |   |-- lib
|   |   |   |-- middleware
|   |   |   |-- routes
|   |   |   `-- services
|   |   |-- Dockerfile
|   |   `-- package.json
|   `-- web
|       |-- src
|       |   |-- components
|       |   |-- lib
|       |   `-- App.jsx
|       |-- Dockerfile
|       `-- package.json
|-- supabase
|   |-- migrations
|   `-- seed.sql
|-- docker-compose.yml
|-- .env.example
`-- package.json
```

## O que ja esta pronto

- Frontend com o mock portado para React/Vite em `apps/web/src/components/DashboardGrupoMusso.jsx`
- Tela de login com mesma linguagem visual do dashboard
- Aba de Configurações com gestão de usuários (somente admin), com fluxo CRUD via modal.
- Criação de usuário com senha temporária aleatória retornada apenas no momento do cadastro.
- API com endpoints:
  - `GET /api/health`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `GET /api/dashboard/latest`
  - `POST /api/dashboard/snapshot` (admin)
  - `POST /api/sync` (admin)
  - `GET /api/users` (admin)
  - `POST /api/users` (admin)
- Servico de leitura/gravacao de snapshots no Supabase
- Estrutura de adapters para integrar fontes externas (`sourceAdapters`)
- Migracoes SQL para snapshots e usuarios
- Lock de sincronizacao e trilha operacional em `source_sync_runs`
- Usuario inicial padrao: `admin` / `admin`

## Setup local (sem Docker)

1. Copie `.env.example` para `.env` e preencha:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
   - `NOMUS_INTEGRATION_KEY` (quando for ativar integração com ERP)

2. Instale dependencias:

```bash
npm install
```

3. Rode migracoes e seed no Supabase SQL Editor:
   - `supabase/migrations/20260311000100_init.sql`
   - `supabase/migrations/20260311000200_users_auth.sql`
   - `supabase/migrations/20260311000300_users_profile_fields.sql`
   - `supabase/migrations/20260311000400_nomus_ingestion.sql`
   - `supabase/migrations/20260316000100_source_sync_runs_lock.sql`
   - `supabase/seed.sql`

4. Inicie frontend + api:

```bash
npm run dev
```

- Web: `http://localhost:5173`
- API: `http://localhost:4000`
- Login inicial: `admin` / `admin`

## Setup com Docker

1. Ajuste `.env`
2. Suba os servicos:

```bash
npm run docker:up
```

3. Derrube:

```bash
npm run docker:down
```

## Como conectar fontes reais (proximo passo)

1. Preencher as variaveis `NOMUS_*` no `.env`.
2. Definir `NOMUS_SYNC_ENABLED=true`.
3. Executar `POST /api/sync` com usuario `admin` logado.
4. O backend sincroniza incrementalmente `propostas`, `pedidos` e `contasReceber`.
5. Cada sync reprocessa tambem um pequeno lookback das paginas recentes para reduzir perda de alteracoes em registros antigos.
6. Os dados brutos sao gravados em `nomus_raw_records`.
7. O checkpoint incremental por endpoint fica em `nomus_sync_state`.
8. A execucao do sync fica registrada em `source_sync_runs`.
9. O dashboard consolidado so e salvo em `dashboard_snapshots` quando o sync termina sem degradacao.

## Variáveis de integração do Nomus

- `NOMUS_SYNC_ENABLED`: habilita ou desabilita a sincronização do Nomus.
- `NOMUS_BASE_URL`: URL base da API REST do Nomus.
- `NOMUS_INTEGRATION_KEY`: chave de integração REST do Nomus.
- `NOMUS_TIMEOUT_MS`: timeout por requisição HTTP ao Nomus.
- `NOMUS_MAX_RETRIES`: total de tentativas em falhas transitórias.
- `NOMUS_BACKOFF_BASE_MS`: espera inicial entre tentativas.
- `NOMUS_BACKOFF_MAX_MS`: espera máxima entre tentativas.
- `NOMUS_THROTTLE_MAX_WAIT_MS`: teto para espera em respostas `429`.
- `NOMUS_SYNC_INTERVAL_MINUTES`: frequência do job de sincronização.
- `NOMUS_INITIAL_BACKFILL_DAYS`: janela inicial para carga histórica.
- `NOMUS_INCREMENTAL_LOOKBACK_DAYS`: janela móvel de reprocessamento incremental.
- `NOMUS_INCREMENTAL_LOOKBACK_PAGES`: quantidade de páginas recentes reprocessadas a cada sync.
- `NOMUS_PAGE_START`: página inicial para paginação dos endpoints do Nomus.
- `NOMUS_ENABLED_ENDPOINTS`: endpoints ativos na sincronização (CSV).
- `SYNC_LOCK_TTL_MINUTES`: tempo para expirar lock stale de sincronizacao.

## Deploy AWS (direcao sugerida)

- API: ECS Fargate ou App Runner
- Web: S3 + CloudFront (build estatico Vite)
- Secrets: AWS Secrets Manager / SSM
- CI/CD: GitHub Actions (build, push image, deploy)

## Observacoes

- O frontend busca dados em `/api/dashboard/latest` apos login.
- Se a API/Supabase falhar no dashboard, o componente usa fallback local do mock para manter a tela funcionando.
- O endpoint de usuarios fica oculto para perfil `user`.
- O endpoint `POST /api/sync` retorna `409` se ja houver uma sincronizacao em andamento.
