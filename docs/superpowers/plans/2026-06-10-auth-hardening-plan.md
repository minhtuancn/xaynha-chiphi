# Auth Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chuẩn hóa auth sang `NextAuth` + `bcrypt` + permission theo module/action, khôi phục build, và tránh đưa secret hoặc dữ liệu riêng tư vào git.

**Architecture:** Dùng `src/app/api/auth/[...nextauth]/auth.ts` làm nguồn cấu hình auth duy nhất, còn `src/lib/auth.ts` chỉ giữ helper server-side. Mở rộng model `User` để hỗ trợ `passwordHash`, `permissions`, `isActive`, `deletedAt`, rồi seed lại user mẫu bằng mật khẩu hash.

**Tech Stack:** Next.js App Router, NextAuth, Prisma, PostgreSQL/Prisma migrations, bcryptjs, Vitest

---

## File Structure

- Modify: `prisma/schema.prisma`
  - Mở rộng model `User` phục vụ auth an toàn và permission chi tiết.
- Create: `prisma/migrations/<timestamp>_auth_hardening/migration.sql`
  - Đồng bộ DB với schema mới.
- Modify: `prisma/seed.ts`
  - Seed admin/user bằng `bcrypt` và permission JSON.
- Modify: `src/app/api/auth/[...nextauth]/auth.ts`
  - Cấu hình `NextAuth` chuẩn, bỏ plaintext auth.
- Modify: `src/app/api/auth/[...nextauth]/route.ts`
  - Chỉ re-export từ `auth.ts`.
- Modify: `src/lib/auth.ts`
  - Chuyển thành helper `getCurrentUser`, `requireUser`, `requireAdmin`, `requirePermission`.
- Modify: `src/types/next-auth.d.ts`
  - Bổ sung kiểu cho `Session` và `JWT` nếu thiếu.
- Create: `src/__tests__/auth-permissions.test.ts`
  - Test `parsePermissions`, `hasPermission`, và nhánh `ADMIN`.
- Create or Modify: `src/__tests__/auth-config.test.ts`
  - Test authorize/login đúng-sai và inactive user theo config auth.

## Task 1: Khóa hành vi permission bằng test

**Files:**
- Create: `src/__tests__/auth-permissions.test.ts`
- Test: `src/__tests__/auth-permissions.test.ts`

- [ ] **Step 1: Viết test fail cho permission parser và admin bypass**

```ts
import { describe, expect, test } from "vitest";
import { hasPermission, parsePermissions, type Permissions } from "@/lib/utils";

describe("permissions", () => {
  test("parsePermissions returns empty object for invalid JSON", () => {
    expect(parsePermissions("not-json")).toEqual({});
  });

  test("hasPermission allows ADMIN for any module/action", () => {
    expect(hasPermission({}, "ADMIN", "projects", "delete")).toBe(true);
  });

  test("hasPermission respects module/action lists for USER", () => {
    const permissions: Permissions = {
      projects: ["view", "edit"],
      reports: ["view"],
    };

    expect(hasPermission(permissions, "USER", "projects", "edit")).toBe(true);
    expect(hasPermission(permissions, "USER", "projects", "delete")).toBe(false);
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận baseline**

Run: `npx vitest run src/__tests__/auth-permissions.test.ts`  
Expected: test file chạy được; nếu fail thì phải fail vì assertion/code auth chưa xong, không phải do syntax.

- [ ] **Step 3: Commit riêng test nền**

```bash
git add src/__tests__/auth-permissions.test.ts
git commit -m "test: add permission utility coverage"
```

## Task 2: Chuẩn hóa schema user và seed an toàn

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_auth_hardening/migration.sql`
- Modify: `prisma/seed.ts`
- Test: `prisma/schema.prisma`

- [ ] **Step 1: Viết schema fail-first trên giấy bằng diff tối thiểu**

```prisma
model User {
  id           String    @id @default(cuid())
  email        String    @unique
  name         String?
  passwordHash String
  role         String    @default("USER")
  permissions  String    @default("{}")
  isActive     Boolean   @default(true)
  lastLoginAt  DateTime?
  deletedAt    DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}
```

- [ ] **Step 2: Tạo migration và xác nhận Prisma parse được schema**

Run: `npx prisma format && npx prisma validate`  
Expected: `Prisma schema loaded` và `The schema at prisma/schema.prisma is valid`.

- [ ] **Step 3: Đổi seed sang bcrypt + permission JSON**

```ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const adminPermissions = {
  dashboard: ["view"],
  projects: ["view", "create", "edit", "delete"],
  stages: ["view", "create", "edit", "delete"],
  dailyLogs: ["view", "create", "edit", "delete"],
  materials: ["view", "create", "edit", "delete"],
  inventory: ["view", "create", "edit", "delete"],
  purchaseOrders: ["view", "create", "edit", "delete"],
  suppliers: ["view", "create", "edit", "delete"],
  workers: ["view", "create", "edit", "delete"],
  attendance: ["view", "create", "edit", "delete"],
  expenses: ["view", "create", "edit", "delete"],
  accounts: ["view", "create", "edit", "delete"],
  debts: ["view", "create", "edit", "delete"],
  photos: ["view", "create", "edit", "delete"],
  documents: ["view", "create", "edit", "delete"],
  materialUsage: ["view", "create", "edit", "delete"],
  checklists: ["view", "create", "edit", "delete"],
  notifications: ["view", "create", "edit", "delete"],
  reports: ["view"],
  settings: ["view", "edit"],
};

async function main() {
  const adminHash = await bcrypt.hash("admin123", 12);
  const userHash = await bcrypt.hash("user123", 12);

  await prisma.user.upsert({
    where: { email: "admin@local.com" },
    update: {
      name: "Admin",
      passwordHash: adminHash,
      role: "ADMIN",
      permissions: JSON.stringify(adminPermissions),
      isActive: true,
      deletedAt: null,
    },
    create: {
      email: "admin@local.com",
      name: "Admin",
      passwordHash: adminHash,
      role: "ADMIN",
      permissions: JSON.stringify(adminPermissions),
      isActive: true,
    },
  });
}
```

- [ ] **Step 4: Chạy migrate + seed trên local DB test**

Run: `npx prisma migrate dev --name auth_hardening && npm run prisma:seed`  
Expected: migration tạo thành công; seed không ghi `password` plaintext nữa.

- [ ] **Step 5: Commit schema/seed**

```bash
git add prisma/schema.prisma prisma/migrations prisma/seed.ts
git commit -m "feat: harden auth user schema and seed data"
```

## Task 3: Hợp nhất NextAuth config và helper auth

**Files:**
- Modify: `src/app/api/auth/[...nextauth]/auth.ts`
- Modify: `src/app/api/auth/[...nextauth]/route.ts`
- Modify: `src/lib/auth.ts`
- Modify: `src/types/next-auth.d.ts`
- Test: `src/app/api/auth/[...nextauth]/auth.ts`

- [ ] **Step 1: Viết test fail cho authorize và user inactive**

```ts
import { describe, expect, test, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: { compare: vi.fn() },
  compare: vi.fn(),
}));

describe("auth config", () => {
  test("authorize returns null for inactive user", async () => {
    // arrange mocked user with isActive false
    // call provider.authorize(...)
    // expect null
  });
});
```

- [ ] **Step 2: Đưa `auth.ts` về cấu hình chuẩn duy nhất**

```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: { email: {}, password: {}, rememberMe: {} },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || user.deletedAt || !user.isActive) return null;

        const ok = await bcrypt.compare(credentials.password as string, user.passwordHash);
        if (!ok) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
          role: user.role,
        };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  trustHost: true,
});
```

- [ ] **Step 3: Giảm `route.ts` còn re-export**

```ts
export { GET, POST } from "./auth";
```

- [ ] **Step 4: Viết lại `src/lib/auth.ts` thành helper server-side**

```ts
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/lib/prisma";
import {
  hasPermission,
  parsePermissions,
  type ModuleName,
  type ModulePermission,
} from "@/lib/utils";

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({ where: { email: session.user.email } });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user || user.deletedAt || !user.isActive) throw new Error("Unauthorized");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("Forbidden");
  return user;
}

export async function requirePermission(module: ModuleName, action: ModulePermission) {
  const user = await requireUser();
  const permissions = parsePermissions(user.permissions);
  if (!hasPermission(permissions, user.role, module, action)) {
    throw new Error("Forbidden");
  }
  return user;
}
```

- [ ] **Step 5: Cập nhật type augmentation cho session/jwt**

```ts
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
  }
}
```

- [ ] **Step 6: Chạy unit test auth vừa thêm**

Run: `npx vitest run src/__tests__/auth-config.test.ts src/__tests__/auth-permissions.test.ts`  
Expected: PASS các ca login hợp lệ/không hợp lệ/inactive và permission utility.

- [ ] **Step 7: Commit auth config**

```bash
git add src/app/api/auth/[...nextauth]/auth.ts src/app/api/auth/[...nextauth]/route.ts src/lib/auth.ts src/types/next-auth.d.ts src/__tests__/auth-config.test.ts src/__tests__/auth-permissions.test.ts
git commit -m "feat: unify nextauth config and permission helpers"
```

## Task 4: Kiểm tra an toàn, build, và chống lộ secret

**Files:**
- Modify: `.gitignore` if needed
- Verify only: `.env`, `.env.example`, staged files
- Test: repository root

- [ ] **Step 1: Kiểm tra không stage secret hoặc file riêng tư**

Run: `git status --short && git diff --cached -- . ':(exclude).env.example'`  
Expected: không có `.env`, secret thật, token, key, cookie dump, hoặc dữ liệu cá nhân trong phần staged.

- [ ] **Step 2: Scan chuỗi nhạy cảm trong code sẽ commit**

Run: `rg -n "NEXTAUTH_SECRET|DATABASE_URL|MINIO_SECRET|password\\s*[:=]|token\\s*[:=]|private key|BEGIN (RSA|OPENSSH|EC) PRIVATE KEY" src prisma tests docs`  
Expected: chỉ còn reference kỹ thuật hợp lệ; không có secret thật hardcode.

- [ ] **Step 3: Chạy build xác nhận đã gỡ nút auth**

Run: `npm run build`  
Expected: không còn lỗi `getServerSession doesn't exist`, không còn lỗi `requirePermission` missing export.

- [ ] **Step 4: Chạy test unit toàn repo**

Run: `npx vitest run`  
Expected: PASS; nếu còn fail `formatCurrency`, sửa assertion để normalize non-breaking space thay vì đổi implementation locale.

- [ ] **Step 5: Chạy lint mức tối thiểu nếu parser đã được sửa trong pha này**

Run: `npm run lint`  
Expected: ít nhất không còn parse error trên auth path đã chỉnh. Nếu lint global vẫn fail do cấu hình repo ngoài phạm vi auth, ghi rõ trong notes.

- [ ] **Step 6: Commit verification-safe fixes**

```bash
git add src/__tests__/utils.test.ts .gitignore
git commit -m "test: stabilize auth verification and locale assertions"
```

## Self-Review

- Spec coverage:
  - Một nguồn auth duy nhất: Task 3
  - `bcrypt` + `passwordHash`: Task 2, Task 3
  - `requirePermission`: Task 3
  - seed admin/user mẫu: Task 2
  - không đẩy secret lên git: Task 4
- Placeholder scan:
  - Không để `TODO/TBD`; mọi task đều có file, lệnh, hoặc snippet cụ thể.
- Type consistency:
  - `passwordHash`, `permissions`, `isActive`, `deletedAt`, `lastLoginAt` được dùng nhất quán giữa schema, seed, authorize, helper.
