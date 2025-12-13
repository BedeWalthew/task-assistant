import { type Request, type Response } from 'express';
import { ProjectService } from './project-service';

export class ProjectController {
  static async getAll(req: Request, res: Response) {
    const projects = await ProjectService.getAll();
    res.json({ data: projects });
  }
}
