# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev`: Start Next.js development server (default: port 3050)
- `npm run build`: Build production application
- `npm run lint`: Run ESLint
- `npm run format`: Format code with Prettier

### Database (Prisma + SQLite)
- `npm run db:generate`: Generate Prisma Client
- `npm run db:migrate`: Run Prisma migrations (development)
- `npm run db:seed`: Seed the database with initial/demo data
- `npm run db:studio`: Open Prisma Studio GUI

### Testing
- `npx playwright test`: Run all E2E tests
- `npx playwright test tests/e2e.spec.ts`: Run specific test file

## Architecture & Structure

### Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS + shadcn/ui
- **ORM**: Prisma (SQLite)
- **Auth**: NextAuth.js v5
- **Storage**: MinIO S3 (for documents/photos)

### Project Structure
- `src/app/`: App router pages. Dashboard modules are grouped in `(dashboard)/`.
- `src/actions/`: Module-specific Server Actions (primary method for data mutation).
- `src/components/`: React components.
  - `ui/`: shadcn base components.
  - `forms/`: Reusable module forms.
- `src/lib/`: Core utilities (auth, prisma, storage client).
- `src/schemas/`: Zod schemas for validation and TypeScript types.
- `prisma/`: Database schema and seeding logic.

### Core Patterns
- **Data Mutation**: Use Server Actions in `src/actions/` rather than API routes where possible.
- **Validation**: Zod is used for form validation and Server Action input verification.
- **Styling**: Use Tailwind utility classes. Prefer shadcn/ui components for consistency.
- **Localization**: UI is primarily in Vietnamese; maintain consistent terminology.
- **Local-first**: Designed for local construction management using SQLite.
