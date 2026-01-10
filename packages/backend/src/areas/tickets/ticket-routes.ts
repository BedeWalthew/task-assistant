import { Router } from "express";
import { z } from "zod";
import * as TicketController from "./ticket-controller";
import { validate } from "../../common/middleware/validate";
import {
  CreateTicketSchema,
  UpdateTicketSchema,
  TicketSchema,
  TicketFilterSchema,
  ReorderTicketSchema,
} from "@task-assistant/shared";

export const ticketsRouter = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Ticket:
 *       type: object
 *       required:
 *         - title
 *         - projectId
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         status:
 *           type: string
 *           enum: ["TODO", "IN_PROGRESS", "DONE", "BLOCKED"]
 *         priority:
 *           type: string
 *           enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
 *         projectId:
 *           type: string
 *           format: uuid
 *         assigneeId:
 *           type: string
 *         source:
 *           type: string
 *         sourceUrl:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateTicketRequest:
 *       type: object
 *       required:
 *         - title
 *         - projectId
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         status:
 *           type: string
 *           enum: ["TODO", "IN_PROGRESS", "DONE", "BLOCKED"]
 *         priority:
 *           type: string
 *           enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
 *         projectId:
 *           type: string
 *           format: uuid
 *         assigneeId:
 *           type: string
 *         source:
 *           type: string
 *         sourceUrl:
 *           type: string
 *     UpdateTicketRequest:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         status:
 *           type: string
 *           enum: ["TODO", "IN_PROGRESS", "DONE", "BLOCKED"]
 *         priority:
 *           type: string
 *           enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
 *         projectId:
 *           type: string
 *           format: uuid
 *         assigneeId:
 *           type: string
 *         source:
 *           type: string
 *         sourceUrl:
 *           type: string
 */

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Ticket management API
 */

/**
 * @swagger
 * /tickets:
 *   get:
 *     summary: List all tickets
 *     tags: [Tickets]
 *     responses:
 *       200:
 *         description: List of tickets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Ticket'
 */
ticketsRouter.get(
  "/",
  validate(
    z.object({
      query: TicketFilterSchema,
    })
  ),
  TicketController.getAll
);

/**
 * @swagger
 * /tickets:
 *   post:
 *     summary: Create a ticket
 *     tags: [Tickets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTicketRequest'
 *     responses:
 *       201:
 *         description: Ticket created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 */
ticketsRouter.post(
  "/",
  validate(z.object({ body: CreateTicketSchema })),
  TicketController.create
);

/**
 * @swagger
 * /tickets/{id}:
 *   get:
 *     summary: Get ticket by id
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *     responses:
 *       200:
 *         description: Ticket detail
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 *       404:
 *         description: Ticket not found
 */
ticketsRouter.get(
  "/:id",
  validate(z.object({ params: z.object({ id: z.string().uuid() }) })),
  TicketController.getById
);

/**
 * @swagger
 * /tickets/{id}:
 *   put:
 *     summary: Update a ticket
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTicketRequest'
 *     responses:
 *       200:
 *         description: Ticket updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 *       404:
 *         description: Ticket not found
 */
ticketsRouter.put(
  "/:id",
  validate(
    z.object({
      params: z.object({ id: z.string().uuid() }),
      body: UpdateTicketSchema,
    })
  ),
  TicketController.update
);

/**
 * @swagger
 * /tickets/{id}:
 *   delete:
 *     summary: Delete a ticket
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *     responses:
 *       204:
 *         description: Ticket deleted
 *       404:
 *         description: Ticket not found
 */
ticketsRouter.delete(
  "/:id",
  validate(z.object({ params: z.object({ id: z.string().uuid() }) })),
  TicketController.deleteTicket
);

/**
 * @swagger
 * /tickets/{id}/reorder:
 *   patch:
 *     summary: Reorder a ticket (drag-drop)
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - position
 *             properties:
 *               status:
 *                 type: string
 *                 enum: ["TODO", "IN_PROGRESS", "DONE", "BLOCKED"]
 *               position:
 *                 type: number
 *               referenceTicketId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Ticket reordered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 *       404:
 *         description: Ticket not found
 *       409:
 *         description: Position conflict
 */
ticketsRouter.patch(
  "/:id/reorder",
  validate(
    z.object({
      params: z.object({ id: z.string().uuid() }),
      body: ReorderTicketSchema,
    })
  ),
  TicketController.reorder
);
