import { Router } from "express";
import { z } from "zod";
import * as ProjectController from "./project-controller";
import { validate } from "../../common/middleware/validate";
import {
  CreateProjectSchema,
  UpdateProjectSchema,
} from "@task-assistant/shared";

export const projectsRouter = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Project:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated id of the project
 *         name:
 *           type: string
 *           description: The name of the project
 *         key:
 *           type: string
 *           description: Unique project key (e.g., "PROJ")
 *           readOnly: true
 *         description:
 *           type: string
 *           description: The project description
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the project was added
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the project was last updated
 */

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: The projects managing API
 */

/**
 * @swagger
 * /projects:
 *   get:
 *     summary: Returns the list of all projects
 *     tags: [Projects]
 *     responses:
 *       200:
 *         description: The list of the projects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Project'
 */
projectsRouter.get("/", ProjectController.getAll);

/**
 * @swagger
 * /projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: The created project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 */
projectsRouter.post(
  "/",
  validate(z.object({ body: CreateProjectSchema })),
  ProjectController.create
);

/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     summary: Get the project by id
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The project id
 *     responses:
 *       200:
 *         description: The project description by id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       404:
 *         description: The project was not found
 */
projectsRouter.get(
  "/:id",
  validate(z.object({ params: z.object({ id: z.string().uuid() }) })),
  ProjectController.getById
);

/**
 * @swagger
 * /projects/{id}:
 *   put:
 *     summary: Update the project by the id
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The project id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: The project was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       404:
 *         description: The project was not found
 */
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

/**
 * @swagger
 * /projects/{id}:
 *   delete:
 *     summary: Remove the project by id
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The project id
 *     responses:
 *       200:
 *         description: The project was deleted
 *       404:
 *         description: The project was not found
 */
projectsRouter.delete(
  "/:id",
  validate(z.object({ params: z.object({ id: z.string().uuid() }) })),
  ProjectController.deleteProject
);
