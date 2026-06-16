import { describe, expect, test, vi } from "vitest";

const mockFindMany = vi.fn();
const mockCount = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    material: {
      findMany: mockFindMany,
      count: mockCount,
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  requirePermission: vi.fn(),
}));

let getMaterials: (...args: any[]) => any;
beforeAll(async () => {
  const mod = await import("@/actions/materials");
  getMaterials = mod.getMaterials;
});

describe("getMaterials always returns { data, total }", () => {
  test("no pagination params → still returns { data, total }", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const result = await getMaterials();

    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.data)).toBe(true);
  });

  test("with page/limit → applies skip and take", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    await getMaterials({ page: 2, limit: 10 });

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 })
    );
  });

  test("with page=1 → skip=0", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    await getMaterials({ page: 1, limit: 20 });

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 20 })
    );
  });

  test("total reflects full count regardless of pagination", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(45);

    const result = await getMaterials({ page: 2, limit: 10 });

    expect(result.total).toBe(45);
  });
});