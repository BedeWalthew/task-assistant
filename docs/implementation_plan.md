# Implementation Plan: Personal Planner + Task Agent

## Technology Stack

### Core
- **Package Manager**: pnpm (Monorepo support)
- **Containerization**: Docker & Docker Compose

### Frontend (`/apps/web`)
- **Framework**: Next.js
### User Interface
- **Component Library**: shadcn/ui (Radix UI + Tailwind)
- **Icons**: Lucide React

### Authentication
- **Library**: NextAuth.js (Auth.js)
  - *Scalability*: Database-backed sessions (via Prisma) scale with your Postgres database. Suitable for production usage.
- **Strategy**: OAuth (Google, GitHub) + magic links if needed.
- **Adapter**: Prisma Adapter to store sessions/users in Postgres.

### Caching & State
- **Server Cache**: Native Next.js `fetch` caching & `unstable_cache`.
- **Client Cache**: TanStack Query (React Query) - *Only for complex client-side interactions where efficient polling or optimistic updates are critical.*

### Backend (`packages/backend`)
- **Runtime**: Node.js
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Validation**: Zod (for all routes)

### Monorepo Structure
We will use a flat structure under `packages/` as requested:

```
.
├── packages
│   ├── frontend (Next.js in `src/`)
│   ├── backend (Express + Prisma + Zod)
│   └── shared (Zod schemas, API types)
├── docker-compose.yml
└── pnpm-workspace.yaml
```

## User Review Required

> [!NOTE]
> **Structure**: Switched to `packages/{frontend,backend,shared}`.
> **Database**: Confirmed PostgreSQL.

## Proposed Changes

### [New Project Setup]
#### [NEW] [pnpm-workspace.yaml](file:///pnpm-workspace.yaml)
#### [NEW] [docker-compose.yml](file:///docker-compose.yml)
#### [NEW] [packages/frontend/package.json](file:///packages/frontend/package.json)
#### [NEW] [packages/backend/package.json](file:///packages/backend/package.json)
#### [NEW] [packages/shared/package.json](file:///packages/shared/package.json)

## Verification Plan

### Automated Tests
- Verify Docker build succeeds for all services.
- Verify pnpm install works and links workspaces correctly.
- Verify Next.js and Express servers start and communicate.
