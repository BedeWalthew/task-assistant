# Feature Implementation Checklist

Use this checklist for every new feature to ensure consistency and quality.

## 1. Preparation (TDD Starts Here)
- [ ] **Define Requirements**: Clear "As a user, I want..." statement.
- [ ] **Define Types (Shared)**: Create Zod schemas and TS types in `packages/shared`.
    - [ ] Request/Response DTOs.
    - [ ] Domain models.
- [ ] **Write Tests First (Red)**:
    - [ ] Backend: Integration test for the API endpoint (expect 404/500 initially).
    - [ ] Frontend: Component test checking for existence/props (expect failure).

## 2. Backend Implementation (`packages/backend`)
- [ ] **Route**: Define the route in `src/areas/{feature}/{feature}-routes.ts`.
- [ ] **Validation**: Add Zod middleware to the route using the shared schema.
- [ ] **Controller**: Create strictly typed controller method in `{feature}-controller.ts`.
- [ ] **Service**: Implement business logic in `{feature}-service.ts`.
- [ ] **Database**: Add/Update `schema.prisma` if needed (run `prisma migrate dev`).
- [ ] **Verify (Green)**: Run backend tests. They should pass now.

## 3. Frontend Implementation (`packages/frontend`)
- [ ] **Server Actions**: Create strictly typed Server Action in `src/actions/`.
- [ ] **UI Components**: Build components in `src/components/features/{feature}/`.
    - [ ] Use `shadcn/ui` primitives.
    - [ ] **Server**: Fetch data using `fetch` or `db` calls.
    - [ ] **Client**: Use `TanStack Query` ONLY if real-time/optimistic updates are needed.
- [ ] **Integration**: Connect UI to Server Actions.
- [ ] **Verify (Green)**: Run component/E2E tests.

## 4. Review & Polish
- [ ] **Strict Types**: No `any` types used?
- [ ] **Error Handling**: Are errors caught and displayed (toast/alert)?
- [ ] **Logging**: Structured logs added for critical paths (Pino)?
- [ ] **Docs**: Is the API route visible in Swagger/OpenAPI?
- [ ] **Refactor**: Clean up code while keeping tests green.
