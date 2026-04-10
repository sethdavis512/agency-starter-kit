# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
bun run dev              # Run all apps in parallel
bun run build            # Build all workspaces
bun run lint             # Lint all workspaces
bun run e2e              # Run all Playwright projects in one run
bun run e2e:portal       # Run only portal e2e project
bun run e2e:admin        # Run only admin e2e project
bun run e2e:report       # Open combined Playwright report
# Optional: PLAYWRIGHT_REUSE_SERVER=1 bun run e2e
bun run format           # Prettier format all files

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
- `portal` and `admin` — React Router 7 + Vite + Tailwind v4, SSR enabled, build output in `build/`
- `cli` — Commander.js CLI tool for DB, user, session, and deployment operations. Uses `bun build --compile` to produce a standalone binary. Run with `bun run cli <command>` during dev.

**Packages** (`packages/`):
- `@repo/database` — Prisma client + PostgreSQL schema. Exports singleton `PrismaClient`. The `build` script runs `prisma generate`, which Turbo runs before app builds via `dependsOn: ["^build"]`.
- `@repo/ui` — Component library (43 components) using Base UI primitives, CVA variants, and OKLCH design tokens (primary, secondary, accent, neutral, muted, danger, surface). Exports raw `.tsx` files (no build step). Components are exported individually via package.json `exports` (e.g., `"./button": "./components/Button/index.ts"`). Also exports `theme.css` with token definitions and dark mode support.
- `@repo/typescript-config` — Shared tsconfig presets (`base.json`, `vite.json`)
- `@repo/eslint-config` — Shared ESLint configuration

## React Router 7 Patterns

- Config-based routing in `app/routes.ts`
- Async `loader` functions for data fetching, async `action` functions for mutations
- Access data via component props (`{ loaderData }: Route.ComponentProps`), NOT `useLoaderData`/`useActionData`
- Route types generated from `./+types/<route>` (e.g., `import type { Route } from './+types/home'`)
- Path alias: `~/` maps to `app/` directory

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
