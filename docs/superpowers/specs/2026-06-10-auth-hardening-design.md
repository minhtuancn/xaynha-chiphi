# Auth Hardening Design

## Mục tiêu

Chuẩn hóa hệ thống xác thực và phân quyền theo hướng an toàn, đồng nhất, và đủ để khôi phục build hiện tại. Phạm vi thay đổi chỉ tập trung vào auth:

- dùng `bcrypt` + `passwordHash`, không giữ đăng nhập plaintext
- giữ mô hình phân quyền chi tiết theo module/action
- hợp nhất về một nguồn cấu hình `NextAuth`
- khôi phục các helper `requireUser`, `requireAdmin`, `requirePermission`, `getCurrentUser`

## Hiện trạng

Repo đang có hai luồng auth mâu thuẫn:

- `src/app/api/auth/[...nextauth]/auth.ts` dùng `NextAuth` theo hướng mới hơn, có `bcrypt`, `passwordHash`, `isActive`
- `src/lib/auth.ts` tự cấu hình auth lần nữa, dùng `getServerSession` sai API, dùng `password` plaintext, hardcode secret, và không export `requirePermission`

Hệ quả:

- `next build` hỏng do import/export auth sai
- hàng loạt server actions gọi `requirePermission(...)` nhưng không có implementation hợp lệ
- code auth và schema Prisma đang lệch nhau

## Quyết định thiết kế

### 1. Một nguồn sự thật cho auth

`src/app/api/auth/[...nextauth]/auth.ts` sẽ là nơi duy nhất cấu hình `NextAuth`.

`src/app/api/auth/[...nextauth]/route.ts` chỉ re-export handler từ file trên.

`src/lib/auth.ts` không còn tự cấu hình `NextAuth`. File này chỉ giữ server helpers:

- `getCurrentUser()`
- `requireUser()`
- `requireAdmin()`
- `requirePermission(module, action)`

### 2. Chuẩn dữ liệu user

Model `User` sẽ được mở rộng để phản ánh auth an toàn và permission chi tiết:

- `name`
- `passwordHash`
- `role`
- `permissions`
- `isActive`
- `lastLoginAt`
- `deletedAt`
- timestamps phù hợp

`permissions` được lưu dạng JSON string để tái sử dụng trực tiếp `parsePermissions()` và `hasPermission()` hiện có. `ADMIN` bypass toàn bộ kiểm tra permission.

### 3. Luồng xác thực

`authorize(credentials)` thực hiện:

1. kiểm tra `email/password`
2. tìm `User` theo email, đồng thời loại user bị soft delete
3. chặn user `isActive = false`
4. `bcrypt.compare(password, user.passwordHash)`
5. cập nhật `lastLoginAt`
6. trả về session payload tối thiểu: `id`, `email`, `name`, `role`

Không đọc hoặc ghi `password` plaintext ở bất kỳ đâu.

### 4. Luồng phân quyền

`requirePermission(module, action)` thực hiện:

1. lấy session hiện tại
2. nạp user từ DB
3. chặn nếu không tồn tại, bị khóa, hoặc bị soft delete
4. nếu `role === "ADMIN"` thì cho qua
5. parse `permissions` và kiểm tra bằng `hasPermission()`
6. ném lỗi `Forbidden` nếu thiếu quyền

API của helper giữ nguyên để không phải đổi chữ ký ở các server actions hiện có.

### 5. Seed và dữ liệu mẫu

Seed sẽ tạo:

- 1 admin có full quyền
- 1 user mẫu có quyền giới hạn theo module

Mật khẩu được hash bằng `bcrypt`. Đây là breaking change có chủ ý: dữ liệu plaintext cũ không còn được hỗ trợ.

## Tác động mã nguồn

Các nhóm file sẽ bị chạm:

- auth config: `src/app/api/auth/[...nextauth]/auth.ts`, `route.ts`
- auth helpers: `src/lib/auth.ts`
- schema + migration + seed: `prisma/schema.prisma`, `prisma/migrations/*`, `prisma/seed.ts`
- type augmentation session nếu cần: `src/types/next-auth.d.ts`
- test auth và permission

Không mở rộng sang refactor business modules ngoài việc làm chúng build lại với auth mới.

## Kiểm thử

Điều kiện hoàn thành của pha này:

- `npm run build` không còn fail vì auth exports hoặc helper auth
- `npm run lint` parse được TypeScript auth path liên quan nếu cấu hình lint được chạm trong pha này
- `npx vitest run` có test cho:
  - `parsePermissions()` / `hasPermission()`
  - login đúng/sai
  - user inactive
  - `ADMIN` bypass permission

E2E không phải mục tiêu chính của pha auth hardening, nhưng login flow cần còn chạy được sau khi build pass.

## Rủi ro và giới hạn

- Schema Prisma hiện đang lệch mạnh so với codebase. Pha auth sẽ chỉ sửa phần schema cần thiết để auth đúng; các drift ngoài auth có thể vẫn còn sau đó.
- Nếu còn import client/server không đúng ở các module khác, build có thể tiếp tục lộ thêm lỗi sau khi gỡ nút auth đầu tiên.
- Lưu `permissions` dạng JSON string là lựa chọn thực dụng để ổn định nhanh; nếu cần audit/phân tích quyền sâu hơn, có thể tách bảng riêng ở pha sau.
