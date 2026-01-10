# Task Assistant

A unified task management system with Kanban board, drag-and-drop reordering, and AI Agent integration (planned). Fully containerized with Docker.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **UI** | shadcn/ui, Tailwind CSS, Radix UI |
| **State** | TanStack Query, URL params |
| **Drag-Drop** | @dnd-kit |
| **Backend** | Express.js, TypeScript |
| **Database** | PostgreSQL, Prisma ORM |
| **Validation** | Zod (shared schemas) |
| **Testing** | Jest, Playwright |
| **DevOps** | Docker, pnpm workspaces |

## Features

- ✅ **Project Management**: Create, edit, delete projects with unique keys
- ✅ **Ticket CRUD**: Full ticket lifecycle management
- ✅ **Kanban Board**: Visual status columns with drag-and-drop
- ✅ **Filtering & Sorting**: URL-driven filters (status, priority, project, search)
- ✅ **Optimistic Updates**: Instant UI feedback with server sync
- ✅ **API Documentation**: Swagger/OpenAPI at `/api-docs`
- 🔜 **Authentication**: OAuth with NextAuth.js (planned)
- 🔜 **AI Agent**: Natural language task creation (planned)

## Quick Start

### 1. Prerequisites

- Docker & Docker Compose
- Node.js 20+ & pnpm (optional, for scripts)

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

# Seed Database
pnpm docker:db:seed

# Open Prisma Studio (accessible at http://localhost:5555)
pnpm docker:db:studio
```

## Testing

```bash
# Backend integration tests
pnpm test

# E2E tests (Playwright)
pnpm test:e2e

# E2E with UI
pnpm test:e2e:ui
```

## Production

To run the optimized production build:

```bash
pnpm docker:prod
```

## Project Structure

```
task-assistant/
├── packages/
│   ├── frontend/     # Next.js 16 + React 19
│   ├── backend/      # Express.js + Prisma
│   └── shared/       # Zod schemas, types
├── docs/             # Technical documentation
├── docker-compose.yml
└── pnpm-workspace.yaml
```

## Documentation

- [Backend Documentation](packages/backend/README.md)
- [Frontend Documentation](packages/frontend/README.md)
- [Shared Package Documentation](packages/shared/README.md)
- [Development Roadmap](TODO.md)
