---
applyTo: '**'
---

# Next.js Best Practices for LLMs (2025)

_Last updated: July 2025_

This document summarizes the latest, authoritative best practices for building, structuring, and maintaining Next.js applications. It is intended for use by LLMs and developers to ensure code quality, maintainability, and scalability.

---

## Project-Specific Standards (Task Assistant)

This project is a **pnpm monorepo** with three packages:
- **`packages/frontend`**: Next.js application (App Router, React 19)
- **`packages/backend`**: Express.js API with Prisma ORM, PostgreSQL
- **`packages/shared`**: Shared Zod schemas and TypeScript types

### Frontend File Structure (`packages/frontend/src`)

```
src/
├── app/                    # Next.js App Router routes
├── components/
│   ├── ui/                 # Reusable primitives (shadcn/ui)
│   ├── features/           # Domain components (tickets/, projects/)
│   └── layout/             # Global layout (Navbar, Sidebar)
├── actions/                # Server Actions (mutations)
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities (cn, formatters, constants)
└── types/                  # Frontend-specific types
```

### Data Fetching Strategy

| Scenario | Strategy | Implementation |
|----------|----------|----------------|
| Initial page load / static data | **Server (Native)** | `fetch()` in Server Components or direct Prisma calls |
| Real-time / interactive data | **Client (TanStack Query)** | `useQuery` for polling, optimistic updates |
| Mutations (POST, PUT, DELETE) | **Server Actions** | `'use server'` functions in `src/actions/` |

**Rules:**
- **DO NOT** fetch data in Client Components using `useEffect`
- Pass data down from Server Components or use Server Actions
- Use `revalidatePath()` or `revalidateTag()` to refresh server data after mutations
- Invalidate TanStack Query cache after mutations: `queryClient.invalidateQueries(...)`

### State Management Priority

1. **URL State (preferred)**: Filters, sort order, pagination → use `searchParams`
2. **Server State**: Data from API/database
3. **Local State**: `useState` for component-specific UI (toggles, form inputs)
4. **Global Client State**: Use sparingly (user session, complex interactive UI only)

### Zod Validation

- All schemas live in `packages/shared/src/schemas/`
- Use `z.infer<typeof Schema>` for type derivation
- Validate API inputs on both frontend (forms) and backend (routes)

---

## 1. Project Structure & Organization

- **Use the `app/` directory** (App Router) for all new projects. Prefer it over the legacy `pages/` directory.
- **Top-level folders:**
  - `app/` — Routing, layouts, pages, and route handlers
  - `public/` — Static assets (images, fonts, etc.)
  - `lib/` — Shared utilities, API clients, and logic
  - `components/` — Reusable UI components
  - `contexts/` — React context providers
  - `styles/` — Global and modular stylesheets
  - `hooks/` — Custom React hooks
  - `types/` — TypeScript type definitions
- **Colocation:** Place files (components, styles, tests) near where they are used, but avoid deeply nested structures.
- **Route Groups:** Use parentheses (e.g., `(admin)`) to group routes without affecting the URL path.
- **Private Folders:** Prefix with `_` (e.g., `_internal`) to opt out of routing and signal implementation details.

- **Feature Folders:** For large apps, group by feature (e.g., `app/dashboard/`, `app/auth/`).
- **Use `src/`** (optional): Place all source code in `src/` to separate from config files.

## 2.1. Server and Client Component Integration (App Router)

**Never use `next/dynamic` with `{ ssr: false }` inside a Server Component.** This is not supported and will cause a build/runtime error.

**Correct Approach:**
- If you need to use a Client Component (e.g., a component that uses hooks, browser APIs, or client-only libraries) inside a Server Component, you must:
  1. Move all client-only logic/UI into a dedicated Client Component (with `'use client'` at the top).
  2. Import and use that Client Component directly in the Server Component (no need for `next/dynamic`).
  3. If you need to compose multiple client-only elements (e.g., a navbar with a profile dropdown), create a single Client Component that contains all of them.

**Example:**

```tsx
// Server Component
import DashboardNavbar from '@/components/DashboardNavbar';

export default async function DashboardPage() {
  // ...server logic...
  return (
    <>
      <DashboardNavbar /> {/* This is a Client Component */}
      {/* ...rest of server-rendered page... */}
    </>
  );
}
```

**Why:**
- Server Components cannot use client-only features or dynamic imports with SSR disabled.
- Client Components can be rendered inside Server Components, but not the other way around.

**Summary:**
Always move client-only UI into a Client Component and import it directly in your Server Component. Never use `next/dynamic` with `{ ssr: false }` in a Server Component.

---

## 2. Component Best Practices

- **Component Types:**
  - **Server Components** (default): For data fetching, heavy logic, and non-interactive UI.
  - **Client Components:** Add `'use client'` at the top. Use for interactivity, state, or browser APIs.
- **When to Create a Component:**
  - If a UI pattern is reused more than once.
  - If a section of a page is complex or self-contained.
  - If it improves readability or testability.
- **Naming Conventions:**
  - Use `PascalCase` for component files and exports (e.g., `UserCard.tsx`).
  - Use `camelCase` for hooks (e.g., `useUser.ts`).
  - Use `snake_case` or `kebab-case` for static assets (e.g., `logo_dark.svg`).
  - Name context providers as `XyzProvider` (e.g., `ThemeProvider`).
- **File Naming:**
  - Match the component name to the file name.
  - For single-export files, default export the component.
  - For multiple related components, use an `index.ts` barrel file.
- **Component Location:**
  - Place shared components in `components/`.
  - Place route-specific components inside the relevant route folder.
- **Props:**
  - Use TypeScript interfaces for props.
  - Prefer explicit prop types and default values.
- **Testing:**
  - Co-locate tests with components (e.g., `UserCard.test.tsx`).

## 3. Naming Conventions (General)

- **Folders:** `kebab-case` (e.g., `user-profile/`)
- **Files:** `PascalCase` for components, `camelCase` for utilities/hooks, `kebab-case` for static assets
- **Variables/Functions:** `camelCase`
- **Types/Interfaces:** `PascalCase`
- **Constants:** `UPPER_SNAKE_CASE`

## 4. API Routes (Route Handlers)

- **Prefer API Routes over Edge Functions** unless you need ultra-low latency or geographic distribution.
- **Location:** Place API routes in `app/api/` (e.g., `app/api/users/route.ts`).
- **HTTP Methods:** Export async functions named after HTTP verbs (`GET`, `POST`, etc.).
- **Request/Response:** Use the Web `Request` and `Response` APIs. Use `NextRequest`/`NextResponse` for advanced features.
- **Dynamic Segments:** Use `[param]` for dynamic API routes (e.g., `app/api/users/[id]/route.ts`).
- **Validation:** Always validate and sanitize input. Use libraries like `zod` or `yup`.
- **Error Handling:** Return appropriate HTTP status codes and error messages.
- **Authentication:** Protect sensitive routes using middleware or server-side session checks.

## 5. General Best Practices

- **TypeScript:** Use TypeScript for all code. Enable `strict` mode in `tsconfig.json`.
- **ESLint & Prettier:** Enforce code style and linting. Use the official Next.js ESLint config.
- **Environment Variables:** Store secrets in `.env.local`. Never commit secrets to version control.
- **Testing:**
  - **Backend**: Jest with Supertest for API integration tests
  - **Frontend**: Jest with React Testing Library for component tests
  - **E2E**: Playwright (see `playwright-typescript.instructions.md`)
  - Write tests for all critical logic and components.
- **Accessibility:** Use semantic HTML and ARIA attributes. Test with screen readers.
- **Performance:**
  - Use built-in Image and Font optimization.
  - Use Suspense and loading states for async data.
  - Avoid large client bundles; keep most logic in Server Components.
- **Security:**
  - Sanitize all user input.
  - Use HTTPS in production.
  - Set secure HTTP headers.
- **Documentation:**
  - Write clear README and code comments.
  - Document public APIs and components.

## 6. Styling (Tailwind CSS + shadcn/ui)

- Use **Tailwind utility classes** for layout, spacing, and responsive design
- Use **shadcn/ui** components as the base for UI primitives (in `components/ui/`)
- Use the `cn()` utility (from shadcn) for conditional class merging:
  ```tsx
  import { cn } from '@/lib/utils';
  <div className={cn('base-class', isActive && 'active-class')} />
  ```
- Follow design tokens defined in `tailwind.config.ts`
- Never use inline styles; prefer Tailwind classes

# Avoid Unnecessary Example Files

Do not create example/demo files (like ModalExample.tsx) in the main codebase unless the user specifically requests a live example, Storybook story, or explicit documentation component. Keep the repository clean and production-focused by default.

# Always use the latest documentation and guides
- For every nextjs related request, begin by searching for the most current nextjs documentation, guides, and examples.
- Use the following tools to fetch and search documentation if they are available:
  - `resolve_library_id` to resolve the package/library name in the docs.
  - `get_library_docs` for up to date documentation.


