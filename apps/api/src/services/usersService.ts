import { getSupabaseAdminClient } from "../lib/supabase.js";
import type { AccessLevel, UserPublic } from "../lib/types.js";

type UserRow = {
  id: string;
  full_name: string | null;
  username: string;
  password_hash: string;
  access_level: AccessLevel;
  is_active: boolean;
  created_at: string;
};

function toPublicUser(row: {
  id: string;
  full_name?: string | null;
  username: string;
  access_level: AccessLevel;
  is_active: boolean;
  created_at: string;
}): UserPublic {
  return {
    id: row.id,
    full_name: (row.full_name ?? "").trim() || row.username,
    username: row.username,
    access_level: row.access_level,
    is_active: row.is_active,
    created_at: row.created_at,
  };
}

export async function getUserByUsername(username: string): Promise<UserRow | null> {
  const client = getSupabaseAdminClient();
  if (!client) {
    throw new Error("Supabase is not configured");
  }

  const { data, error } = await client
    .from("app_users")
    .select("id, full_name, username, password_hash, access_level, is_active, created_at")
    .eq("username", username)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return data as UserRow;
}

export async function listUsers(): Promise<UserPublic[]> {
  const client = getSupabaseAdminClient();
  if (!client) {
    throw new Error("Supabase is not configured");
  }

  const { data, error } = await client
    .from("app_users")
    .select("id, full_name, username, access_level, is_active, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as Array<UserRow>).map((row) => toPublicUser(row));
}

export async function createUser(input: {
  fullName: string;
  username: string;
  passwordHash: string;
  accessLevel: AccessLevel;
  isActive: boolean;
}): Promise<UserPublic> {
  const client = getSupabaseAdminClient();
  if (!client) {
    throw new Error("Supabase is not configured");
  }

  const { data, error } = await client
    .from("app_users")
    .insert({
      full_name: input.fullName,
      username: input.username,
      password_hash: input.passwordHash,
      access_level: input.accessLevel,
      is_active: input.isActive,
    })
    .select("id, full_name, username, access_level, is_active, created_at")
    .single();

  if (error) {
    throw error;
  }

  return toPublicUser(data as UserRow);
}

export async function updateUser(input: {
  userId: string;
  fullName: string;
  username: string;
  accessLevel: AccessLevel;
  isActive: boolean;
}): Promise<UserPublic | null> {
  const client = getSupabaseAdminClient();
  if (!client) {
    throw new Error("Supabase is not configured");
  }

  const { data, error } = await client
    .from("app_users")
    .update({
      full_name: input.fullName,
      username: input.username,
      access_level: input.accessLevel,
      is_active: input.isActive,
    })
    .eq("id", input.userId)
    .select("id, full_name, username, access_level, is_active, created_at")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return toPublicUser(data as UserRow);
}

export async function deleteUser(userId: string): Promise<boolean> {
  const client = getSupabaseAdminClient();
  if (!client) {
    throw new Error("Supabase is not configured");
  }

  const { error, count } = await client
    .from("app_users")
    .delete({ count: "exact" })
    .eq("id", userId);

  if (error) {
    throw error;
  }

  return (count ?? 0) > 0;
}
