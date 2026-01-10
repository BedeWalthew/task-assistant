# @task-assistant/frontend

Next.js application for the Task Assistant UI with Kanban board and drag-and-drop.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 3.x
- **Components**: shadcn/ui (Radix UI primitives)
- **State Management**: TanStack Query 5.x
- **Drag-and-Drop**: @dnd-kit
- **Forms**: react-hook-form + Zod
- **Notifications**: sonner
- **E2E Testing**: Playwright

## Features

- **Projects**: Create, view, and manage projects
- **Tickets**: Full CRUD with filtering and sorting
- **Kanban Board**: Visual status columns with drag-and-drop reordering
- **List View**: Paginated ticket list with search
- **Filter Bar**: Filter by status, priority, project, search term
- **URL State**: Filters and view mode persist in URL
- **Optimistic Updates**: Instant UI feedback for drag operations

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   ├── projects/           # Project pages
│   │   ├── page.tsx        # Project list
│   │   └── [id]/           # Project detail
│   └── tickets/            # Ticket pages
│       └── page.tsx        # Tickets (list/board)
│
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   ├── features/           # Domain components
│   │   ├── projects/       # ProjectList, ProjectCreateForm
│   │   └── tickets/        # TicketBoard, TicketCard, FilterBar, etc.
│   ├── layout/             # Navbar, Sidebar
│   └── providers/          # QueryProvider
│
├── actions/                # Server Actions
│   ├── createProject.ts
│   └── createTicket.ts
│
├── hooks/                  # Custom hooks
│   ├── use-toast.ts
│   └── useTicketReorder.ts
│
├── lib/                    # Utilities
│   └── utils.ts            # cn() helper
│
└── types/                  # Frontend types
```

## Key Components

| Component | Description |
|-----------|-------------|
| `TicketBoard` | Kanban board with 4 status columns |
| `TicketColumn` | Single status column with drop zone |
| `DraggableTicketCard` | Ticket card with drag handle |
| `FilterBar` | Search, status, priority, project filters |
| `CreateTicketModal` | Modal form for new tickets |
| `ProjectCreateForm` | Form for creating projects |

## Scripts

```bash
# Development
pnpm dev              # Run Next.js dev server

# Build
pnpm build            # Production build
pnpm start            # Start production server

# Testing
pnpm test:e2e         # Run Playwright tests
pnpm test:e2e:ui      # Playwright with UI
pnpm test:e2e:debug   # Debug mode
pnpm test:e2e:report  # Show test report
```

## Environment

The frontend runs on port `3000` in the Docker container.

API communication:
- **Browser (client)**: `http://localhost:3001`
- **Server (SSR)**: Internal Docker network

## Data Fetching Strategy

| Scenario | Strategy |
|----------|----------|
| Initial page load | Server Components with native fetch |
| Interactive/real-time | TanStack Query with polling |
| Mutations | Server Actions + cache invalidation |

URL state is used for filters, pagination, and view mode (list/board).
