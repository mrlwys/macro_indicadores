import { Router } from "express";
import { z } from "zod";
import { createDashboardSnapshot, getLatestDashboard } from "../services/dashboardService.js";

export const dashboardRouter = Router();

const createSnapshotSchema = z.object({
  source: z.string().default("manual"),
  referenceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  payload: z.record(z.string(), z.unknown()),
});

dashboardRouter.get("/latest", async (_req, res, next) => {
  try {
    const snapshot = await getLatestDashboard();
    res.json(snapshot);
  } catch (error) {
    next(error);
  }
});

dashboardRouter.post("/snapshot", async (req, res, next) => {
  try {
    const parsed = createSnapshotSchema.parse(req.body);
    const created = await createDashboardSnapshot({
      source: parsed.source,
      referenceDate: parsed.referenceDate,
      payload: parsed.payload as never,
    });

    if (!created) {
      return res.status(503).json({
        message: "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      });
    }

    return res.status(201).json(created);
  } catch (error) {
    return next(error);
  }
});
