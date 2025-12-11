# Code Standards & Best Practices

## TypeScript Configuration
We enforce strict TypeScript rules to ensure type safety and catch errors early.

- **`strict: true`**: Enabled in `tsconfig.json`.
- **`noImplicitAny: true`**: All variables must have a defined type. Explicit `any` is discouraged; use `unknown` if necessary.
- **`strictNullChecks: true`**: `null` and `undefined` are distinct types.
- **`noUnusedLocals: true`**: No unused variables allowed.
- **`noUnusedParameters: true`**: No unused function parameters.

## Validation (Zod)
All external data and API boundaries must be validated using Zod.

- **Backend Routes**: Every Express route must validate `req.body`, `req.query`, and `req.params` using Zod schemas.
- **Shared Schemas**: Zod schemas used by both frontend and backend should be defined in `packages/shared`.
- **Type Inference**: Use `z.infer<typeof Schema>` to generate TypeScript types from Zod schemas.

## Project Structure
- **`packages/frontend`**: Next.js application (UI, heavy client logic).
- **`packages/backend`**: Express application (API, DB logic).
- **`packages/shared`**: Shared types, Zod schemas, helper functions.

## Formatting & Linting
- **Prettier**: For code formatting.
- **ESLint**: For code quality and best practices.

## Testing
- **Framework**: **Vitest**. (Compatible with Vite/Next.js).
- **Strategy**: 
    - **Unit Tests**: For pure functions and shared utilities.
    - **Integration Tests**: For API endpoints (using a test DB or mocked Prisma).
    - **TDD Friendly**: Write tests *before* implementation where possible to allow AI-assisted iteration.
