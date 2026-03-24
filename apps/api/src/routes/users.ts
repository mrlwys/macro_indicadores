import { Router } from "express";
import { z } from "zod";
import { requireAdmin, requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { generateTemporaryPassword, hashPassword } from "../services/authService.js";
import { createUser, deleteUser, listUsers, updateUser } from "../services/usersService.js";

export const usersRouter = Router();

const createUserSchema = z.object({
  fullName: z.string().min(2).max(120),
  username: z.string().min(3).max(50),
  accessLevel: z.enum(["admin", "user"]),
  isActive: z.boolean().default(true),
});

const updateUserSchema = z.object({
  fullName: z.string().min(2).max(120),
  username: z.string().min(3).max(50),
  accessLevel: z.enum(["admin", "user"]),
  isActive: z.boolean(),
});

usersRouter.get("/", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const users = await listUsers();
    return res.json({ users });
  } catch (error) {
    return next(error);
  }
});

usersRouter.post("/", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const parsed = createUserSchema.parse(req.body);
    const normalizedUsername = parsed.username.trim().toLowerCase();
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(temporaryPassword);

    const user = await createUser({
      fullName: parsed.fullName.trim(),
      username: normalizedUsername,
      passwordHash,
      accessLevel: parsed.accessLevel,
      isActive: parsed.isActive,
    });

    return res.status(201).json({
      user,
      temporaryPassword,
      message: "Usuário criado com sucesso. Guarde a senha temporária exibida nesta confirmação.",
    });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error) {
      const maybeCode = (error as { code?: string }).code;
      if (maybeCode === "23505") {
        return res.status(409).json({ message: "Já existe um usuário com esse nome de usuário." });
      }
    }

    return next(error);
  }
});

usersRouter.put("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const userId = z.string().uuid().parse(req.params.id);
    const parsed = updateUserSchema.parse(req.body);

    const updated = await updateUser({
      userId,
      fullName: parsed.fullName.trim(),
      username: parsed.username.trim().toLowerCase(),
      accessLevel: parsed.accessLevel,
      isActive: parsed.isActive,
    });

    if (!updated) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    return res.json({ user: updated, message: "Usuário atualizado com sucesso." });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error) {
      const maybeCode = (error as { code?: string }).code;
      if (maybeCode === "23505") {
        return res.status(409).json({ message: "Já existe um usuário com esse nome de usuário." });
      }
    }

    return next(error);
  }
});

usersRouter.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = z.string().uuid().parse(req.params.id);

    if (authReq.authUser?.id === userId) {
      return res.status(400).json({ message: "Você não pode excluir o próprio usuário." });
    }

    const removed = await deleteUser(userId);
    if (!removed) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    return res.json({ message: "Usuário excluído com sucesso." });
  } catch (error) {
    return next(error);
  }
});
