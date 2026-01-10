# Technical Specification: Kanban Board Drag-and-Drop Reordering

**Version:** 1.0  
**Date:** 2026-01-05  
**Author:** Senior Software Architect  
**Status:** Draft

---

## 1. Executive Summary & Scope

### 1.1 Goal

Enable users to reorder tickets within and across status columns on the Kanban board via drag-and-drop, with changes persisted to the database and reflected in real-time with optimistic updates.

### 1.2 Scope

**In Scope:**

- Add `position` field to Ticket model for ordering within status columns
- Backend endpoint for atomic ticket reordering (status + position updates)
- Frontend drag-and-drop using `@dnd-kit` library
- Optimistic UI updates with TanStack Query
- Accessibility (ARIA attributes, keyboard navigation)
- Mobile touch support

**Out of Scope:**

- Multi-select drag (dragging multiple tickets at once)
- Cross-project ticket moves
- Undo/redo functionality
- Real-time collaborative sync (WebSockets) — future Phase 5

### 1.3 Stakeholders & Personas

| Persona          | Impact                                                           |
| ---------------- | ---------------------------------------------------------------- |
| **Task Manager** | Primary user; organizes work by dragging tickets between columns |
| **Team Member**  | Updates ticket status by moving cards                            |
| **Mobile User**  | Requires touch-friendly drag interactions                        |

---

## 2. Architecture & Design Patterns

### 2.1 Architectural Approach

**Existing:** Monorepo with layered architecture (Controller → Service → Data). This feature extends the existing pattern without architectural changes.

**Justification:** The current architecture supports this feature cleanly. No need for event sourcing or CQRS; the reorder operation is a simple state mutation with optimistic client-side prediction.

### 2.2 Design Patterns

| Pattern                | Application                                                                 |
| ---------------------- | --------------------------------------------------------------------------- |
| **Optimistic Update**  | Client immediately reflects drag result; rolls back on server error         |
| **Repository Pattern** | `ticket-service.ts` encapsulates all DB operations including reorder logic  |
| **Strategy Pattern**   | Reorder algorithm abstracted to handle fractional indexing vs. integer gaps |
| **Adapter Pattern**    | `@dnd-kit` sensors abstracted to support mouse, touch, and keyboard         |

### 2.3 Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Next.js)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. User drags ticket                                                       │
│  2. @dnd-kit DndContext captures drag start/over/end events                 │
│  3. onDragEnd: Calculate new position + status                              │
│  4. TanStack Query mutation:                                                │
│     a. Optimistic update → reorder local cache immediately                  │
│     b. PATCH /tickets/:id/reorder → send to backend                         │
│     c. On success: confirm cache                                            │
│     d. On error: rollback cache, show toast                                 │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND (Express)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  5. Route: PATCH /tickets/:id/reorder                                       │
│  6. Validate: ReorderTicketSchema (status, position, afterTicketId?)        │
│  7. Controller → Service.reorderTicket()                                    │
│  8. Service:                                                                │
│     a. Fetch ticket, verify exists                                          │
│     b. If status changed: move to new column                                │
│     c. Recalculate positions for affected tickets (gap-based or fractional) │
│     d. Prisma transaction: update ticket + shift siblings                   │
│  9. Return updated ticket                                                   │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE (PostgreSQL)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  Ticket table with:                                                         │
│  - position: Float (fractional indexing) or Int (with periodic rebalancing) │
│  - Composite index: (projectId, status, position)                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Critical Implementation Details

### 3.1 Database Schema Changes

#### Migration: Add `position` Field

```prisma
model Ticket {
  id          String   @id @default(uuid())
  title       String
  description String?
  status      String   @default("TODO")
  priority    String   @default("MEDIUM")
  position    Float    @default(0)  // NEW: Ordering within status column

  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])

  assigneeId  String?
  source      String   @default("MANUAL")
  sourceUrl   String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([projectId, status, position])  // NEW: Composite index for sorted queries
  @@map("tickets")
}
```

#### Migration Script

```sql
-- Add position column with default based on createdAt order
ALTER TABLE "tickets" ADD COLUMN "position" DOUBLE PRECISION DEFAULT 0;

-- Backfill existing tickets with sequential positions per status
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY "projectId", "status"
    ORDER BY "createdAt" ASC
  ) * 1000 as new_position
  FROM "tickets"
)
UPDATE "tickets" t
SET "position" = r.new_position
FROM ranked r
WHERE t.id = r.id;

-- Add composite index
CREATE INDEX "tickets_project_status_position_idx"
ON "tickets" ("projectId", "status", "position");
```

### 3.2 API Specification

#### Endpoint: Reorder Ticket

```
PATCH /tickets/:id/reorder
```

**Request Body:**

```typescript
// packages/shared/src/schemas/ticket.ts
export const ReorderTicketSchema = z.object({
  status: TicketStatus.optional(), // New status (if moving columns)
  position: z.number().positive(), // Target position
  referenceTicketId: z.string().uuid().optional(), // Ticket to insert after (alternative)
});
export type ReorderTicketInput = z.infer<typeof ReorderTicketSchema>;
```

**Request Example:**

```json
{
  "status": "IN_PROGRESS",
  "position": 2500
}
```

**Response (200 OK):**

```json
{
  "data": {
    "id": "uuid",
    "title": "Ticket title",
    "status": "IN_PROGRESS",
    "position": 2500,
    "projectId": "uuid",
    "...": "other fields"
  }
}
```

**Error Responses:**

| Status | Condition                                  |
| ------ | ------------------------------------------ |
| `400`  | Invalid payload (Zod validation)           |
| `404`  | Ticket not found                           |
| `409`  | Position conflict (rare, handled by retry) |
| `500`  | Database transaction failure               |

### 3.3 Core Logic: Position Calculation

#### Strategy: Fractional Indexing

Use floating-point positions to avoid shifting all subsequent items on every move.

```typescript
// packages/backend/src/areas/tickets/ticket-service.ts

const POSITION_GAP = 1000; // Default gap between new tickets
const MIN_GAP = 0.001; // Trigger rebalance below this gap
const REBALANCE_THRESHOLD = 100; // Max items before considering rebalance

/**
 * Calculate new position between two adjacent tickets
 */
function calculatePosition(
  beforePosition: number | null,
  afterPosition: number | null
): number {
  if (beforePosition === null && afterPosition === null) {
    return POSITION_GAP;
  }
  if (beforePosition === null) {
    return afterPosition! / 2;
  }
  if (afterPosition === null) {
    return beforePosition + POSITION_GAP;
  }

  const newPosition = (beforePosition + afterPosition) / 2;

  // Check if gap is too small (precision issues)
  if (afterPosition - beforePosition < MIN_GAP) {
    throw new RebalanceRequiredError();
  }

  return newPosition;
}

/**
 * Reorder a ticket to a new position/status
 */
export async function reorderTicket(
  ticketId: string,
  input: ReorderTicketInput
): Promise<Ticket> {
  return prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new AppError("Ticket not found", 404);

    const targetStatus = input.status ?? ticket.status;
    const targetPosition = input.position;

    // Validate position doesn't conflict (optional: check for exact collision)
    const conflicting = await tx.ticket.findFirst({
      where: {
        projectId: ticket.projectId,
        status: targetStatus,
        position: targetPosition,
        id: { not: ticketId },
      },
    });

    let finalPosition = targetPosition;
    if (conflicting) {
      // Slight offset to avoid collision
      finalPosition = targetPosition + 0.001;
    }

    return tx.ticket.update({
      where: { id: ticketId },
      data: {
        status: targetStatus,
        position: finalPosition,
      },
    });
  });
}
```

#### Rebalancing Strategy

When fractional gaps become too small (< `MIN_GAP`), rebalance the entire column:

```typescript
export async function rebalanceColumn(
  projectId: string,
  status: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const tickets = await tx.ticket.findMany({
      where: { projectId, status },
      orderBy: { position: "asc" },
      select: { id: true },
    });

    const updates = tickets.map((ticket, index) =>
      tx.ticket.update({
        where: { id: ticket.id },
        data: { position: (index + 1) * POSITION_GAP },
      })
    );

    await Promise.all(updates);
  });
}
```

### 3.4 Frontend Implementation

#### Dependencies

```json
{
  "@dnd-kit/core": "^6.1.0",
  "@dnd-kit/sortable": "^8.0.0",
  "@dnd-kit/utilities": "^3.2.2"
}
```

#### Component Structure

```
packages/frontend/src/
├── components/features/tickets/
│   ├── TicketBoard.tsx          # Updated with DndContext
│   ├── TicketColumn.tsx         # NEW: SortableContext per column
│   ├── TicketCard.tsx           # Updated: useSortable hook
│   └── DraggableTicketCard.tsx  # NEW: Wrapper with drag handle
├── hooks/
│   └── useTicketReorder.ts      # NEW: TanStack Query mutation
└── actions/
    └── tickets.ts               # Updated: reorderTicket server action
```

#### Key Component: TicketBoard with DnD

```tsx
// packages/frontend/src/components/features/tickets/TicketBoard.tsx
"use client";

import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useState } from "react";
import { useTicketReorder } from "@/hooks/useTicketReorder";
import { TicketColumn } from "./TicketColumn";
import { TicketCard } from "./TicketCard";
import type { Ticket, TicketStatus } from "@task-assistant/shared";

type TicketBoardProps = {
  items: Ticket[];
  projectLabels?: Record<string, string>;
};

export function TicketBoard({ items, projectLabels }: TicketBoardProps) {
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const { mutate: reorderTicket } = useTicketReorder();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const ticket = items.find((t) => t.id === event.active.id);
    setActiveTicket(ticket ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTicket(null);
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const ticketId = active.id as string;
    const overId = over.id as string;

    // Determine target status and position
    const overTicket = items.find((t) => t.id === overId);
    const targetStatus = overTicket?.status ?? (overId as TicketStatus);

    // Calculate position based on drop location
    const columnTickets = items
      .filter((t) => t.status === targetStatus && t.id !== ticketId)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    const overIndex = columnTickets.findIndex((t) => t.id === overId);

    let newPosition: number;
    if (overIndex === -1) {
      // Dropped on empty column or column header
      newPosition =
        columnTickets.length > 0
          ? (columnTickets[columnTickets.length - 1].position ?? 0) + 1000
          : 1000;
    } else {
      const before = columnTickets[overIndex - 1]?.position ?? 0;
      const after = columnTickets[overIndex]?.position ?? before + 2000;
      newPosition = (before + after) / 2;
    }

    reorderTicket({ ticketId, status: targetStatus, position: newPosition });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(["TODO", "IN_PROGRESS", "DONE", "BLOCKED"] as const).map((status) => (
          <TicketColumn
            key={status}
            status={status}
            tickets={items.filter((t) => t.status === status)}
            projectLabels={projectLabels}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTicket && (
          <TicketCard
            ticket={activeTicket}
            projectLabel={projectLabels?.[activeTicket.projectId]}
            compact
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
```

#### TanStack Query Mutation Hook

```typescript
// packages/frontend/src/hooks/useTicketReorder.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Ticket, TicketStatus } from "@task-assistant/shared";

type ReorderInput = {
  ticketId: string;
  status: TicketStatus;
  position: number;
};

async function reorderTicketApi(input: ReorderInput): Promise<Ticket> {
  const res = await fetch(`/api/tickets/${input.ticketId}/reorder`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: input.status, position: input.position }),
  });
  if (!res.ok) throw new Error("Failed to reorder ticket");
  const json = await res.json();
  return json.data;
}

export function useTicketReorder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderTicketApi,
    onMutate: async (input) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["tickets"] });

      // Snapshot previous value
      const previousTickets = queryClient.getQueryData<{ items: Ticket[] }>([
        "tickets",
      ]);

      // Optimistically update
      queryClient.setQueryData<{ items: Ticket[] }>(["tickets"], (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((t) =>
            t.id === input.ticketId
              ? { ...t, status: input.status, position: input.position }
              : t
          ),
        };
      });

      return { previousTickets };
    },
    onError: (_err, _input, context) => {
      // Rollback on error
      if (context?.previousTickets) {
        queryClient.setQueryData(["tickets"], context.previousTickets);
      }
      toast.error("Failed to move ticket. Please try again.");
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
}
```

---

## 4. Critical Areas & Risk Analysis

### 4.1 Edge Cases

| Edge Case                         | Handling Strategy                                   |
| --------------------------------- | --------------------------------------------------- |
| **Drop on empty column**          | Create position at `POSITION_GAP` (1000)            |
| **Rapid successive drags**        | Debounce mutations; queue with `mutationKey`        |
| **Drag to same position**         | No-op; skip API call if position unchanged          |
| **Network failure mid-drag**      | Rollback optimistic update; toast error             |
| **Position precision exhaustion** | Trigger `rebalanceColumn()` when gap < `MIN_GAP`    |
| **Concurrent edits**              | Last-write-wins; consider optimistic locking for v2 |

### 4.2 Performance Bottlenecks

| Risk                             | Mitigation                                                       |
| -------------------------------- | ---------------------------------------------------------------- |
| **Large columns (100+ tickets)** | Virtualize list with `react-virtual`; paginate server-side       |
| **Frequent rebalancing**         | Use large initial gaps (1000); rebalance async in background job |
| **Slow position queries**        | Composite index `(projectId, status, position)`                  |
| **Drag lag on mobile**           | Use `TouchSensor` with activation delay; reduce re-renders       |

### 4.3 Concurrency Issues

| Scenario                         | Solution                                                                           |
| -------------------------------- | ---------------------------------------------------------------------------------- |
| **Two users drag same ticket**   | Last-write-wins (acceptable for v1); future: optimistic locking with version field |
| **User A drags, User B deletes** | 404 on reorder → toast "Ticket no longer exists"; remove from UI                   |
| **Position collision**           | Fractional indexing virtually eliminates; offset by 0.001 if exact match           |

---

## 5. Important Considerations

### 5.1 Security

- **Input Validation:** All inputs validated via Zod schemas (`ReorderTicketSchema`)
- **Authorization:** (Future Phase 3) Verify user has permission to modify ticket in project
- **Rate Limiting:** Consider rate-limiting reorder endpoint (100 req/min per user)

### 5.2 Scalability

| Scale Factor     | Consideration                                                 |
| ---------------- | ------------------------------------------------------------- |
| **10x tickets**  | Virtualization; lazy-load columns                             |
| **100x tickets** | Server-side pagination per column; WebSocket for live updates |
| **Multi-tenant** | Project-scoped queries already enforce isolation              |

### 5.3 Observability

**Logging (Pino structured logs):**

```typescript
logger.info({
  event: "ticket.reordered",
  ticketId,
  fromStatus: oldStatus,
  toStatus: newStatus,
  fromPosition: oldPosition,
  toPosition: newPosition,
  durationMs: Date.now() - startTime,
});
```

**Metrics to track:**

- `ticket_reorder_total` (counter) — total reorder operations
- `ticket_reorder_duration_ms` (histogram) — latency distribution
- `ticket_reorder_errors_total` (counter) — failures by error type
- `column_rebalance_total` (counter) — rebalance frequency

**Alerts:**

- Reorder error rate > 1% in 5 minutes
- Rebalance frequency > 10/hour (indicates position strategy issue)

### 5.4 Testing Strategy

#### Unit Tests

```typescript
// packages/backend/src/areas/tickets/__tests__/ticket-service.test.ts
describe("calculatePosition", () => {
  it("returns midpoint between two positions", () => {
    expect(calculatePosition(1000, 2000)).toBe(1500);
  });

  it("returns half of afterPosition when beforePosition is null", () => {
    expect(calculatePosition(null, 1000)).toBe(500);
  });

  it("returns beforePosition + GAP when afterPosition is null", () => {
    expect(calculatePosition(1000, null)).toBe(2000);
  });

  it("throws RebalanceRequiredError when gap too small", () => {
    expect(() => calculatePosition(1000, 1000.0001)).toThrow(
      RebalanceRequiredError
    );
  });
});
```

#### Integration Tests

```typescript
// packages/backend/src/areas/tickets/__tests__/ticket-routes.test.ts
describe("PATCH /tickets/:id/reorder", () => {
  it("moves ticket to new status and position", async () => {
    const ticket = await createTicket({ status: "TODO", position: 1000 });

    const res = await request(app)
      .patch(`/tickets/${ticket.id}/reorder`)
      .send({ status: "IN_PROGRESS", position: 500 });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("IN_PROGRESS");
    expect(res.body.data.position).toBe(500);
  });

  it("returns 404 for non-existent ticket", async () => {
    const res = await request(app)
      .patch("/tickets/00000000-0000-0000-0000-000000000000/reorder")
      .send({ position: 1000 });

    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid position", async () => {
    const ticket = await createTicket();

    const res = await request(app)
      .patch(`/tickets/${ticket.id}/reorder`)
      .send({ position: -100 });

    expect(res.status).toBe(400);
  });
});
```

#### Frontend Component Tests

```typescript
// packages/frontend/src/components/features/tickets/__tests__/TicketBoard.test.tsx
describe("TicketBoard", () => {
  it("renders all status columns", () => {
    render(<TicketBoard items={[]} />);
    expect(screen.getByText("Todo")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
  });

  it("calls reorder mutation on drag end", async () => {
    const reorderMock = vi.fn();
    vi.mocked(useTicketReorder).mockReturnValue({ mutate: reorderMock });

    // Simulate drag event...
    expect(reorderMock).toHaveBeenCalledWith({
      ticketId: "ticket-1",
      status: "IN_PROGRESS",
      position: expect.any(Number),
    });
  });
});
```

---

## 6. Implementation Roadmap

### Phase 1: Database & Schema (0.5 day)

1. Add `position` field to Prisma schema
2. Create migration with backfill logic
3. Add composite index
4. Update shared Zod schemas (`ReorderTicketSchema`)
5. Run migration in dev environment

### Phase 2: Backend API (1 day)

1. Implement `calculatePosition` utility
2. Add `reorderTicket` service method with transaction
3. Add `rebalanceColumn` service method
4. Create `PATCH /tickets/:id/reorder` route with validation
5. Write unit tests for position calculation
6. Write integration tests for reorder endpoint
7. Update Swagger documentation

### Phase 3: Frontend Core (1.5 days)

1. Install `@dnd-kit` dependencies
2. Create `useTicketReorder` TanStack Query mutation hook
3. Refactor `TicketBoard` with `DndContext`
4. Create `TicketColumn` with `SortableContext`
5. Update `TicketCard` with `useSortable` hook
6. Implement `DragOverlay` for visual feedback
7. Handle drop on empty columns

### Phase 4: Polish & Accessibility (0.5 day)

1. Add keyboard navigation (arrow keys to move)
2. Add ARIA attributes for screen readers
3. Add visual drop indicators (highlight target zone)
4. Add drag cursor styles
5. Test touch interactions on mobile

### Phase 5: Testing & QA (0.5 day)

1. Complete unit test coverage
2. Complete integration test coverage
3. Manual QA: cross-browser (Chrome, Firefox, Safari)
4. Manual QA: mobile devices (iOS Safari, Android Chrome)
5. Performance testing with 100+ tickets

### Phase 6: Documentation & Deploy (0.25 day)

1. Update API documentation
2. Update TODO.md with completed items
3. Create PR with comprehensive description
4. Deploy to staging for final verification

---

## Appendix A: File Changes Summary

| File                                                                  | Action | Description                                                 |
| --------------------------------------------------------------------- | ------ | ----------------------------------------------------------- |
| `packages/backend/src/prisma/schema.prisma`                           | Modify | Add `position` field, composite index                       |
| `packages/shared/src/schemas/ticket.ts`                               | Modify | Add `ReorderTicketSchema`, update `TicketSchema`            |
| `packages/backend/src/areas/tickets/ticket-service.ts`                | Modify | Add `reorderTicket`, `rebalanceColumn`, `calculatePosition` |
| `packages/backend/src/areas/tickets/ticket-routes.ts`                 | Modify | Add `PATCH /:id/reorder` route                              |
| `packages/backend/src/areas/tickets/ticket-controller.ts`             | Modify | Add `reorder` controller method                             |
| `packages/frontend/package.json`                                      | Modify | Add `@dnd-kit/*` dependencies                               |
| `packages/frontend/src/components/features/tickets/TicketBoard.tsx`   | Modify | Wrap with DndContext                                        |
| `packages/frontend/src/components/features/tickets/TicketColumn.tsx`  | Create | SortableContext wrapper                                     |
| `packages/frontend/src/components/features/tickets/TicketCard.tsx`    | Modify | Add useSortable hook                                        |
| `packages/frontend/src/hooks/useTicketReorder.ts`                     | Create | TanStack Query mutation                                     |
| `packages/backend/src/areas/tickets/__tests__/ticket-service.test.ts` | Create | Unit tests for position logic                               |

---

## Appendix B: Estimation

| Phase                  | Effort         |
| ---------------------- | -------------- |
| Database & Schema      | 0.5 day        |
| Backend API            | 1 day          |
| Frontend Core          | 1.5 days       |
| Polish & Accessibility | 0.5 day        |
| Testing & QA           | 0.5 day        |
| Documentation          | 0.25 day       |
| **Total**              | **~4.25 days** |

---

## Appendix C: Dependencies

### Backend

None (Prisma, Zod already present)

### Frontend

```json
{
  "@dnd-kit/core": "^6.1.0",
  "@dnd-kit/sortable": "^8.0.0",
  "@dnd-kit/utilities": "^3.2.2",
  "@tanstack/react-query": "^5.x" // If not already installed
}
```
