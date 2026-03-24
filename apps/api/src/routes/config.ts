import { Router } from "express";
import { z } from "zod";
import { requireAdmin, requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import {
  createDashboardConfigEntry,
  deleteDashboardConfigEntry,
  listDashboardConfigDefinitions,
  listDashboardConfigEntries,
  listDashboardConfigHistory,
  updateDashboardConfigEntry,
} from "../services/dashboardConfigService.js";

export const configRouter = Router();

const configValueTypeSchema = z.enum(["number", "boolean", "text"]);

const baseConfigSchema = z.object({
  configKey: z.string().min(1),
  referenceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  valueType: configValueTypeSchema,
  valueNumber: z.number().nullable().optional(),
  valueBoolean: z.boolean().nullable().optional(),
  valueText: z.string().nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
}).superRefine((input, ctx) => {
  if (input.valueType === "number" && typeof input.valueNumber !== "number") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Informe um valor numérico para este campo.",
      path: ["valueNumber"],
    });
  }

  if (input.valueType === "boolean" && typeof input.valueBoolean !== "boolean") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Informe um valor booleano para este campo.",
      path: ["valueBoolean"],
    });
  }

  if (input.valueType === "text" && (!input.valueText || !input.valueText.trim())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Informe um texto para este campo.",
      path: ["valueText"],
    });
  }
});

const updateConfigSchema = baseConfigSchema.extend({
  id: z.string().uuid(),
});

configRouter.use(requireAuth, requireAdmin);

configRouter.get("/entries", async (_req, res, next) => {
  try {
    const [entries, history] = await Promise.all([
      listDashboardConfigEntries(),
      listDashboardConfigHistory(),
    ]);

    res.json({
      definitions: listDashboardConfigDefinitions(),
      entries,
      history,
    });
  } catch (error) {
    next(error);
  }
});

configRouter.post("/entries", async (req: AuthenticatedRequest, res, next) => {
  try {
    const parsed = baseConfigSchema.parse(req.body);
    const created = await createDashboardConfigEntry({
      configKey: parsed.configKey,
      referenceDate: parsed.referenceDate,
      valueType: parsed.valueType,
      valueNumber: parsed.valueType === "number" ? parsed.valueNumber ?? null : null,
      valueBoolean: parsed.valueType === "boolean" ? parsed.valueBoolean ?? null : null,
      valueText: parsed.valueType === "text" ? parsed.valueText?.trim() ?? null : null,
      notes: parsed.notes?.trim() || null,
      actedBy: req.authUser?.id ?? null,
    });

    res.status(201).json({
      message: "Dado de configuração salvo com sucesso.",
      entry: created,
    });
  } catch (error) {
    next(error);
  }
});

configRouter.put("/entries/:id", async (req: AuthenticatedRequest, res, next) => {
  try {
    const parsed = updateConfigSchema.parse({
      ...req.body,
      id: req.params.id,
    });

    const updated = await updateDashboardConfigEntry({
      id: parsed.id,
      configKey: parsed.configKey,
      referenceDate: parsed.referenceDate,
      valueType: parsed.valueType,
      valueNumber: parsed.valueType === "number" ? parsed.valueNumber ?? null : null,
      valueBoolean: parsed.valueType === "boolean" ? parsed.valueBoolean ?? null : null,
      valueText: parsed.valueType === "text" ? parsed.valueText?.trim() ?? null : null,
      notes: parsed.notes?.trim() || null,
      actedBy: req.authUser?.id ?? null,
    });

    if (!updated) {
      return res.status(404).json({ message: "Registro de configuração não encontrado." });
    }

    return res.json({
      message: "Dado de configuração atualizado com sucesso.",
      entry: updated,
    });
  } catch (error) {
    return next(error);
  }
});

configRouter.delete("/entries/:id", async (req: AuthenticatedRequest, res, next) => {
  try {
    const deleted = await deleteDashboardConfigEntry({
      id: String(req.params.id),
      actedBy: req.authUser?.id ?? null,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Registro de configuração não encontrado." });
    }

    return res.json({
      message: "Dado de configuração excluído com sucesso.",
    });
  } catch (error) {
    return next(error);
  }
});
