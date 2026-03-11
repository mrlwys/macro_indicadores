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
- Usuario inicial padrao: `admin` / `admin`

## Setup local (sem Docker)

1. Copie `.env.example` para `.env` e preencha:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`

2. Instale dependencias:

```bash
npm install
```

3. Rode migracoes e seed no Supabase SQL Editor:
   - `supabase/migrations/20260311000100_init.sql`
   - `supabase/migrations/20260311000200_users_auth.sql`
   - `supabase/migrations/20260311000300_users_profile_fields.sql`
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

1. Criar adapter por fonte em `apps/api/src/services/sourceAdapters`
2. Registrar no `registry.ts`
3. Normalizar payload para o shape do dashboard
4. Disparar `POST /api/sync` para gerar snapshots no Supabase

## Deploy AWS (direcao sugerida)

- API: ECS Fargate ou App Runner
- Web: S3 + CloudFront (build estatico Vite)
- Secrets: AWS Secrets Manager / SSM
- CI/CD: GitHub Actions (build, push image, deploy)

## Observacoes

- O frontend busca dados em `/api/dashboard/latest` apos login.
- Se a API/Supabase falhar no dashboard, o componente usa fallback local do mock para manter a tela funcionando.
- O endpoint de usuarios fica oculto para perfil `user`.
