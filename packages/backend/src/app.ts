import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';

import { projectsRouter } from './areas/projects/project-routes';
import { errorHandler } from './common/middleware/error';

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/projects', projectsRouter);

app.use(errorHandler);

export { app };
