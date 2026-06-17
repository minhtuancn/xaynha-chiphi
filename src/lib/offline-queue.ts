import { createDailyLog } from "@/actions/daily-logs";
import { bulkAttendance } from "@/actions/workers";

type QueueItem = {
  id: string;
  action: keyof typeof actionRegistry;
  payload: Record<string, unknown>;
  timestamp: number;
};

const actionRegistry = {
  createDailyLog: async (payload: Record<string, unknown>) => {
    const { _photos, ...rest } = payload;
    return createDailyLog(rest as any);
  },
  bulkAttendance: async (payload: Record<string, unknown>) => {
    return bulkAttendance(
      new Date(payload.date as string),
      payload.records as any[],
    );
  },
};

const STORAGE_KEY = "xaynha_offline_queue";

function getQueue(): QueueItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err: unknown) {
    console.error("Failed to parse offline queue:", err);
    return [];
  }
}

function saveQueue(queue: QueueItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new Event("xaynha:queue-update"));
}

export function enqueue(action: keyof typeof actionRegistry, payload: Record<string, unknown>) {
  const queue = getQueue();
  queue.push({
    id: crypto.randomUUID(),
    action,
    payload,
    timestamp: Date.now(),
  });
  saveQueue(queue);
}

export function getPendingCount(): number {
  return getQueue().length;
}

export async function drainQueue(): Promise<{ success: number; failed: number }> {
  const queue = getQueue();
  let success = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      const fn = actionRegistry[item.action];
      if (!fn) throw new Error(`Unknown action: ${item.action}`);
      await fn(item.payload);
      success++;
    } catch (err: unknown) {
      console.error("Failed to process queued item:", err);
      failed++;
    }
  }

  const remaining = getQueue().slice(success + failed);
  saveQueue(remaining);
  return { success, failed };
}

if (typeof window !== "undefined") {
  window.addEventListener("xaynha:online", () => {
    drainQueue();
  });
}
