# Frontend Standards & Best Practices

## Core Principles
1.  **Server-First Approach**: All components are Server Components by default. Use Client Components (`"use client"`) only when interactivity (hooks, event listeners, browser APIs) is strictly necessary.
2.  **Streaming & Suspense**: Use `Suspense` boundaries for async data fetching to prevent blocking the UI.
3.  **Strict Typing**: No `any`. All props, API responses, and event handlers must be typed. Zod is used for runtime validation of external data.

## Data Fetching & Caching
All data fetching should happen on the server.

### 1. Fetching
- **Server Components**: Call DB/API directly or use `fetch`.
- **Client Components**: Do **NOT** fetch data in client components (useEffect) unless absolutely necessary. Pass data down from Server Parent or use Server Actions.

### 2. Caching Strategy

> [!TIP]
> **TL;DR Rule of Thumb**
> | Scenario | Strategy | Why? |
> | :--- | :--- | :--- |
> | **Initial Load / Static Data** | **Server (Native)** | Fastest load time (HTML), better SEO (if public). |
> | **Real-time / Interactive** | **Client (TanStack)** | "Snappy" feel for drag-and-drop, notifications, or background polling. |

- **Server (Native)**: Use `fetch(url, { cache: ... })` or `unstable_cache` for database queries.
- **Client (TanStack Query)**:
  - Use **TanStack Query** for client-side data that needs polling, optimistic updates, or complex re-validation logic.
  - *Avoid* `useEffect` for data fetching.

### 3. Mutations
- Use **Server Actions** for all data mutations (POST, PUT, DELETE).
- Validate input with **Zod** inside the Server Action.
- Use `revalidatePath` or `revalidateTag` to refresh server data.
- If using TanStack Query, invalidate queries after mutation: `queryClient.invalidateQueries(...)`.

## File Structure (`packages/frontend/src`)

```
src/
├── app/                    # Next.js App Router (Routes)
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   ├── (auth)/             # Route groups (e.g., login, register)
│   └── dashboard/          # Feature routes
│
├── components/
│   ├── ui/                 # Reusable generic primitive components (Buttons, Inputs)
│   │                       # (Likely from shadcn/ui)
│   │
│   ├── features/           # Domain-specific components
│   │   ├── tickets/        # Ticket-related components
│   │   │   ├── TicketCard.tsx
│   │   │   └── TicketList.tsx
│   │   └── projects/       # Project-related components
│   │
│   └── layout/             # Global layout components (Navbar, Sidebar)
│
├── lib/                    # Utilities and libraries
│   ├── utils.ts            # Helper functions (cn, formatters)
│   ├── api.ts              # Typed API wrappers (if needed)
│   └── constants.ts
│
├── actions/                # Server Actions (Mutations)
│   ├── ticket-actions.ts
│   └── project-actions.ts
│
├── hooks/                  # Custom React Hooks
│   └── use-store.ts        # Global state hooks
│
└── types/                  # Frontend-specific types
    └── index.ts
```

## State Management
1.  **URL State**: Prefer storing state in search params (e.g., filters, sort order, pagination) to make it shareable and persistent.
2.  **Server State**: Data fetched from the server.
3.  **Local State**: `useState` / `useReducer` for component-specific UI state (e.g., toggle menu, form input).
4.  **Global Client State**: Use minimally (e.g., for user session or highly interactive complex UI).

## Styling (Tailwind CSS)
- **Utility-First**: Use Tailwind classes for layout and spacing.
- **Consistency**: Use design tokens (colors, spacing) defined in `tailwind.config.js`.
- **Conditional Classes**: Use `clsx` or `cn` (shadcn/ui utility) for conditional styling.
