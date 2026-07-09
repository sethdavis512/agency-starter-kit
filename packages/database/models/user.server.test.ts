import { describe, it, expect, vi } from "vitest";

vi.mock("../src", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "../src";
import { getUserById } from "./user.server";

describe("getUserById", () => {
  it("queries by id and selects only the expected, non-sensitive fields", async () => {
    const mockUser = {
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
      role: "user",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(
      mockUser as Awaited<ReturnType<typeof getUserById>>,
    );

    const result = await getUserById("user-1");

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    expect(result).toEqual(mockUser);
  });

  it("returns null when no user matches the id", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(
      null as Awaited<ReturnType<typeof getUserById>>,
    );

    const result = await getUserById("missing-id");

    expect(result).toBeNull();
  });
});
