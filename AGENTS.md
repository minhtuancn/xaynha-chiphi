# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js App Router application written in TypeScript. Routes live in `src/app/`, with dashboard screens under `src/app/(dashboard)/`. Server mutations are organized by domain in `src/actions/`, reusable UI in `src/components/`, and shadcn primitives in `src/components/ui/`. Shared utilities are in `src/lib/`, Zod schemas in `src/schemas/`, hooks in `src/hooks/`, Prisma files in `prisma/`, assets in `public/`, unit tests in `src/__tests__/`, and Playwright tests in `tests/`.

## Build, Test, and Development Commands

- `npm install`: install dependencies from `package-lock.json`.
- `npm run dev`: start the Next.js development server.
- `npm run build`: create a production build.
- `npm run start`: run the built production app.
- `npm run lint`: run ESLint over `.ts` and `.tsx` files.
- `npm test`: run Vitest unit tests in jsdom.
- `npx playwright test`: run end-to-end tests from `tests/`.
- `npm run prisma:seed`: seed the database with `prisma/seed.ts`.

Use `docker-compose up --build` when testing the containerized app and MinIO setup.

## Coding Style & Naming Conventions

Use TypeScript with strict checks and the `@/*` alias for imports from `src/`. Prettier uses 2-space indentation, semicolons, double quotes, ES5 trailing commas, 100-character lines, and Tailwind class sorting. Prefer functional React components and existing shadcn/ui primitives. Name React components in PascalCase, hooks as `use-*.ts` or `use-*.tsx`, and domain files like `projects.ts` or `project.ts`.

## Testing Guidelines

Vitest is configured with `jsdom`, globals, and `src/setupTests.ts`; place focused unit tests near `src/__tests__/` and name them `*.test.ts` or `*.test.tsx`. Playwright uses `tests/`, includes an auth setup project, and defaults to `http://localhost:3000` unless `PLAYWRIGHT_BASE_URL` is set. Add or update tests for business logic, validation, auth-sensitive flows, and user-facing dashboard behavior.

## Commit & Pull Request Guidelines

Recent history uses short prefixes such as `feat:`, `fix:`, `refactor:`, `chore:`, `ui:`, and `redesign:`. Keep commits scoped and imperative, for example `fix: handle Decimal serialization in reports`. Pull requests should include a summary, linked issue or context, test results, and screenshots or recordings for UI changes. Note schema, migration, environment, or deployment impacts.

## Security & Configuration Tips

Do not commit secrets. Configure local values in `.env` using `.env.example` as the starting point. Keep `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and MinIO settings aligned with the runtime you are testing. When changing Prisma models, include the generated migration and verify seeding still works.
