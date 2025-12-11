# Backend Standards & Best Practices

## Core Architecture
We follow a strict **Layered Architecture** to separate concerns:

1.  **Presentation Layer (Controllers)**: Handles HTTP request/response. Parses input, sends output. **NO business logic here.**
2.  **Service Layer (Services)**: Contains all business logic. Calls the Data Layer.
3.  **Data Layer (Prisma/Repositories)**: Interacts directly with the database.

## File Structure (`packages/backend/src`)

```
src/
├── app.ts                  # App entry point (Express setup)
├── server.ts               # Server startup (port listening)
│
├── config/                 # Environment configs
│   └── env.ts              # Zod-validated process.env
│
├── areas/                  # Feature areas (Vertical Slicing)
│   ├── tickets/
│   │   ├── ticket-controller.ts
│   │   ├── ticket-service.ts
│   │   └── ticket-routes.ts
│   └── projects/
│
├── common/                 # Shared utilities
│   ├── middleware/
│   │   ├── validate.ts     # Zod validation middleware
│   │   └── error.ts        # Global error handler
│   ├── utils/
│   │   └── AppError.ts     # Custom error class
│   └── types/
│
└── db/
    └── client.ts           # Prisma client instance
```

## Validation & Type Safety
- **Zod Middleware**: Every route must use a validation middleware that takes a Zod schema.
- **Shared Schemas**: All API Request/Response schemas must be defined in `packages/shared` to be reused by the frontend.
- **Request Type**: `req.body`, `req.query`, and `req.params` must be typed via `z.infer`.
- **Response Type**: Service functions should return typed data.

### Example Route Definition
```typescript
// ticket-routes.ts
import { createTicketSchema } from '@task-assistant/shared';

router.post(
  '/',
  validateRequest(createTicketSchema), // Zod middleware
  TicketController.createTicket
);
```

## Error Handling
1.  **Custom `AppError`**: Use a custom error class (statusCode, message, isOperational).
2.  **Async Wrapper**: Use `express-async-errors` or a wrapper function to catch async rejections automatically.
3.  **Global Handler**: A single error handling middleware at the end of `app.ts` to format JSON responses consistentnly.
    *   *Dev*: Stack traces.
    *   *Prod*: Generic messages for 500s.

## Database (Prisma)
- **Schema**: Keep `schema.prisma` in `packages/backend/prisma/`.
- **Queries**: All DB queries go in the Service layer (or strict Repositories if complexity grows).
- **Naming**: Use camelCase for TS fields, map to snake_case for DB columns if needed (Prisma does this automatically usually).
- **Migrations**: Always review `migration.sql` before applying.

## API Standards (REST)
- **URLs**: Plural nouns (e.g., `/tickets`, `/tickets/:id`).
- **Methods**: proper use of GET, POST, PUT (full update), PATCH (partial), DELETE.
- **Status Codes**:
    - `200`: Success
    - `201`: Created
    - `400`: Bad Request (Validation failed)
    - `401`: Unauthorized (Not logged in)
    - `403`: Forbidden (Logged in but no permission)
    - `404`: Not Found
    - `500`: Internal Server Error

## Logging
- **Library**: **Pino**.
- **Usage**: Use the global logger instance. Log structured data (objects), not just strings.
- **Levels**: `info` (startup, key events), `warn` (handled errors), `error` (unhandled/critical).

## API Documentation
- **Tool**: `zod-to-openapi`.
- **Workflow**: Generate OpenAPI (Swagger) specs automatically from the Zod route schemas.
- **Endpoint**: Expose a `/docs` or `/swagger` endpoint in development to view the interactive API.
