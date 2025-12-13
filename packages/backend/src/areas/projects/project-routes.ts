import { Router } from 'express';
import { ProjectController } from './project-controller';

export const projectsRouter = Router();

projectsRouter.get('/', ProjectController.getAll);
