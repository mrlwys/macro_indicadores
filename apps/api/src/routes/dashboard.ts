import { Router } from "express";
import { z } from "zod";
import { dashboardDataSchema } from "../lib/dashboardSchema.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { createDashboardSnapshot, getLatestDashboard } from "../services/dashboardService.js";

export const dashboardRouter = Router();

const createSnapshotSchema = z.object({
  source: z.string().default("manual"),
  referenceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  payload: dashboardDataSchema,
});

dashboardRouter.get("/latest", requireAuth, async (_req, res, next) => {
  try {
    const snapshot = await getLatestDashboard();
    res.json(snapshot);
  } catch (error) {
    next(error);
  }
});

dashboardRouter.post("/snapshot", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const parsed = createSnapshotSchema.parse(req.body);
    const created = await createDashboardSnapshot({
      source: parsed.source,
      referenceDate: parsed.referenceDate,
      payload: parsed.payload,
    });

    if (!created) {
      return res.status(503).json({
        message: "Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.",
      });
    }

    return res.status(201).json(created);
  } catch (error) {
    return next(error);
  }
});
