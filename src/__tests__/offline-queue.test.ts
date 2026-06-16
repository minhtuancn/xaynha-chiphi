import { describe, expect, test, beforeEach, afterEach, vi } from "vitest";

// ----------------------------------------------------------------
// Mock action dependencies before importing the module
// ----------------------------------------------------------------
vi.mock("@/actions/daily-logs", () => ({ createDailyLog: vi.fn() }));
vi.mock("@/actions/workers", () => ({ bulkAttendance: vi.fn() }));

import { enqueue, getPendingCount } from "@/lib/offline-queue";

// ----------------------------------------------------------------
// Mock localStorage
// ----------------------------------------------------------------
let store: Record<string, string> = {};

const localStorageMock: Storage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => {
    store[key] = value;
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    store = {};
  },
  get length() {
    return Object.keys(store).length;
  },
  key: (_i: number) => null!,
};

Object.defineProperty(window, "localStorage", { value: localStorageMock });

beforeEach(() => {
  store = {};
});

// ----------------------------------------------------------------
// Tests
// ----------------------------------------------------------------
describe("enqueue", () => {
  test("adds item to localStorage queue", () => {
    enqueue("createDailyLog", { projectId: "p1", workerId: "w1" });
    const raw = store["xaynha_offline_queue"];
    expect(raw).toBeDefined();
    const queue = JSON.parse(raw);
    expect(queue).toHaveLength(1);
    expect(queue[0].action).toBe("createDailyLog");
    expect(queue[0].payload).toEqual({ projectId: "p1", workerId: "w1" });
  });

  test("assigns a valid UUID id and timestamp", () => {
    enqueue("bulkAttendance", { date: "2026-06-16", records: [] });
    const queue = JSON.parse(store["xaynha_offline_queue"]);
    expect(queue[0].id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    expect(typeof queue[0].timestamp).toBe("number");
    expect(queue[0].timestamp).toBeGreaterThan(0);
  });

  test("appends to existing queue items", () => {
    store["xaynha_offline_queue"] = JSON.stringify([
      { id: "existing", action: "createDailyLog", payload: {}, timestamp: 1 },
    ]);
    enqueue("bulkAttendance", { date: "2026-06-16", records: [] });
    const queue = JSON.parse(store["xaynha_offline_queue"]);
    expect(queue).toHaveLength(2);
    expect(queue[0].id).toBe("existing");
    expect(queue[1].action).toBe("bulkAttendance");
  });
});

describe("getPendingCount", () => {
  test("returns 0 when queue is empty", () => {
    expect(getPendingCount()).toBe(0);
  });

  test("returns count of queued items", () => {
    store["xaynha_offline_queue"] = JSON.stringify([
      { id: "a", action: "createDailyLog", payload: {}, timestamp: 1 },
      { id: "b", action: "bulkAttendance", payload: {}, timestamp: 2 },
      { id: "c", action: "createDailyLog", payload: {}, timestamp: 3 },
    ]);
    expect(getPendingCount()).toBe(3);
  });

  test("returns 0 on corrupted JSON", () => {
    store["xaynha_offline_queue"] = "not valid json{{";
    expect(getPendingCount()).toBe(0);
  });
});
