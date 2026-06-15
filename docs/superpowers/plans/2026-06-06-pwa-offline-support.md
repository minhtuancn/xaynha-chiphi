# PWA/Offline Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add PWA manifest + service worker caching + offline banner + form queue for construction app.

**Architecture:** Vanilla service worker for caching, React context for offline detection, localStorage-based queue for form submissions with auto-replay on reconnect.

**Tech Stack:** Next.js 16 / Workbox-inspired manual SW / localStorage

---

### Task 1: PWA Manifest + Icons

**Files:**
- Create: `public/manifest.json`
- Create: `public/icons/icon-192.html`
- Create: `public/icons/icon-512.html`

- [ ] **Step 1: Create public/manifest.json**

```json
{
  "name": "Xây Nhà - Quản lý xây dựng",
  "short_name": "Xây Nhà",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#475569",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 2: Generate icon placeholders**

Run:
```bash
cd public/icons
# Create a simple SVG for each size
cat > icon-192.svg << 'SVGEOF'
<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
  <rect width="192" height="192" rx="32" fill="#475569"/>
  <text x="96" y="112" text-anchor="middle" font-family="sans-serif" font-size="80" font-weight="bold" fill="white">XN</text>
</svg>
SVGEOF
cat > icon-512.svg << 'SVGEOF'
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="64" fill="#475569"/>
  <text x="256" y="300" text-anchor="middle" font-family="sans-serif" font-size="200" font-weight="bold" fill="white">XN</text>
</svg>
SVGEOF
```

The manifest references `.png` — convert SVGs in-browser or use a simple converter. For placeholder, we'll reference the SVG directly (browsers accept `<link>` with SVG but manifest icons need PNG). Best approach: use a base64 SVG data URI or just reference `.svg` files — Chrome accepts SVG in manifest.

**Update manifest icons to:**
```json
"icons": [
  { "src": "/icons/icon-192.svg", "sizes": "192x192", "type": "image/svg+xml" },
  { "src": "/icons/icon-512.svg", "sizes": "512x512", "type": "image/svg+xml" }
]
```

- [ ] **Step 3: Commit**

```bash
git add public/manifest.json public/icons/
git commit -m "feat: add PWA manifest and icons"
```

---

### Task 2: Service Worker (Caching)

**Files:**
- Create: `public/sw.js`

- [ ] **Step 1: Create public/sw.js with cache strategies**

```javascript
const CACHE_NAME = "xaynha-v1";

// Install: pre-cache shell
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
});

// Fetch: stale-while-revalidate for assets, network-first for pages
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Skip API calls and data endpoints
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/") ||
    request.method !== "GET"
  )
    return;

  // _next/static → StaleWhileRevalidate
  if (url.pathname.startsWith("/_next/static")) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => {
          const fetchPromise = fetch(request).then((response) => {
            cache.put(request, response.clone());
            return response;
          });
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // Other assets (fonts, images, favicon) → CacheFirst with network fallback
  if (
    url.pathname.match(/\.(woff2?|ttf|otf|eot|png|jpg|jpeg|gif|svg|ico)$/)
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            cache.put(request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // Page routes → NetworkFirst
  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      })
      .catch(() => caches.match(request))
  );
});
```

- [ ] **Step 2: Commit**

```bash
git add public/sw.js
git commit -m "feat: add service worker with cache strategies"
```

---

### Task 3: Offline Provider + Banner Components

**Files:**
- Create: `src/components/offline-provider.tsx`
- Create: `src/components/offline-banner.tsx`

- [ ] **Step 1: Create OfflineProvider context**

```tsx
"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type OfflineContext = {
  isOffline: boolean;
  pendingCount: number;
};

const OfflineContext = createContext<OfflineContext>({
  isOffline: false,
  pendingCount: 0,
});

export function useOffline() {
  return useContext(OfflineContext);
}

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    function handleOnline() {
      setIsOffline(false);
      // Trigger queue drain — queue module will emit events
      window.dispatchEvent(new Event("xaynha:online"));
    }
    function handleOffline() {
      setIsOffline(true);
    }

    setIsOffline(!navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Listen for queue changes
    function handleQueueUpdate() {
      try {
        const raw = localStorage.getItem("xaynha_offline_queue");
        const queue = raw ? JSON.parse(raw) : [];
        setPendingCount(queue.length);
      } catch {
        setPendingCount(0);
      }
    }
    window.addEventListener("xaynha:queue-update", handleQueueUpdate);
    handleQueueUpdate();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("xaynha:queue-update", handleQueueUpdate);
    };
  }, []);

  return (
    <OfflineContext.Provider value={{ isOffline, pendingCount }}>
      {children}
    </OfflineContext.Provider>
  );
}
```

- [ ] **Step 2: Create OfflineBanner component**

```tsx
"use client";

import { useState } from "react";
import { useOffline } from "./offline-provider";
import { WifiOff, X } from "lucide-react";

export function OfflineBanner() {
  const { isOffline, pendingCount } = useOffline();
  const [dismissed, setDismissed] = useState(false);

  if (!isOffline) return null;
  if (dismissed) return null;

  return (
    <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4" />
        <span>
          Bạn đang ngoại tuyến.
          {pendingCount > 0
            ? ` ${pendingCount} mục đang chờ đồng bộ.`
            : " Dữ liệu sẽ được đồng bộ khi có kết nối."}
        </span>
      </div>
      <button onClick={() => setDismissed(true)} className="p-1 hover:bg-amber-600 rounded">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/offline-provider.tsx src/components/offline-banner.tsx
git commit -m "feat: add offline provider and banner"
```

---

### Task 4: Offline Queue Module

**Files:**
- Create: `src/lib/offline-queue.ts`
- Modify: `src/actions/daily-logs.ts` (export wrapped actions)
- Modify: `src/actions/workers.ts` (export wrapped actions)

- [ ] **Step 1: Create offline-queue.ts with action registry + drain logic**

```typescript
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
    // extract photos from queue payload (photos skipped offline)
    const { _photos, ...rest } = payload;
    return createDailyLog(rest as any);
  },
  bulkAttendance: async (payload: Record<string, unknown>) => {
    return bulkAttendance(
      new Date(payload.date as string),
      payload.records as any[]
    );
  },
};

const STORAGE_KEY = "xaynha_offline_queue";

function getQueue(): QueueItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
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
    } catch {
      failed++;
      // Stop on first failure — retry next time
      break;
    }
  }

  const remaining = getQueue().slice(success + failed);
  saveQueue(remaining);
  return { success, failed };
}

// Auto-drain on reconnect
if (typeof window !== "undefined") {
  window.addEventListener("xaynha:online", () => {
    drainQueue();
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/offline-queue.ts
git commit -m "feat: add offline queue with action registry and auto-drain"
```

---

### Task 5: Register SW in Layout + Wrap Provider

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update metadata and layout**

Add manifest to metadata, add OfflineProvider + OfflineBanner to layout, register service worker via inline script.

**Update metadata:**

```tsx
export const metadata: Metadata = {
  title: "Xay Nha - Quan ly xay dung",
  description: "He thong quan ly xay dung nha o ca nhan",
  icons: { icon: "/favicon.svg" },
  manifest: "/manifest.json",
};
```

- [ ] **Step 2: Import OfflineProvider and OfflineBanner, register SW**

```tsx
// Add to existing imports:
import { OfflineProvider } from "@/components/offline-provider";
import { OfflineBanner } from "@/components/offline-banner";

// Add after ThemeProvider opening, inside body:
<ThemeProvider attribute="class" defaultTheme="light" enableSystem>
  <OfflineProvider>
    <OfflineBanner />
    <Providers>{children}</Providers>
    <Toaster />
  </OfflineProvider>
</ThemeProvider>

// Register service worker:
// Add useEffect in RootLayout or in a separate script
```

**Full updated file:**
```tsx
import type { Metadata } from "next";
import { Poppins, Open_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { OfflineProvider } from "@/components/offline-provider";
import { OfflineBanner } from "@/components/offline-banner";

const poppins = Poppins({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
});

const openSans = Open_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Xay Nha - Quan ly xay dung",
  description: "He thong quan ly xay dung nha o ca nhan",
  icons: { icon: "/favicon.svg" },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </head>
      <body className={`${poppins.variable} ${openSans.variable} font-body antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <OfflineProvider>
            <OfflineBanner />
            <Providers>{children}</Providers>
            <Toaster />
          </OfflineProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: register service worker and add offline provider to root layout"
```

---

### Task 6: Wrap Daily Log + Attendance Forms for Offline

**Files:**
- Read: `src/actions/daily-logs.ts` and `src/actions/workers.ts` — understand createDailyLog, bulkAttendance signatures
- Modify: `src/components/forms/daily-log-form.tsx` — wrap submit handler
- Modify: `src/components/forms/attendance-form.tsx` — wrap submit handler

- [ ] **Step 1: Identify action signatures**

`createDailyLog(data: DailyLogFormData, photos?: File[]): Promise<void>`
`bulkAttendance(date: Date, records: Array<{workerId, status, checkIn?, checkOut?, notes?}>): Promise<void>`

- [ ] **Step 2: Read existing daily log form and attendance form**

```bash
cat src/components/forms/daily-log-form.tsx
```

- [ ] **Step 3: Add offline handling to daily log form**

In the submit handler, catch network errors and enqueue:
```tsx
import { enqueue } from "@/lib/offline-queue";
import { toast } from "sonner"; // or use existing toast mechanism

// In the submit handler:
async function onSubmit(data: DailyLogFormData) {
  try {
    await createDailyLog(data, photos || undefined);
    toast.success("Nhật ký đã được lưu");
    router.push("/daily-logs");
  } catch (err) {
    if (err instanceof TypeError && err.message.includes("fetch")) {
      enqueue("createDailyLog", { ...data, _photos: photos?.map(f => f.name) });
      toast.success("Đã lưu vào hàng đợi ngoại tuyến. Sẽ đồng bộ khi có mạng.");
    } else {
      throw err;
    }
  }
}
```

- [ ] **Step 4: Add offline handling to attendance form**

Same pattern in attendance form:
```tsx
async function onSubmit(records: Array<...>) {
  try {
    await bulkAttendance(date, records);
    toast.success("Chấm công đã được lưu");
  } catch (err) {
    if (err instanceof TypeError && err.message.includes("fetch")) {
      enqueue("bulkAttendance", { date: date.toISOString(), records });
      toast.success("Đã lưu vào hàng đợi ngoại tuyến. Sẽ đồng bộ khi có mạng.");
    } else {
      throw err;
    }
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/forms/daily-log-form.tsx src/components/forms/attendance-form.tsx
git commit -m "feat: add offline queue handling to daily log and attendance forms"
```

---

### Task 7: Sync Status Indicator in Header

**Files:**
- Read: `src/components/layout/header.tsx` or equivalent (find the navbar)
- Modify: Add sync indicator showing pending count

- [ ] **Step 1: Find the header/navbar component**

```bash
ls src/components/layout/
```

- [ ] **Step 2: Add sync indicator after notification area**

```tsx
// Inside the header, near notification bell:
import { useOffline } from "@/components/offline-provider";
import { Upload } from "lucide-react";

function SyncIndicator() {
  const { pendingCount } = useOffline();
  if (pendingCount === 0) return null;
  return (
    <button className="relative p-2 hover:bg-muted rounded-full" title="Đang chờ đồng bộ">
      <Upload className="w-5 h-5" />
      <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
        {pendingCount}
      </span>
    </button>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add <header-file>
git commit -m "feat: add sync pending indicator to header"
```

---

### Verification Steps

- [ ] **Typecheck:** `npx tsc --noEmit` — must pass
- [ ] **Build:** `npm run build` — must succeed
- [ ] **E2E:** `npx playwright test` — all existing tests pass
- [ ] **Manual test:** Open DevTools → Application → Service Workers → check offline → reload → banner appears, form submit queues → uncheck offline → queue drains
