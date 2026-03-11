import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { loginWithPassword } from "../services/authService.js";

export const authRouter = Router();

const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(3).max(100),
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const parsed = loginSchema.parse(req.body);
    const result = await loginWithPassword({
      username: parsed.username.trim().toLowerCase(),
      password: parsed.password,
    });

    return res.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_CREDENTIALS") {
      return res.status(401).json({ message: "Usuário ou senha inválidos." });
    }

    return next(error);
  }
});

authRouter.get("/me", requireAuth, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  return res.json({ user: authReq.authUser });
});
