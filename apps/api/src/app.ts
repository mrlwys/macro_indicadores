import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { ZodError } from "zod";
import { env } from "./config/env.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { healthRouter } from "./routes/health.js";
import { syncRouter } from "./routes/sync.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json({ limit: "2mb" }));
  app.use(morgan("dev"));

  app.get("/", (_req, res) => {
    res.json({
      service: "macro-indicadores-api",
      docs: "/api/health",
    });
  });

  app.use("/api/health", healthRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/sync", syncRouter);

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof ZodError) {
      return res.status(400).json({
        message: "Invalid request payload",
        details: err.issues,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
      detail: err instanceof Error ? err.message : "Unknown error",
    });
  });

  return app;
}
