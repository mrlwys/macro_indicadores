import { Router } from "express";
import { env } from "../config/env.js";
import { createDashboardSnapshot } from "../services/dashboardService.js";
import { runSyncJob } from "../jobs/syncData.js";

export const syncRouter = Router();

syncRouter.post("/", async (req, res, next) => {
  try {
    if (env.SYNC_SECRET) {
      const provided = req.header("x-sync-secret");
      if (provided !== env.SYNC_SECRET) {
        return res.status(401).json({ message: "Unauthorized" });
      }
    }

    const result = await runSyncJob();
    const referenceDate = new Date().toISOString().slice(0, 10);

    const snapshot = await createDashboardSnapshot({
      source: "sync_job",
      referenceDate,
      payload: result.mergedPayload,
    });

    return res.status(202).json({
      message: "Sync executed",
      snapshotSaved: Boolean(snapshot),
      ...result,
    });
  } catch (error) {
    return next(error);
  }
});
