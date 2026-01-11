# Task Assistant - Development Roadmap

> **Last Updated:** 2026-01-10  
> **Current Focus:** Drag-and-drop polish, authentication, and CI/CD

---

## ✅ Completed

### Infrastructure & DevOps

- [x] Docker Compose setup (dev + production + test)
- [x] Monorepo structure with pnpm workspaces
- [x] PostgreSQL database container
- [x] Hot reload for backend & frontend in Docker
- [x] Database migration scripts via Prisma
- [x] GitHub PR agent (Qodo Merge) integration
- [x] Test database configuration for Docker

### Backend

- [x] Express.js API setup with TypeScript
- [x] Prisma ORM configuration with PostgreSQL
- [x] Full Project CRUD (`GET`, `POST`, `PUT`, `DELETE /projects`)
- [x] Full Ticket CRUD (`GET`, `POST`, `PUT`, `DELETE /tickets`)
- [x] Ticket filtering & sorting endpoints with pagination
- [x] Ticket reorder endpoint (`PATCH /tickets/:id/reorder`)
- [x] Jest testing framework with Supertest
- [x] API documentation (Swagger/OpenAPI)
- [x] Zod validation middleware
- [x] Position field for ticket ordering with DB indexes

### Frontend

- [x] Next.js 16 with React 19
- [x] shadcn/ui component library (Radix UI + Tailwind)
- [x] TanStack Query for client state management
- [x] Server Components with Server Actions
- [x] Project creation form and list
- [x] Project detail page
- [x] Ticket list view with URL-driven filters/sorting
- [x] Ticket creation modal (shadcn dialog + react-hook-form)
- [x] Kanban board view (4 status columns)
- [x] Drag-and-drop with @dnd-kit (within/across columns)
- [x] Optimistic updates for drag operations
- [x] Filter bar (status, priority, project, search, sort)
- [x] Toast notifications (sonner)

### Testing & Quality

- [x] Backend: Jest integration tests for all CRUD
- [x] E2E: Playwright test suites configured
- [x] E2E: Navigation tests
- [x] E2E: Project CRUD tests
- [x] E2E: Ticket CRUD tests
- [x] E2E: Filtering tests
- [x] E2E: Kanban drag-and-drop tests
- [ ] CI/CD pipeline for automated testing
- [ ] Test coverage reporting

---

## 📋 Next Up (Priority Order)

### Phase 2.5: Polish & UX Improvements (Current)

1. **Kanban Board Polish**
   - [ ] Quick-add ticket per column (inline form)
   - [ ] Horizontal scroll on mobile
   - [ ] ARIA improvements for screen readers
   - [ ] Keyboard navigation for drag-and-drop

2. **Performance Optimization**
   - [ ] Add missing DB indexes (assigneeId)
   - [ ] Implement connection pooling
   - [ ] Add request caching headers

3. **Developer Experience**
   - [ ] CI/CD pipeline (GitHub Actions)
   - [ ] Test coverage reporting
   - [ ] ESLint/Prettier configuration
   - [ ] Pre-commit hooks (Husky)

### Phase 3: Authentication

- [ ] NextAuth.js setup
- [ ] OAuth providers (Google, GitHub)
- [ ] Session management with Prisma
- [ ] Protected routes (frontend)
- [ ] Protected endpoints (backend)
- [ ] User model and relations

### Phase 4: AI Agent Integration

- [x] Architecture specification document
- [x] Agent package setup (Python + FastAPI + Google ADK)
- [x] API client for backend communication
- [x] Tool definitions:
  - [x] `create_ticket` - Create tickets via natural language
  - [x] `update_ticket` - Modify existing tickets
  - [x] `move_ticket` - Change ticket status
  - [x] `delete_ticket` - Remove tickets (with confirmation)
  - [x] `list_tickets` - Query tickets with filters
  - [x] `search_tickets` - Full-text search
  - [x] `list_projects` / `get_project`
  - [x] `get_board_summary` - Kanban overview
- [x] Agent service with Gemini LLM (Google ADK)
- [x] Session management via InMemorySessionService (ADK built-in)
- [x] Add agent to Docker Compose
- [x] Streaming responses (SSE)
- [x] Interactive test mode
- [x] Comprehensive README with examples
- [ ] Backend `/agent/chat` endpoint (proxy to agent service)
- [ ] Frontend chat UI component
- [ ] Rate limiting per user
- [ ] Voice input support (future)

---

## 🔮 Future Considerations

### Features

- [ ] Real-time updates (WebSockets)
- [ ] Notifications system
- [ ] File attachments
- [ ] Comments on tickets
- [ ] Activity timeline
- [ ] Multi-select drag (multiple tickets)
- [ ] Undo/redo functionality

### DevOps

- [ ] Production deployment strategy (Vercel/Railway)
- [ ] CI/CD automation (GitHub Actions)
- [ ] Performance monitoring
- [ ] Error tracking (Sentry)

### Quality

- [ ] E2E test coverage metrics
- [ ] Frontend component tests (Vitest/RTL)
- [ ] Performance benchmarks
- [ ] Accessibility audit (axe-core)

---

## 📝 Notes & Decisions

### Architecture Decisions

- **Monorepo:** pnpm workspaces (`packages/frontend`, `packages/backend`, `packages/shared`)
- **Database:** PostgreSQL with Prisma ORM
- **Frontend:** Next.js 16 with React 19, Server Components by default
- **State:** TanStack Query for client state, URL params for filter state
- **Drag-Drop:** @dnd-kit with fractional positioning (Float column)
- **Testing:** Jest (backend), Playwright (E2E)
- **Validation:** Zod schemas in `packages/shared` for full-stack type safety

### Current Blockers

- None

### Technical Debt

- [ ] ESLint/Prettier configuration
- [ ] Pre-commit hooks (Husky)
- [ ] More comprehensive error boundaries
- [ ] Loading skeletons for all views

---

## 🎯 Current Sprint Goal

**Goal:** Implement authentication and CI/CD pipeline

**Definition of Done:**

- Users can sign in with Google/GitHub OAuth
- Protected routes require authentication
- GitHub Actions runs tests on PR
- Test coverage reports generated
- Documentation updated
