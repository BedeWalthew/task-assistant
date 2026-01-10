/**
 * Reusable test data for E2E tests
 */

export const testProject = {
  name: "E2E Test Project",
  key: "E2E",
  description: "Project created during E2E testing",
};

export const testTicket = {
  title: "E2E Test Ticket",
  description: "Ticket created during E2E testing",
  status: "TODO" as const,
  priority: "HIGH" as const,
};

export const statuses = ["TODO", "IN_PROGRESS", "DONE", "BLOCKED"] as const;
export const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export const selectors = {
  // Navigation
  headerBrand: '[data-testid="header-brand"]',
  navProjects: '[data-testid="nav-projects"]',
  navTickets: '[data-testid="nav-tickets"]',

  // Projects
  projectCard: '[data-testid="project-card"]',
  projectCreateForm: '[data-testid="project-create-form"]',
  projectNameInput: '[data-testid="project-name-input"]',
  projectKeyInput: '[data-testid="project-key-input"]',
  projectDescInput: '[data-testid="project-desc-input"]',
  projectSubmitBtn: '[data-testid="project-submit-btn"]',

  // Tickets
  ticketCard: '[data-testid="ticket-card"]',
  createTicketBtn: '[data-testid="create-ticket-btn"]',
  createTicketModal: '[data-testid="create-ticket-modal"]',
  ticketTitleInput: '[data-testid="ticket-title-input"]',
  ticketDescInput: '[data-testid="ticket-desc-input"]',
  ticketProjectSelect: '[data-testid="ticket-project-select"]',
  ticketStatusSelect: '[data-testid="ticket-status-select"]',
  ticketPrioritySelect: '[data-testid="ticket-priority-select"]',
  ticketSubmitBtn: '[data-testid="ticket-submit-btn"]',

  // Filter bar
  filterSearch: '[data-testid="filter-search"]',
  filterStatus: '[data-testid="filter-status"]',
  filterPriority: '[data-testid="filter-priority"]',
  filterProject: '[data-testid="filter-project"]',
  filterSort: '[data-testid="filter-sort"]',
  clearFilters: '[data-testid="clear-filters"]',
  viewToggleList: '[data-testid="view-toggle-list"]',
  viewToggleBoard: '[data-testid="view-toggle-board"]',

  // Kanban
  kanbanColumn: (status: string) => `[data-testid="column-${status}"]`,
  columnCount: (status: string) => `[data-testid="column-count-${status}"]`,
  draggableTicket: '[data-testid="draggable-ticket"]',

  // Pagination
  paginationPrev: '[data-testid="pagination-prev"]',
  paginationNext: '[data-testid="pagination-next"]',
  paginationInfo: '[data-testid="pagination-info"]',
};
