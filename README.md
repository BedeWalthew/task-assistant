# Task Assistant

A unified task management system with an AI Agent, fully containerized with Docker.

## Quick Start

### 1. Prerequisites

- Docker & Docker Compose
- Node.js & pnpm (optional, but recommended for scripts)

### 2. Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

This sets up default values for local development.

### 3. Start Development Environment

Run the full stack (Frontend + Backend + Database) in Docker with hot reloading:

```bash
pnpm docker:dev
```

The services will be available at:

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:3001](http://localhost:3001)
- **API Documentation**: [http://localhost:3001/api-docs](http://localhost:3001/api-docs)
- **Database**: `localhost:5433` (External access) / `5432` (Internal Docker network)

### 4. Database Management

**Running inside Docker (Recommended):**

```bash
# Generate Client
pnpm docker:db:generate

# Run Migrations
pnpm docker:db:migrate

# Reset Database
pnpm docker:db:reset
```

**Seeding & Studio:**

```bash
# Seed Database
pnpm docker:db:seed

# Open Prisma Studio (accessible at http://localhost:5555)
pnpm docker:db:studio
```

## Production

To run the optimized production build (no source mounting, non-root user):

```bash
pnpm docker:prod
```

## Useful Commands

- `pnpm docker:dev`: Start dev environment (build + detach)
- `pnpm docker:prod`: Start production environment
- `pnpm docker:up`: Start existing containers
- `pnpm docker:down`: Stop and remove containers
- `pnpm docker:build`: Rebuild images

## Documentation

- [Backend Documentation](packages/backend/README.md)
- [Frontend Documentation](packages/frontend/README.md)
- [Shared Package Documentation](packages/shared/README.md)
