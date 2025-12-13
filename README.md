# Task Assistant

A unified task management system with an AI Agent, fully containerized with Docker.

## Quick Start

### 1. Prerequisites
- Docker & Docker Compose
- Node.js & pnpm (optional, but recommended for scripts)

### 2. Start Development Environment
Run the full stack (Frontend + Backend + Database) in Docker with hot reloading:

```bash
pnpm docker:dev
# OR
docker compose up --build -d
```

The services will be available at:
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:3001](http://localhost:3001)
- **Database**: `localhost:5433` (External access) / `5432` (Internal Docker network)

### 3. Database Management
Seed the database (requires container running):
```bash
pnpm db:seed
```

Open Prisma Studio to inspect data:
```bash
pnpm db:studio
```

## Useful Commands

- `pnpm docker:dev`: Start dev environment (build + detach)
- `pnpm docker:up`: Start existing containers
- `pnpm docker:down`: Stop and remove containers
- `pnpm docker:build`: Rebuild images

## Documentation

- [Backend Documentation](packages/backend/README.md)
- [Frontend Documentation](packages/frontend/README.md)
- [Shared Package Documentation](packages/shared/README.md)
