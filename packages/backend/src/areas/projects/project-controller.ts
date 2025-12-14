import { type Request, type Response } from "express";
import * as ProjectService from "./project-service";
import { AppError } from "../../common/utils/AppError";

export const getAll = async (req: Request, res: Response) => {
  const projects = await ProjectService.getAll();
  res.json({ data: projects });
};

export const getById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const project = await ProjectService.getById(id);
  res.json({ data: project });
};

export const create = async (req: Request, res: Response) => {
  const project = await ProjectService.create(req.body);
  res.status(201).json({ data: project });
};

export const update = async (req: Request, res: Response) => {
  const { id } = req.params;
  const project = await ProjectService.update(id, req.body);
  res.json({ data: project });
};

export const deleteProject = async (req: Request, res: Response) => {
  const { id } = req.params;
  await ProjectService.deleteProject(id);
  res.status(204).send();
};
