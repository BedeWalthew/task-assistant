import { z } from 'zod';

export const ProjectSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  key: z.string().min(2).max(10).toUpperCase(), // e.g., "PROJ"
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Project = z.infer<typeof ProjectSchema>;

export const CreateProjectSchema = ProjectSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

export const UpdateProjectSchema = ProjectSchema.omit({ id: true, createdAt: true, updatedAt: true }).partial();
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
