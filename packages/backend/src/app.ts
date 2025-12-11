import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export { app };
