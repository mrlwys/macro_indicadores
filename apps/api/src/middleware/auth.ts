import type { NextFunction, Request, Response } from "express";
import { verifyAuthToken } from "../lib/auth.js";
import type { AuthUser } from "../lib/types.js";

export type AuthenticatedRequest = Request & {
  authUser?: AuthUser;
};

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.header("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing bearer token" });
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    req.authUser = verifyAuthToken(token);
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.authUser) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.authUser.accessLevel !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  return next();
}
