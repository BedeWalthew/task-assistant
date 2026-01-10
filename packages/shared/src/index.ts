// Ticket schemas and types
export {
  TicketSchema,
  TicketStatus,
  TicketPriority,
  TicketSortBy,
  TicketSortOrder,
  TicketFilterSchema,
  CreateTicketSchema,
  UpdateTicketSchema,
  ReorderTicketSchema,
  type Ticket,
  type TicketFilterInput,
  type CreateTicketInput,
  type UpdateTicketInput,
  type ReorderTicketInput,
} from "./schemas/ticket";

// Project schemas and types
export {
  ProjectSchema,
  CreateProjectSchema,
  UpdateProjectSchema,
  type Project,
  type CreateProjectInput,
  type UpdateProjectInput,
} from "./schemas/project";

// API Response types
export type ApiResponse<T> = {
  data: T;
  message?: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type ApiError = {
  message: string;
  statusCode: number;
};
