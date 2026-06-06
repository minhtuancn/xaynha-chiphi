# PWA/Offline Support — 2026-06-06

## Goal

Construction app loads instantly on mobile even without network, and form submissions (daily logs, attendance) succeed even when offline, syncing automatically when connection returns.

## Scope

**In scope:**
- PWA manifest + icons for "Add to Home Screen"
- Service worker caching JS/CSS/images (StaleWhileRevalidate)
- Offline detection + dismissible banner
- Form queue in localStorage for offline submits, auto-replay on reconnect
- Offline status indicator in UI

**Out of scope:**
- Server-side data sync (local SQLite / sql.js)
- Background sync API (progressive enhancement, not required)

---

## Architecture

### Service Worker

- Registered in `src/app/layout.tsx`
- **Cache strategy:**
  - Static assets (JS/CSS/images): `StaleWhileRevalidate` — serve stale, update in background
  - Page routes (`/`): `NetworkFirst` with in-memory fallback to cached response
- **Cache name:** versioned (`v1.0.0`) so old cache invalidates on deploy
- SW file: `public/sw.js` (vanilla JS, no bundler needed)

### Offline Detection

- `window.addEventListener('online' / 'offline')` in a lightweight context provider
- Provider lives at root so banner is accessible everywhere
- State: `isOffline: boolean` — consumed by `OfflineBanner` component

### Offline Banner

- Rendered at top of app when `isOffline === true`
- Dismissible (X button sets a `dismissed` state, but re-appears on navigation)
- Message: "Bạn đang ngoại tuyến. Dữ liệu sẽ được đồng bộ khi có kết nối."

### Form Queue (Offline Writes)

**Queue structure** (localStorage key: `xaynha_offline_queue`):
```json
[
  { "id": "uuid", "action": "createDailyLog", "payload": {...}, "timestamp": 1234567890 },
  { "id": "uuid", "action": "bulkAttendance", "payload": {...}, "timestamp": 1234567891 }
]
```

**Flow:**
1. Form calls server action
2. If `fetch` throws `TypeError: Failed to fetch` (offline), catch it
3. Push `{ id, action, payload, timestamp }` to queue → save to localStorage
4. Show toast: "Đang ngoại tuyến. Dữ liệu đã được lưu và sẽ gửi khi có mạng."
5. On `window 'online'` event: drain queue in FIFO order
6. Each item: re-call action. On success: `shift()`. On failure: stop, retry next `online` event
7. Banner shows pending count: "2 mục đang chờ đồng bộ"

### Form Targets

Queue these actions (the ones workers use on-site):
- `createDailyLog` — daily log with photo upload
- `bulkAttendance` — attendance marking

### PWA Manifest

`public/manifest.json`:
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

Icons: generate from an inline SVG at 192x192 and 512x512 (placeholder colored squares with text "XN").

---

## File Map

| File | Action |
|------|--------|
| `public/manifest.json` | Create |
| `public/sw.js` | Create |
| `public/icons/icon-192.png` | Create (generated SVG) |
| `public/icons/icon-512.png` | Create (generated SVG) |
| `src/app/layout.tsx` | Modify — register SW, add manifest link |
| `src/components/offline-banner.tsx` | Create |
| `src/components/offline-provider.tsx` | Create |
| `src/lib/offline-queue.ts` | Create |

---

## Implementation Notes

- SW registration: `if ('serviceWorker' in navigator)` — graceful degradation
- Queue actions: server actions are async fns; offline queue wraps the serialized payload, not the fn itself
- Photo uploads in offline mode: skip photo upload, submit log without photos (attach note: "Ảnh sẽ được bổ sung khi có mạng")
- Use `crypto.randomUUID()` for queue item IDs
- Pending sync count shown in navbar/header next to notification bell

---

## Verification

- `npx tsc --noEmit` — passes
- Build succeeds: `npm run build`
- Manual: DevTools → Application → Service Workers → offline checkbox → reload → banner appears, form submit queues, reconnect → queue drains
- Lighthouse PWA score ≥ 80