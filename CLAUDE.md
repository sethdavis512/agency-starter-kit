# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Local database (optional — Docker)
bun run db:up            # Start local Postgres (docker compose, detached)
bun run db:down          # Stop local Postgres (data preserved in named volume)
bun run db:logs          # Tail Postgres logs

# Development
bun run dev              # Run all apps in parallel
bun run build            # Build all workspaces
bun run lint             # Lint all workspaces
bun run e2e              # Run all Playwright projects in one run
bun run e2e:portal       # Run only portal e2e project
bun run e2e:admin        # Run only admin e2e project
bun run e2e:report       # Open combined Playwright report
# Optional: PLAYWRIGHT_REUSE_SERVER=1 bun run e2e
# e2e global setup runs `prisma db push` (non-destructive) against DATABASE_URL by default.
# Set E2E_DB_RESET=1 to force-reset (drop + recreate all tables) before seeding — CI sets this;
# do NOT set it locally against a shared/dev/staging database.
bun run format           # Prettier format all files

# Unit tests (Vitest)
bun run test             # Run all unit tests across workspaces (via turbo)
bun run test:watch       # Vitest watch mode
# Single test: run vitest directly inside the package (e.g. packages/auth)
bunx vitest run src/auth.server.test.ts   # one file
bunx vitest run -t "revokes a session"    # by test name

# Single app
bun run dev --filter=portal
bun run build --filter=portal
bun run typecheck --filter=portal

# CLI (run from repo root)
bun run cli --help       # Show all commands
bun run cli db:setup     # Generate + push + seed
bun run cli db:status    # Check DB connectivity
bun run cli user:list    # List users
bun run cli add:route    # Scaffold a new route
bun run cli deploy       # Deploy to Railway

# Database (run from packages/database/)
bunx prisma generate      # Generate Prisma client (also runs as part of turbo build)
bunx prisma db push       # Push schema to database
bunx prisma migrate dev   # Create migration
bunx prisma studio        # Visual database browser

# Turbo filtered builds
bunx turbo run build --filter=portal
bunx turbo run build --filter=admin
bunx turbo run e2e --filter=portal
bunx turbo run e2e --filter=admin
```

## Architecture

Turborepo monorepo with two React Router 7 apps sharing packages.

**Apps** (`apps/`):

- `portal` and `admin` — React Router 7 + Vite + Tailwind v4, SSR enabled, build output in `build/`. These are intentionally a **near-identical scaffold pair**: same routes, same auth flow, same shared components, differing only by dev port (portal 5520, admin 5510) and a UI `variant` prop for branding. There is no role-based access control yet — `admin` is not gated to admin users; the only role-aware UI is the admin profile showing `user.role`. Treat the duplication as template scaffolding, not divergent products.
- `cli` — Commander.js CLI tool for DB, user, session, and deployment operations. Uses `bun build --compile` to produce a standalone binary. Run with `bun run cli <command>` during dev.

**Packages** (`packages/`):

- `@repo/database` — Prisma client + PostgreSQL schema. Exports singleton `PrismaClient`. The `build` script runs `prisma generate`, which Turbo runs before app builds via `dependsOn: ["^build"]`.
- `@repo/auth` — Better Auth wrapper shared by both apps. Subpath exports: `./server` (server instance), `./client` (browser client), `./context` (request user context), `./middleware` (`requireAuth` used by protected layouts). Peer-depends on `@repo/database`.
- `@repo/ui` — Component library (~52 components) using Base UI primitives, CVA variants, and OKLCH design tokens (primary, secondary, accent, neutral, muted, danger, surface). Exports raw `.tsx` files (no build step). Components are exported individually via package.json `exports` (e.g., `"./button": "./components/Button/index.ts"`). Also exports `theme.css` with token definitions and dark mode support. Note: many components are exported but unused by the apps; `index.ts` only re-exports a couple, so import by subpath (`@repo/ui/button`).
- `@repo/utils` — Small shared helpers. Subpaths: `./` (re-exports `tiny-invariant`), `./icons` (re-exports `lucide-react`), `./date` (date formatting).
- `@repo/ui-mcp` — Standalone MCP **server binary** (`ui-mcp-server`) that exposes the `@repo/ui` design system to AI assistants (component/variant lookup, token values, design-rule validation). NOT an app dependency — nothing imports it.
- `@repo/validation` — Placeholder. No subpath exports declared yet (previously advertised `./vehicle`, `./appointment`, `./repair` pointing at nonexistent files); not imported anywhere. Add exports back once real schema files exist.
- `@repo/test-utils` — Vitest DB/auth test helpers. Wired up but currently unused by any test.
- `@repo/typescript-config` — Shared tsconfig presets (`base.json`, `vite.json`)
- `@repo/eslint-config` — Shared ESLint configuration (flat config; consumed by root `eslint.config.js`)

## React Router 7 Patterns

- Config-based routing in `app/routes.ts`
- Async `loader` functions for data fetching, async `action` functions for mutations
- Access data via component props (`{ loaderData }: Route.ComponentProps`), NOT `useLoaderData`/`useActionData`
- Route types generated from `./+types/<route>` (e.g., `import type { Route } from './+types/home'`)
- Path alias: `~/` maps to `app/` directory

## Authentication

Both apps use Better Auth via `@repo/auth`:

- Routes `sign-in`, `sign-up`, `sign-out`, and the catch-all `api/auth/*` handler wire the flow; they are identical across portal and admin.
- Protected sections live under `protected-layout.tsx`, which calls `requireAuth` from `@repo/auth/middleware`. Auth checks gate access only — they do not check role.
- Server-side user access goes through `@repo/auth/context`; never import the Prisma client directly in routes.

## Database Connection

The apps and the Prisma CLI read **`DATABASE_URL`** and nothing else (`packages/database/src/index.ts` uses the `@prisma/adapter-pg` driver adapter; `prisma.config.ts` injects the URL for the CLI). There is no schema-pinned host — point `DATABASE_URL` wherever you like.

`DATABASE_URL` must be set in three `.env` files (mirrored by the committed `.env.example` files):

- `packages/database/.env` — used by the Prisma CLI (generate / db push / migrate / seed)
- `apps/portal/.env` and `apps/admin/.env` — used at app runtime

A root **`docker-compose.yml`** provides an optional local Postgres (`postgres:17-alpine`, port 5432, named volume) for development. It is purely a convenience: nothing in the build or `dev` flow depends on Docker, and the apps run against any `DATABASE_URL` (Railway, Neon, locally-installed Postgres). Typical first-run setup:

```bash
bun run db:up           # start local Postgres
# copy each .env.example to .env (defaults match the compose file)
bun run cli db:setup    # generate + push + seed
bun run dev
```

## Tailwind v4 Monorepo Setup

Each app's `app.css` must include:

```css
@import "tailwindcss";
@import "../../../packages/ui/theme.css";
@source "../../../packages/ui";
```

The `@source` directive tells Tailwind v4 to scan the UI package for classes. The theme import registers OKLCH design tokens. Paths are relative to the CSS file (`apps/*/app/`), requiring three `../` to reach the repo root.

## Deployment

Deployed to Railway. Each app has its own Railway service with watch paths configured:

- `portal` watches: `apps/portal/**`, `packages/**`
- `admin` watches: `apps/admin/**`, `packages/**`

Railway build command: `bun install --production=false && turbo run build --filter=<app>`

<!-- SPECKIT START -->

For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan

<!-- SPECKIT END -->
