# Nâng cấp toàn diện: xaynha-chiphi

## ✅ Giai đoạn 1: Audit & Update
- [x] Audit phụ thuộc (npm outdated/ncu)
- [x] Chạy lệnh cập nhật (npm update)
- [x] Fix bảo mật (npm audit fix --force) – giảm từ 91 xuống 2 lỗi moderate (do legacy dep)
- [x] Approve install scripts (Prisma, esbuild, sharp, unrs-resolver)
- [x] Prisma generate (v6.19.3)
- [x] Verify build – **Next.js 16.2.7 (Turbopack) compiled successfully**

## 🎨 Giai đoạn 2: UI & UX (shadcn/ui upgrade) — BẮT ĐẦU
- [ ] Upgrade shadcn/ui components lên phiên bản mới nhất
- [ ] Áp dụng Design Tokens (Radius, Accent)
- [ ] Cấu hình Dark/Light Mode với `next-themes`

## 🚀 Giai đoạn 3: Tối ưu hiệu năng
- [ ] Chuyển đổi các component sang Server Components
- [ ] Lazy-load các module nặng (charts, tables)
- [ ] Cấu hình PWA (manifest, service workers)
- [ ] Chuyển page.tsx sang Server Component để giảm bundle client
- [ ] Lazy-load ProgressChart, WeatherWidget, RecentPhotos bằng dynamic import
- [ ] Sử dụng Suspense và React Loadable cho tải dữ liệu không đồng bộ
- [ ] Kiểm tra suspense và loading skeleton hiệu quả, đo bundle size

## 🧪 Giai đoạn 4: Kiểm thử & CI/CD
- [ ] Viết unit tests (Vitest) cho logic tài chính
- [ ] Cấu hình GitHub Actions (build & lint check)

---

**Next step**: Tiến hành **Giai đoạn 2 – UI/UX Upgrade**.  
Mục tiêu: Cập nhật toàn bộ component `shadcn/ui` lên bản v2 mới nhất, đồng bộ design tokens, thêm `next-themes` cho dark mode.

Bạn muốn tôi bắt đầu ngay việc upgrade shadcn/ui components?