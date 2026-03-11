import bcrypt from "bcryptjs";
import { getUserByUsername } from "./usersService.js";
import { signAuthToken } from "../lib/auth.js";
import type { AuthUser, AccessLevel } from "../lib/types.js";

export async function loginWithPassword(input: { username: string; password: string }): Promise<{
  token: string;
  user: AuthUser;
}> {
  const user = await getUserByUsername(input.username);

  if (!user || !user.is_active) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const matches = await bcrypt.compare(input.password, user.password_hash);
  if (!matches) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const authUser: AuthUser = {
    id: user.id,
    username: user.username,
    accessLevel: user.access_level as AccessLevel,
  };

  return {
    token: signAuthToken(authUser),
    user: authUser,
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
