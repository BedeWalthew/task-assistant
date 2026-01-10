# @task-assistant/backend

Express.js API server using Prisma ORM and PostgreSQL.

## Tech Stack

- **Framework**: Express.js 4.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL (via Docker)
- **ORM**: Prisma 5.x
- **Validation**: Zod (shared with frontend)
- **Testing**: Jest + Supertest
- **Docs**: Swagger/OpenAPI

## API Endpoints

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects` | List all projects |
| GET | `/projects/:id` | Get single project |
| POST | `/projects` | Create project |
| PUT | `/projects/:id` | Update project |
| DELETE | `/projects/:id` | Delete project |

### Tickets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tickets` | List tickets (with filters) |
| GET | `/tickets/:id` | Get single ticket |
| POST | `/tickets` | Create ticket |
| PUT | `/tickets/:id` | Update ticket |
| PATCH | `/tickets/:id/reorder` | Reorder ticket (status + position) |
| DELETE | `/tickets/:id` | Delete ticket |

### Query Parameters (GET /tickets)

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | uuid | Filter by project |
| `status` | enum | TODO, IN_PROGRESS, DONE, BLOCKED |
| `priority` | enum | LOW, MEDIUM, HIGH, CRITICAL |
| `search` | string | Search title/description |
| `sortBy` | enum | createdAt, updatedAt, priority, status |
| `sortOrder` | enum | asc, desc |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20, max: 100) |

## API Documentation

Auto-generated Swagger docs available at:
**[http://localhost:3001/api-docs](http://localhost:3001/api-docs)**

## Project Structure

```
src/
├── app.ts                  # Express setup, middleware
├── server.ts               # Server startup
├── config/                 # Environment config
├── areas/                  # Feature modules
│   ├── projects/           # Project CRUD
│   │   ├── project-controller.ts
│   │   ├── project-service.ts
│   │   ├── project-routes.ts
│   │   └── __tests__/
│   └── tickets/            # Ticket CRUD + reorder
│       ├── ticket-controller.ts
│       ├── ticket-service.ts
│       ├── ticket-routes.ts
│       └── __tests__/
├── common/                 # Shared utilities
│   ├── middleware/         # validate, error
│   └── utils/              # AppError
├── db/                     # Prisma client
└── prisma/                 # Schema + migrations
```

## Scripts

```bash
# Development
pnpm dev              # Run with hot reload

# Build
pnpm build            # Compile TypeScript

# Database
pnpm db:generate      # Generate Prisma Client
pnpm db:migrate       # Run migrations
pnpm db:reset         # Reset database
pnpm db:seed          # Seed data
pnpm db:studio        # Open Prisma Studio

# Testing
pnpm test             # Run all tests
pnpm test:watch       # Watch mode
pnpm test:coverage    # Coverage report
```

## Environment

The backend runs on port `3001` in the Docker container.
It connects to the `postgres` service on the internal Docker network.

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 3001)
