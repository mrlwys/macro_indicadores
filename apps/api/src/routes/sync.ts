import { Router } from "express";
import { env } from "../config/env.js";
import { createDashboardSnapshot } from "../services/dashboardService.js";
import { finishSyncRun, startSyncRun } from "../services/syncRunsService.js";
import { runSyncJob } from "../jobs/syncData.js";
import { requireAdmin, requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";

export const syncRouter = Router();

syncRouter.post("/", requireAuth, requireAdmin, async (req, res, next) => {
  let runId: string | null = null;

  try {
    if (env.SYNC_SECRET) {
      const provided = req.header("x-sync-secret");
      if (provided !== env.SYNC_SECRET) {
        return res.status(401).json({ message: "Não autorizado." });
      }
    }

    const authReq = req as AuthenticatedRequest;
    const syncRun = await startSyncRun({
      syncKey: "nomus_sync",
      metadata: {
        requestedBy: authReq.authUser?.id ?? null,
      },
    });
    runId = syncRun.id;

    const result = await runSyncJob();
    let snapshotSaved = false;

    if (result.canPersistSnapshot) {
      const referenceDate = new Date().toISOString().slice(0, 10);
      const snapshot = await createDashboardSnapshot({
        source: "sync_job",
        referenceDate,
        payload: result.mergedPayload,
      });
      snapshotSaved = Boolean(snapshot);
    }

    await finishSyncRun({
      runId,
      status: result.status,
      sourcesTried: result.sourcesTried,
      sourcesSucceeded: result.sourcesSucceeded,
      errors: result.errors,
      metadata: {
        details: result.details ?? {},
        snapshotSaved,
      },
    });
    runId = null;

    return res.status(202).json({
      message:
        result.status === "success"
          ? "Sincronização executada com sucesso."
          : result.status === "degraded"
            ? "Sincronização concluída com degradação. Snapshot novo não foi salvo."
            : "Sincronização falhou. Snapshot novo não foi salvo.",
      snapshotSaved,
      ...result,
    });
  } catch (error) {
    if (runId) {
      try {
        const message = error instanceof Error ? error.message : String(error);
        await finishSyncRun({
          runId,
          status: "failed",
          sourcesTried: [],
          sourcesSucceeded: [],
          errors: [message],
        });
      } catch {
        // Ignore secondary failure while finalizing sync metadata.
      }
    }

    if (error instanceof Error && error.message === "SYNC_ALREADY_RUNNING") {
      return res.status(409).json({ message: "Já existe uma sincronização do Nomus em execução." });
    }

    return next(error);
  }
});
