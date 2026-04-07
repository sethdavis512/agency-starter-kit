# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
bun run dev              # Run all apps in parallel
bun run build            # Build all workspaces
bun run lint             # Lint all workspaces
bun run format           # Prettier format all files

# Single app
bun run dev --filter=portal
bun run build --filter=portal
bun run typecheck --filter=portal

# Database (run from packages/database/)
bunx prisma generate      # Generate Prisma client (also runs as part of turbo build)
bunx prisma db push       # Push schema to database
bunx prisma migrate dev   # Create migration
bunx prisma db seed       # Seed database
bunx prisma studio        # Visual database browser

# Turbo filtered builds
bunx turbo run build --filter=portal
bunx turbo run build --filter=admin
```

## Architecture

Turborepo monorepo with two React Router 7 apps sharing packages.

**Apps** (`apps/`):
- `portal` and `admin` — React Router 7 + Vite + Tailwind v4, SSR enabled, build output in `build/`

**Packages** (`packages/`):
- `@repo/database` — Prisma client + PostgreSQL schema. Exports singleton `PrismaClient`. The `build` script runs `prisma generate`, which Turbo runs before app builds via `dependsOn: ["^build"]`.
- `@repo/ui` — Shared React components using CVA + tailwind-merge. Exports raw `.tsx` files (no build step). Components are exported individually via package.json `exports` (e.g., `"./card": "./components/Card.tsx"`).
- `@repo/theme` — Shared Tailwind v4 theme CSS (`theme.css`). Imported by each app's `app.css` via relative path.
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
@import "../../../packages/theme/theme.css";
@source "../../../packages/ui";
```
The `@source` directive tells Tailwind v4 to scan the UI package for classes. Paths are relative to the CSS file (`apps/*/app/`), requiring three `../` to reach the repo root.

## Deployment

Deployed to Railway. Each app has its own Railway service with watch paths configured:
- `portal` watches: `apps/portal/**`, `packages/**`
- `admin` watches: `apps/admin/**`, `packages/**`

Railway build command: `bun install --production=false && turbo run build --filter=<app>`
