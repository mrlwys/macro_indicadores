import { beforeEach, describe, expect, it, vi } from "vitest";

const getUserByUsernameMock = vi.fn();
const compareMock = vi.fn();

vi.mock("./usersService.js", () => ({
  getUserByUsername: getUserByUsernameMock,
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: compareMock,
    hash: vi.fn(),
  },
}));

describe("authService", () => {
  beforeEach(() => {
    getUserByUsernameMock.mockReset();
    compareMock.mockReset();
  });

  it("returns token for valid active credentials", async () => {
    const { loginWithPassword } = await import("./authService.js");

    getUserByUsernameMock.mockResolvedValue({
      id: "6a945df1-7ff4-4d6c-8ef0-4a7fc2817f6b",
      username: "admin",
      password_hash: "hashed-password",
      access_level: "admin",
      is_active: true,
      created_at: new Date().toISOString(),
    });
    compareMock.mockResolvedValue(true);

    const result = await loginWithPassword({ username: "admin", password: "admin" });

    expect(result.user).toEqual({
      id: "6a945df1-7ff4-4d6c-8ef0-4a7fc2817f6b",
      username: "admin",
      accessLevel: "admin",
    });
    expect(result.token).toBeTypeOf("string");
  });

  it("rejects inactive users", async () => {
    const { loginWithPassword } = await import("./authService.js");

    getUserByUsernameMock.mockResolvedValue({
      id: "6a945df1-7ff4-4d6c-8ef0-4a7fc2817f6b",
      username: "admin",
      password_hash: "hashed-password",
      access_level: "admin",
      is_active: false,
      created_at: new Date().toISOString(),
    });

    await expect(loginWithPassword({ username: "admin", password: "admin" })).rejects.toThrow(
      "INVALID_CREDENTIALS",
    );
  });

  it("rejects invalid passwords", async () => {
    const { loginWithPassword } = await import("./authService.js");

    getUserByUsernameMock.mockResolvedValue({
      id: "6a945df1-7ff4-4d6c-8ef0-4a7fc2817f6b",
      username: "admin",
      password_hash: "hashed-password",
      access_level: "admin",
      is_active: true,
      created_at: new Date().toISOString(),
    });
    compareMock.mockResolvedValue(false);

    await expect(loginWithPassword({ username: "admin", password: "wrong" })).rejects.toThrow(
      "INVALID_CREDENTIALS",
    );
  });
});
