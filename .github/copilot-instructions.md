# Copilot Instructions

## Architecture

Turborepo monorepo with two React Router 7 apps (`portal`, `admin`) sharing internal packages. Apps use SSR, Vite, and Tailwind v4.

**Key Packages:**

- `@repo/database` — Prisma client singleton; `build` script runs `prisma generate` (auto-invoked by Turbo)
- `@repo/ui` — Shared React components using CVA + tailwind-merge; exports raw `.tsx` files (no build)
- `@repo/theme` — Shared Tailwind v4 theme CSS
- `@repo/typescript-config`, `@repo/eslint-config` — Shared tooling configs

## Critical Commands

```bash
# Development & Build
bun run dev                           # Run all apps in parallel
bun run dev --filter=portal           # Single app
turbo run build --filter=portal       # Turbo filtered build

# Database (from packages/database/)
bunx prisma generate                   # Generate client (auto-runs in turbo build)
bunx prisma migrate dev                # Create migration
bunx prisma db push                    # Push schema changes
bunx prisma studio                     # Database GUI
```

## React Router 7 Patterns

**Config-based routing** in `app/routes.ts`:

```ts
import { type RouteConfig, index } from '@react-router/dev/routes';
export default [index('routes/home.tsx')] satisfies RouteConfig;
```

**Data access via props, NOT hooks:**

```ts
// ✅ Correct
export async function loader({ request, params }: Route.LoaderArgs) { ... }
export default function MyRoute({ loaderData }: Route.ComponentProps) { ... }

// ❌ Avoid
useLoaderData() // Old pattern, don't use
```

**Route types** auto-generated from `./+types/<route>`. Path alias `~/` maps to `app/` directory.

## Tailwind v4 Monorepo Integration

Each app's `app/app.css` requires:

```css
@import 'tailwindcss';
@import '../../../packages/theme/theme.css';
@source "../../../packages/ui";
```

The `@source` directive tells Tailwind v4 to scan the UI package. Paths are relative to the CSS file location (`apps/*/app/`), requiring `../../../` to reach repo root.

## Shared UI Components

`@repo/ui` exports individual components via package.json `exports` field. Import as:

```ts
import { Card } from '@repo/ui/card'; // Maps to components/Card.tsx
```

Components use CVA with tailwind-merge for variant styling (see `packages/ui/utils/cva.config.ts`).

## Database Access

Import the singleton Prisma client from `@repo/database`:

```ts
import { prisma } from '@repo/database';
```

The singleton pattern prevents connection exhaustion in development (see `packages/database/src/index.ts`).

## Deployment

Deployed to Railway. Each app has its own service with watch paths:

- `portal` watches: `apps/portal/**`, `packages/**`
- `admin` watches: `apps/admin/**`, `packages/**`

Railway build command: `bun install --production=false && turbo run build --filter=<app>`

## Turbo Build Dependencies

The `@repo/database` package must build before apps (runs `prisma generate`). This is configured in `turbo.json` via `"dependsOn": ["^build"]`. Apps depend on the generated Prisma client.
