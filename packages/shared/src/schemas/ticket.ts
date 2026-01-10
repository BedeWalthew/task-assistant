import { z } from "zod";

export const TicketStatus = z.enum(["TODO", "IN_PROGRESS", "DONE", "BLOCKED"]);
export type TicketStatus = z.infer<typeof TicketStatus>;

export const TicketPriority = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export type TicketPriority = z.infer<typeof TicketPriority>;

export const TicketSortBy = z.enum([
  "createdAt",
  "updatedAt",
  "priority",
  "status",
]);
export type TicketSortBy = z.infer<typeof TicketSortBy>;

export const TicketSortOrder = z.enum(["asc", "desc"]);
export type TicketSortOrder = z.infer<typeof TicketSortOrder>;

export const TicketSchema = z.object({
  id: z.string().uuid().optional(), // Optional for creation
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: TicketStatus.default("TODO"),
  priority: TicketPriority.default("MEDIUM"),
  position: z.number().default(0),
  projectId: z.string().uuid(),
  assigneeId: z.string().optional(),
  source: z.string().default("MANUAL"), // JIRA, GITHUB, etc.
  sourceUrl: z.string().url().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Ticket = z.infer<typeof TicketSchema>;

export const CreateTicketSchema = TicketSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;

export const UpdateTicketSchema = TicketSchema.partial().omit({ id: true });
export type UpdateTicketInput = z.infer<typeof UpdateTicketSchema>;

const numberFromQuery = (field: string, fallback: number, maxValue?: number) =>
  z
    .preprocess((value) => {
      if (value === undefined) return fallback;
      const parsed =
        typeof value === "string" ? parseInt(value, 10) : Number(value);
      return Number.isNaN(parsed) ? fallback : parsed;
    }, z.number().int().positive())
    .default(fallback)
    .refine((val) => (maxValue ? val <= maxValue : true), {
      message: maxValue
        ? `${field} must be <= ${maxValue}`
        : `${field} must be positive`,
    })
    .describe(field);

export const TicketFilterSchema = z.object({
  projectId: z.string().uuid().optional(),
  status: TicketStatus.optional(),
  priority: TicketPriority.optional(),
  assigneeId: z.string().uuid().optional(),
  search: z.string().trim().min(1).optional(),
  sortBy: TicketSortBy.default("createdAt"),
  sortOrder: TicketSortOrder.default("desc"),
  page: numberFromQuery("page", 1),
  limit: numberFromQuery("limit", 20, 100),
});
export type TicketFilterInput = z.infer<typeof TicketFilterSchema>;

export const ReorderTicketSchema = z.object({
  status: TicketStatus.optional(),
  position: z.number().positive(),
  referenceTicketId: z.string().uuid().optional(),
});
export type ReorderTicketInput = z.infer<typeof ReorderTicketSchema>;
