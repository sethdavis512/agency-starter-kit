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
# test:watch with no filter launches a persistent Vitest watcher in all 9 workspaces at
# once (9 competing TUIs in one terminal) — always scope it to the package you're on:
bun run test:watch --filter=@repo/auth    # or --filter=portal, --filter=@repo/utils, etc.
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
- `@repo/utils` — Small shared helpers. Subpaths: `./` (re-exports `tiny-invariant`), `./icons` (re-exports `lucide-react`), `./date` (date formatting), `./brand` (the `BRAND_NAME` placeholder-branding constant — see [Rebranding / placeholder content](./README.md#rebranding--placeholder-content) in the README).
- `@repo/ui-mcp` — Standalone MCP **server binary** (`ui-mcp-server`) that exposes the `@repo/ui` design system to AI assistants (component/variant lookup, token values, design-rule validation). NOT an app dependency — nothing imports it.
- `@repo/validation` — Placeholder. No subpath exports declared yet (previously advertised `./vehicle`, `./appointment`, `./repair` pointing at nonexistent files); not imported anywhere. Add exports back once real schema files exist.
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
- `site-layout.tsx` (the outermost layout) runs `populateSession` middleware, which fetches the session once per request and stores it in `userContext`. Every descendant loader — `landing`, `sign-in`, `sign-up`, and everything under `protected-layout` — reads the user via `context.get(userContext)` instead of calling `auth.api.getSession` again.
- Protected sections live under `protected-layout.tsx`, which calls `requireAuth` from `@repo/auth/middleware`. `requireAuth` only reads the context `populateSession` already populated and redirects to `/sign-in` if empty — it does not fetch the session itself. Auth checks gate access only — they do not check role.
- Server-side user access goes through `@repo/auth/context`; never import the Prisma client directly in routes.
- `health` (`GET /health`) is a loader-only resource route registered outside `site-layout` in `routes.ts`, so `populateSession` never runs for it. It is the one documented exception to the rule above: it runs `SELECT 1` through `@repo/database` and returns 200 `{ status: "ok" }` or 503 `{ status: "error" }` for Railway's health check.
- `cli user:delete` performs a hard delete (cascading to `Session`/`Account`) rather than a soft delete. This is intentional: `User`, `Session`, and `Account` are Better-Auth-managed tables, and Better Auth's own queries (sign-in, session lookup) don't know about a `deletedAt` column, so a soft-deleted user would still be able to authenticate unless Better Auth's queries were also patched to filter it — a larger change than the CLI command warrants. If soft delete becomes a real requirement, it needs to be implemented at the Better Auth integration layer, not just the schema.

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

Deployed to Railway, one service per app, built by Railpack (Railway's default builder, which ignores `NIXPACKS_*` variables). Each service's config is committed in `apps/<app>/railway.json`; the services have no root directory, so each one must be pointed at its file via Service → Settings → Config-as-code:

- `build.buildCommand`: `bun install --production=false && bunx turbo run build --filter=<app>`
- `deploy.startCommand`: `cd apps/<app> && bun run start`
- `deploy.healthcheckPath`: `/health` (see the `health` route below); `restartPolicyType`: `ON_FAILURE`
- `build.watchPatterns`: `apps/<app>/**`, `packages/**`

`DATABASE_URL` is required at **build** time as well as runtime: `turbo run build` runs `prisma generate`, which loads it via `prisma.config.ts` and fails when unset. Any well-formed Postgres URL satisfies the build (nothing connects), so set the real value on the service before the first deploy. `apps/<app>/Dockerfile` is an equivalent multi-stage image built from the repo root (`docker build -f apps/portal/Dockerfile --build-arg DATABASE_URL=... .`); `cli railway:setup` prints these requirements as its next steps and `cli status` probes each service's `/health`.

<!-- SPECKIT START -->

For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan

<!-- SPECKIT END -->
