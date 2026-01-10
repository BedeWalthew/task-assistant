# E2E Testing Plan - Task Assistant

## Overview

This document outlines the comprehensive Playwright E2E testing strategy for the Task Assistant application. It covers all current features, test organization, and implementation details.

---

## Feature Inventory

### 1. Home Page (`/`)
| Feature | Component | Test Priority |
|---------|-----------|---------------|
| Header navigation | `layout.tsx` | High |
| Hero section content | `page.tsx` | Medium |
| Navigation to Projects | Link | High |
| Navigation to Tickets | Link | High |

### 2. Projects Page (`/projects`)
| Feature | Component | Test Priority |
|---------|-----------|---------------|
| Page title and description | `page.tsx` | Medium |
| Project creation form | `ProjectCreateForm.tsx` | **Critical** |
| Project list display | `ProjectList.tsx` | **Critical** |
| Form validation (name, key) | `ProjectCreateForm.tsx` | High |
| Duplicate key handling | Server Action | High |
| Empty state | `ProjectList.tsx` | Medium |

### 3. Project Detail Page (`/projects/[id]`)
| Feature | Component | Test Priority |
|---------|-----------|---------------|
| Project details display | `[id]/page.tsx` | Medium |
| 404 for non-existent project | `notFound()` | Medium |

### 4. Tickets Page - List View (`/tickets?view=list`)
| Feature | Component | Test Priority |
|---------|-----------|---------------|
| Page title and description | `page.tsx` | Medium |
| Ticket list display | `TicketList.tsx` | **Critical** |
| Ticket cards | `TicketCard.tsx` | High |
| Pagination | `Pagination` component | High |
| Empty state | `TicketList.tsx` | Medium |
| Project labels on cards | `TicketCard.tsx` | Medium |

### 5. Tickets Page - Board View (`/tickets?view=board`)
| Feature | Component | Test Priority |
|---------|-----------|---------------|
| Kanban columns (4 statuses) | `TicketColumn.tsx` | **Critical** |
| Drag and drop within column | `DraggableTicketCard.tsx` | **Critical** |
| Drag and drop across columns | `TicketBoard.tsx` | **Critical** |
| Column ticket counts | `TicketColumn.tsx` | Medium |
| Empty column state | `TicketColumn.tsx` | Medium |
| View toggle (List ↔ Board) | `FilterBar.tsx` | High |

### 6. Ticket Creation
| Feature | Component | Test Priority |
|---------|-----------|---------------|
| Create ticket modal trigger | `CreateTicketModal.tsx` | **Critical** |
| Modal open/close | `CreateTicketModal.tsx` | High |
| Form fields (title, description, etc.) | `TicketCreateForm.tsx` | **Critical** |
| Form validation | `TicketCreateForm.tsx` | **Critical** |
| Status/Priority selects | `TicketCreateForm.tsx` | High |
| Success toast | `useToast` | Medium |
| Modal closes on success | `CreateTicketModal.tsx` | High |

### 7. Filtering & Sorting
| Feature | Component | Test Priority |
|---------|-----------|---------------|
| Search by title/description | `FilterBar.tsx` | High |
| Filter by project | `FilterBar.tsx` | High |
| Filter by status | `FilterBar.tsx` | **Critical** |
| Filter by priority | `FilterBar.tsx` | High |
| Sort by created date | `FilterBar.tsx` | High |
| Sort by priority | `FilterBar.tsx` | High |
| Clear filters | `FilterBar.tsx` | Medium |
| URL reflects filters | Next.js searchParams | High |

### 8. Navigation & Layout
| Feature | Component | Test Priority |
|---------|-----------|---------------|
| Header brand link | `layout.tsx` | High |
| Projects nav link | `layout.tsx` | High |
| Tickets nav link | `layout.tsx` | High |
| Active link styling | `layout.tsx` | Low |

---

## Test File Structure

```
packages/frontend/
├── e2e/
│   ├── fixtures/
│   │   └── test-data.ts          # Reusable test data
│   ├── pages/
│   │   ├── home.spec.ts          # Home page tests
│   │   ├── projects.spec.ts      # Projects CRUD tests
│   │   └── tickets.spec.ts       # Tickets list/board tests
│   ├── features/
│   │   ├── navigation.spec.ts    # Header/nav tests
│   │   ├── filtering.spec.ts     # Filter bar tests
│   │   ├── kanban-dnd.spec.ts    # Drag & drop tests
│   │   └── ticket-crud.spec.ts   # Ticket creation tests
│   └── global-setup.ts           # Database seeding
├── playwright.config.ts
└── package.json
```

---

## Test Suite Breakdown

### Suite 1: Navigation (`navigation.spec.ts`)
```
✅ Header displays app title
✅ Header has Projects link
✅ Header has Tickets link
✅ Projects link navigates to /projects
✅ Tickets link navigates to /tickets
✅ Brand logo navigates to home
```

### Suite 2: Home Page (`home.spec.ts`)
```
✅ Displays welcome message
✅ Shows Projects card with link
✅ Shows Tickets card
✅ Projects card navigates to /projects
```

### Suite 3: Projects CRUD (`projects.spec.ts`)
```
✅ Displays page title and description
✅ Shows project creation form
✅ Displays project list
✅ Create project with valid data
✅ Shows validation error for missing name
✅ Shows validation error for invalid key (too short)
✅ Shows error for duplicate key
✅ New project appears in list after creation
✅ Project card shows name, key, description
✅ Empty state when no projects exist
```

### Suite 4: Tickets List View (`tickets.spec.ts`)
```
✅ Displays page title
✅ Shows filter bar
✅ Displays ticket list in list view
✅ Ticket cards show title, priority, project
✅ Pagination shows correct counts
✅ Next/Previous pagination works
✅ Empty state when no tickets
✅ Switches to board view
```

### Suite 5: Filtering (`filtering.spec.ts`)
```
✅ Search filters by title
✅ Search filters by description
✅ Status filter shows only matching tickets
✅ Priority filter shows only matching tickets
✅ Project filter shows only matching tickets
✅ Sort by newest first
✅ Sort by oldest first
✅ Sort by priority high to low
✅ Clear filters resets all
✅ Filters persist in URL
✅ Filters survive page reload
```

### Suite 6: Ticket Creation (`ticket-crud.spec.ts`)
```
✅ Create ticket button opens modal
✅ Modal has all form fields
✅ Modal can be closed with X button
✅ Modal can be closed with escape key
✅ Create ticket with minimum data (title + project)
✅ Create ticket with all fields
✅ Shows validation error for missing title
✅ Shows validation error for missing project
✅ Success toast appears on creation
✅ Modal closes after successful creation
✅ New ticket appears in list
```

### Suite 7: Kanban Board (`kanban-dnd.spec.ts`)
```
✅ Board displays 4 columns (TODO, IN_PROGRESS, DONE, BLOCKED)
✅ Columns show correct ticket counts
✅ Tickets render in correct columns by status
✅ Empty column shows placeholder message
✅ Drag ticket to new position in same column
✅ Drag ticket from TODO to IN_PROGRESS
✅ Drag ticket from IN_PROGRESS to DONE
✅ Drag ticket from DONE to BLOCKED
✅ Ticket status updates after cross-column drag
✅ Position persists after page reload
✅ Drag overlay appears during drag
```

---

## Configuration Details

### `playwright.config.ts`
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],
  timeout: 30000,
  
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'pnpm docker:dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

### Test Data Selectors Strategy

Components will be enhanced with `data-testid` attributes:

| Component | Selector |
|-----------|----------|
| Header brand | `data-testid="header-brand"` |
| Projects nav | `data-testid="nav-projects"` |
| Tickets nav | `data-testid="nav-tickets"` |
| Project card | `data-testid="project-card"` |
| Ticket card | `data-testid="ticket-card"` |
| Kanban column | `data-testid="column-{status}"` |
| Filter search | `data-testid="filter-search"` |
| Filter status | `data-testid="filter-status"` |
| Filter priority | `data-testid="filter-priority"` |
| Filter project | `data-testid="filter-project"` |
| Sort select | `data-testid="filter-sort"` |
| View toggle | `data-testid="view-toggle-{view}"` |
| Clear filters | `data-testid="clear-filters"` |
| Create ticket button | `data-testid="create-ticket-btn"` |
| Create ticket modal | `data-testid="create-ticket-modal"` |
| Pagination prev | `data-testid="pagination-prev"` |
| Pagination next | `data-testid="pagination-next"` |

---

## npm Scripts

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:chromium": "playwright test --project=chromium",
    "test:e2e:report": "playwright show-report"
  }
}
```

Root `package.json` additions:
```json
{
  "scripts": {
    "test:e2e": "pnpm --filter @task-assistant/frontend test:e2e",
    "docker:test:e2e": "docker compose up -d && pnpm test:e2e"
  }
}
```

---

## Implementation Order

1. **Phase 1: Setup**
   - Install Playwright dependencies
   - Create `playwright.config.ts`
   - Add npm scripts
   - Create e2e folder structure

2. **Phase 2: Add Test IDs**
   - Add `data-testid` to all key components
   - Ensure selectors are stable

3. **Phase 3: Write Tests (TDD - Red Phase)**
   - Write all failing tests first
   - Group by feature

4. **Phase 4: Fix Tests (Green Phase)**
   - Run tests iteratively
   - Fix any component issues
   - Adjust selectors as needed

5. **Phase 5: CI Integration**
   - Add GitHub Actions workflow
   - Configure test artifacts

---

## Database Considerations

For E2E tests, we need consistent test data:

**Option A**: Use development database with seed data
- Pros: Simple, matches dev environment
- Cons: Tests might interfere with dev data

**Option B**: Use docker-compose.test.yml with separate DB
- Pros: Isolated test environment
- Cons: More complex setup

**Recommended**: Use `pnpm docker:db:seed` before test runs to ensure consistent state.

---

## Drag-and-Drop Testing Strategy

Playwright's `dragTo()` method works well with `@dnd-kit`. Key considerations:

1. Wait for hydration before interacting (board mounts after client-side mount)
2. Use `data-testid` on draggable elements
3. Target droppable zones by column status
4. Verify position changes via API or re-render

Example:
```typescript
await page.locator('[data-testid="ticket-card"]').first().dragTo(
  page.locator('[data-testid="column-IN_PROGRESS"]')
);
```

---

## Success Criteria

- [ ] All 50+ test cases pass
- [ ] Tests run in < 3 minutes
- [ ] No flaky tests (3 consecutive green runs)
- [ ] Coverage of all critical user journeys
- [ ] CI pipeline integration
