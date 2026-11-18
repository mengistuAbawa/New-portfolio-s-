import { afterEach, describe, expect, it, vi } from "vitest";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    viewCounter: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({ default: mockPrisma }));

import { GET, POST } from "./route";

afterEach(() => {
  vi.clearAllMocks();
});

describe("portfolio view counter API", () => {
  it("returns the stored view total", async () => {
    mockPrisma.viewCounter.findUnique.mockResolvedValue({ count: 12 });

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ views: 12 });
  });

  it("atomically increments and returns the view total", async () => {
    mockPrisma.viewCounter.upsert.mockResolvedValue({ count: 13 });

    const response = await POST();

    expect(mockPrisma.viewCounter.upsert).toHaveBeenCalledWith({
      where: { id: "portfolio" },
      create: { id: "portfolio", count: 1 },
      update: { count: { increment: 1 } },
      select: { count: true },
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ views: 13 });
  });
});
