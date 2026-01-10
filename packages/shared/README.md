# @task-assistant/shared

Shared TypeScript types, Zod schemas, and utility functions used by both Frontend and Backend.

## Purpose

- **Single Source of Truth**: Define types and validation logic once
- **Consistency**: Ensure API requests/responses match expected types on both ends
- **Type Safety**: Use `z.infer<typeof Schema>` for automatic TypeScript types

## Schemas

### Project Schemas (`schemas/project.ts`)

| Schema | Description |
|--------|-------------|
| `ProjectSchema` | Full project object |
| `CreateProjectSchema` | Project creation input |
| `UpdateProjectSchema` | Partial project update |

### Ticket Schemas (`schemas/ticket.ts`)

| Schema | Description |
|--------|-------------|
| `TicketSchema` | Full ticket object |
| `CreateTicketSchema` | Ticket creation input |
| `UpdateTicketSchema` | Partial ticket update |
| `TicketFilterSchema` | Query params for filtering |
| `ReorderTicketSchema` | Reorder operation input |

### Enums

| Enum | Values |
|------|--------|
| `TicketStatus` | TODO, IN_PROGRESS, DONE, BLOCKED |
| `TicketPriority` | LOW, MEDIUM, HIGH, CRITICAL |
| `TicketSortBy` | createdAt, updatedAt, priority, status |
| `TicketSortOrder` | asc, desc |

## Usage

Import directly in other packages:

```typescript
// Import schemas
import { 
  CreateTicketSchema, 
  TicketFilterSchema,
  TicketStatus,
  type Ticket 
} from '@task-assistant/shared';

// Validate input
const result = CreateTicketSchema.safeParse(req.body);
if (!result.success) {
  throw new Error(result.error.message);
}

// Use types
const ticket: Ticket = result.data;
```

## Project Structure

```
src/
├── index.ts            # Re-exports all schemas
└── schemas/
    ├── project.ts      # Project schemas and types
    └── ticket.ts       # Ticket schemas and types
```

## Adding New Schemas

1. Create schema file in `src/schemas/`
2. Define Zod schema and infer TypeScript type
3. Export from `src/index.ts`
4. Use in both frontend and backend
