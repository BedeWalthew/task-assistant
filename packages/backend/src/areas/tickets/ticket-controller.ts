import { type Request, type Response } from "express";
import * as TicketService from "./ticket-service";

export const getAll = async (_req: Request, res: Response) => {
  const tickets = await TicketService.getAll();
  res.json({ data: tickets });
};

export const getById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const ticket = await TicketService.getById(id);
  res.json({ data: ticket });
};

export const create = async (req: Request, res: Response) => {
  const ticket = await TicketService.create(req.body);
  res.status(201).json({ data: ticket });
};

export const update = async (req: Request, res: Response) => {
  const { id } = req.params;
  const ticket = await TicketService.update(id, req.body);
  res.json({ data: ticket });
};

export const deleteTicket = async (req: Request, res: Response) => {
  const { id } = req.params;
  await TicketService.deleteTicket(id);
  res.status(204).send();
};
