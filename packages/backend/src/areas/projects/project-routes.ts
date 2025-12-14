import { Router } from "express";
import { z } from "zod";
import * as ProjectController from "./project-controller";
import { validate } from "../../common/middleware/validate";
import {
  CreateProjectSchema,
  UpdateProjectSchema,
} from "@task-assistant/shared";

export const projectsRouter = Router();

projectsRouter.get("/", ProjectController.getAll);
projectsRouter.post(
  "/",
  validate(z.object({ body: CreateProjectSchema })),
  ProjectController.create
);
projectsRouter.get(
  "/:id",
  validate(z.object({ params: z.object({ id: z.string().uuid() }) })),
  ProjectController.getById
);
projectsRouter.put(
  "/:id",
  validate(
    z.object({
      params: z.object({ id: z.string().uuid() }),
      body: UpdateProjectSchema,
    })
  ),
  ProjectController.update
);
projectsRouter.delete(
  "/:id",
  validate(z.object({ params: z.object({ id: z.string().uuid() }) })),
  ProjectController.deleteProject
);
