import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { AuthUser } from "./types.js";

type AuthTokenPayload = {
  sub: string;
  username: string;
  accessLevel: AuthUser["accessLevel"];
};

export function signAuthToken(user: AuthUser): string {
  return jwt.sign(
    {
      sub: user.id,
      username: user.username,
      accessLevel: user.accessLevel,
    } satisfies AuthTokenPayload,
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] },
  );
}

export function verifyAuthToken(token: string): AuthUser {
  const decoded = jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;

  if (!decoded?.sub || !decoded?.username || !decoded?.accessLevel) {
    throw new Error("Invalid token payload");
  }

  return {
    id: decoded.sub,
    username: decoded.username,
    accessLevel: decoded.accessLevel,
  };
}
