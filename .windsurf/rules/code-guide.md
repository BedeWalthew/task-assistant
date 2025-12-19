---
trigger: always_on
---

# Quick TL;DR Rules for New Features

- +## General
  +- TypeScript strict: no `any`; prefer `z.infer` types from schemas.
  +- Validate all external data with Zod; shared schemas live in `packages/shared`.
  +- Keep formatting/linting clean (Prettier/ESLint).
- +## Frontend (Next.js)
  +- Default to Server Components; use Client Components only when interactivity is required.
  +- Fetch on the server; mutations via Server Actions; `revalidatePath/Tag` after mutate.
  +- Avoid `useEffect` data fetching; use TanStack Query only for real-time/optimistic needs.
  +- Use Suspense for async UI.
  +- UI components: use shadcn/ui primitives first. If a needed component exists in shadcn, import/add it instead of hand-rolling.
- +## Backend (Express)
  +- Follow layered architecture: Controller (I/O) → Service (business) → Data (Prisma).
  +- Every route validates `body/query/params` with Zod middleware from shared schemas.
  +- Services return typed data; controllers stay thin. Use AppError for controlled errors.
  +- Keep DB access in services; review migrations before applying.
- +## Testing
  +- Practice TDD when possible.
  +- Unit tests for pure logic/shared utils; integration tests for routes with validated inputs.
