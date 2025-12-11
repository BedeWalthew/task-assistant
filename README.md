# Personal Planner + Task Assistant

A unified task management system with an AI Agent.

## Quick Start

### 1. Database
Start the PostgreSQL database (running on port 5433):

```bash
docker-compose up -d
```

### 2. Development
Start the development server for all packages (Frontend + Backend):

```bash
pnpm dev
```

The services will be available at:
- **Backend**: http://localhost:3001
- **Frontend**: http://localhost:3000

## Commands

- `pnpm install`: Install dependencies
- `pnpm build`: Build all packages
- `pnpm db:seed`: Seed the database (run from root)

## Architecture

- `packages/frontend`: Next.js App
- `packages/backend`: Express API
- `packages/shared`: Shared Types & Schemas
- `agent/`: Python AI Agent (Coming Soon)
