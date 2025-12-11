import { z } from 'zod';

export const TicketStatus = z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED']);
export type TicketStatus = z.infer<typeof TicketStatus>;

export const TicketPriority = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export type TicketPriority = z.infer<typeof TicketPriority>;

export const TicketSchema = z.object({
  id: z.string().uuid().optional(), // Optional for creation
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: TicketStatus.default('TODO'),
  priority: TicketPriority.default('MEDIUM'),
  projectId: z.string().uuid(),
  assigneeId: z.string().optional(),
  source: z.string().default('MANUAL'), // JIRA, GITHUB, etc.
  sourceUrl: z.string().url().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Ticket = z.infer<typeof TicketSchema>;

export const CreateTicketSchema = TicketSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;

export const UpdateTicketSchema = TicketSchema.partial().omit({ id: true });
export type UpdateTicketInput = z.infer<typeof UpdateTicketSchema>;
