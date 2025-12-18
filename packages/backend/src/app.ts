import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import "express-async-errors";

import { projectsRouter } from "./areas/projects/project-routes";
import { ticketsRouter } from "./areas/tickets/ticket-routes";
import { errorHandler } from "./common/middleware/error";

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/projects", projectsRouter);
app.use("/tickets", ticketsRouter);

app.use(errorHandler);

export { app };
