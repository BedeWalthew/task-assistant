# Task Assistant - Development Roadmap

> **Last Updated:** 2025-12-13  
> **Current Focus:** Core Backend Testing Infrastructure

---

## ✅ Completed

### Infrastructure & DevOps

- [x] Docker Compose setup (dev + production)
- [x] Monorepo structure with pnpm workspaces
- [x] PostgreSQL database container
- [x] Hot reload for backend & frontend in Docker
- [x] Database migration scripts via Prisma
- [x] GitHub PR agent (Qodo Merge) integration

### Backend

- [x] Express.js API setup
- [x] Prisma ORM configuration
- [x] Basic project routes (`GET /projects`)
- [x] Jest testing framework
- [x] Test coverage for project routes
  - [x] List all projects
  - [x] Verify response structure
  - [x] Handle empty data
  - [x] 404 handling
- [x] API documentation (Swagger/OpenAPI)

### Frontend

- [x] Next.js application setup
- [x] shadcn/ui component library
- [x] Basic project listing page

### Testing & Quality

- [x] Add test database configuration for Docker
- [ ] CI/CD pipeline for automated testing
- [ ] Test coverage reporting

---

## 📋 Next Up (Priority Order)

### Phase 1: Complete Core CRUD Operations

1. **Projects**

   - [x] `POST /projects` - Create project
   - [x] `GET /projects/:id` - Get single project
   - [x] `PUT /projects/:id` - Update project
   - [x] `DELETE /projects/:id` - Delete project
   - [x] Tests for all CRUD operations

2. **Tickets**
   - [x] Define ticket routes
   - [x] Implement ticket CRUD operations
   - [x] Add ticket-project relationships
   - [x] Test ticket operations

### Phase 2: Frontend Integration

- [x] Project creation form (baseline UI)
- [x] Project detail page (baseline UI)
- [x] Ticket creation UI (baseline)
- [x] Ticket list (baseline)
- [ ] Ticket filtering
- [ ] Board-style views (Notion-like) for projects and tickets (list / Kanban / other view types)

#### Phase 2 Detail

- Ticket filtering

  - [ ] Shared schema: `TicketFilterSchema` (`projectId`, `status`, `priority`, `assigneeId`, `search`, `sort`, `page`, `limit`) in `packages/shared`
  - [ ] Backend: validate query, map to Prisma `where/orderBy`, paginate `{items, total, page, pageSize}`
  - [ ] Tests: service combinations + route integration (200 + 400 on invalid)
  - [ ] Frontend: URL-driven filters (query params), server component data load, client filter bar (shadcn Select/Input/Tabs), empty/loading states
  - [ ] Performance: add DB indexes (status, projectId, assigneeId, priority), safe page-size defaults

- Board-style views
  - [ ] Data model: ensure ticket `status` enum (e.g., BACKLOG/TODO/IN_PROGRESS/REVIEW/DONE) + `position` for ordering; Prisma migration + seeds
  - [ ] Backend read: `view=board` response grouped by status, sorted by `position`
  - [ ] Backend write: update endpoint payload `{status, position}` (or bulk reorder) with Zod validation
  - [ ] Tests: reorder logic + move-between-column integration
  - [ ] Frontend: Kanban view (server-loaded data) with client drag-and-drop (`@dnd-kit`), optimistic move + server action persist, revalidatePath on success; keep list view wired to filters
  - [ ] UX: column counts, quick-add per column (optional), horizontal scroll on mobile, ARIA for draggable items

### Phase 3: Authentication

- [ ] NextAuth.js setup
- [ ] OAuth providers (Google, GitHub)
- [ ] Session management with Prisma
- [ ] Protected routes

### Phase 4: AI Agent Integration

- [ ] Python agent setup
- [ ] Google Gen AI SDK integration
- [ ] Agent API endpoints
- [ ] Agent-task interaction

---

## 🔮 Future Considerations

### Features

- [ ] Real-time updates (WebSockets)
- [ ] Notifications system
- [ ] File attachments
- [ ] Comments on tickets
- [ ] Activity timeline

### DevOps

- [ ] Production deployment strategy
- [ ] CI/CD automation
- [ ] Performance monitoring
- [ ] Error tracking (Sentry?)

### Quality

- [ ] E2E tests (Playwright)
- [ ] Frontend component tests
- [ ] Performance benchmarks

---

## 📝 Notes & Decisions

### Architecture Decisions

- **Monorepo:** Using pnpm workspaces (`packages/frontend`, `packages/backend`, `packages/shared`)
- **Database:** PostgreSQL with Prisma ORM
- **Frontend:** Next.js 14+ with Server Components (minimize client-side state)
- **Testing:** Jest for backend, focus on integration tests
- **Validation:** Zod schemas in `packages/shared` for type safety across stack

### Current Blockers

- None

### Technical Debt

- Consider adding ESLint/Prettier configuration
- Set up pre-commit hooks (Husky)
- Add database seeding for development

---

## 🎯 Current Sprint Goal

**Goal:** Complete backend CRUD operations for Projects and Tickets with full test coverage

**Definition of Done:**

- All CRUD endpoints implemented and tested
- Frontend can create/read/update/delete projects
- Test coverage > 80%
- Documentation updated
