# Adding a Next.js 15 App

This guide covers adding a Next.js 15 (App Router) app to the monorepo
alongside the existing React Router 7 apps. Next.js is the right pick when
you need a mature ecosystem, heavy SEO, incremental static regeneration,
middleware at the edge, or any of Vercel's framework conventions.

> Before you start, read [apps/README.md](../../apps/README.md) for the
> contract every app must satisfy (scripts, Turbo outputs, Tailwind wiring,
> Railway shape). This guide fills in the Next.js specifics.

## 1. Scaffold the directory

Create `apps/web/` (or any workspace name you like) with the structure:

```
apps/web/
  app/
    layout.tsx
    page.tsx
    globals.css
  public/
  next.config.ts
  next-env.d.ts
  package.json
  postcss.config.mjs
  tsconfig.json
```

You can bootstrap with `bunx create-next-app@latest apps/web` and then
trim what you do not need, or create the files by hand following the
templates below.

## 2. `apps/web/package.json`

```json
{
    "name": "web",
    "version": "0.0.0",
    "private": true,
    "type": "module",
    "scripts": {
        "dev": "next dev --turbo --port 5530",
        "build": "next build",
        "start": "next start --port ${PORT:-5530}",
        "lint": "next lint",
        "typecheck": "tsc --noEmit",
        "test": "vitest run --passWithNoTests"
    },
    "dependencies": {
        "@repo/auth": "*",
        "@repo/database": "*",
        "@repo/ui": "*",
        "next": "^15.5.0",
        "react": "^19.2.4",
        "react-dom": "^19.2.4"
    },
    "devDependencies": {
        "@repo/eslint-config": "*",
        "@repo/typescript-config": "*",
        "@tailwindcss/postcss": "^4.1.13",
        "@types/node": "^22",
        "@types/react": "^19.2.7",
        "@types/react-dom": "^19.2.3",
        "eslint": "^8.57.1",
        "eslint-config-next": "^15.5.0",
        "tailwindcss": "^4.1.13",
        "typescript": "^5.9.2"
    }
}
```

Notes:

- React 19.2 matches `portal` and `admin`. Align the minor to avoid two
  React copies under the root `node_modules`.
- `next dev --turbo` opts into Turbopack for dev. Turbopack is default
  only in Next.js 16.
- Port `5530` is a suggestion. Pick any free port outside the 551x/552x
  range used by `admin` and `portal`.

## 3. `apps/web/next.config.ts`

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    transpilePackages: ['@repo/ui'],
};

export default nextConfig;
```

`transpilePackages` is the stable Next.js 15 API for consuming workspace
packages that ship raw `.tsx`. You need it because `@repo/ui` has no
build step.

### Should I enable `output: 'standalone'`?

For Railway, skip it. The `standalone` output is useful on Vercel and
inside small Docker images where a few hundred MB matter, but it
complicates Railway deploys because you have to copy `.next/static` and
`public/` manually after the build. Plain `next start` works fine on
Railway and Nixpacks handles the Node runtime.

## 4. `apps/web/postcss.config.mjs`

Tailwind v4 in Next.js requires PostCSS. There is no `tailwind.config.js`
in v4 (the theme lives in CSS via `@theme`).

```js
export default {
    plugins: {
        '@tailwindcss/postcss': {},
    },
};
```

## 5. `apps/web/app/globals.css`

```css
@import "tailwindcss";
@import "../../../packages/ui/theme.css";
@source "../../../packages/ui";
```

`@source` is a Tailwind v4 CSS directive. It is processed by
`@tailwindcss/postcss` and resolves relative to the CSS file's location,
not the Next.js project root. From `apps/web/app/globals.css` it takes
three `../` to reach the repo root, then `packages/ui` from there.

## 6. `apps/web/app/layout.tsx`

```tsx
import './globals.css';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
```

## 7. `apps/web/app/page.tsx`

A smoke test page that pulls a component from `@repo/ui`:

```tsx
import { Button } from '@repo/ui/button';

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-4">
            <h1 className="text-4xl font-bold text-primary">Next.js on Turborepo</h1>
            <Button variant="primary">Shared UI works</Button>
        </main>
    );
}
```

## 8. `apps/web/tsconfig.json`

```json
{
    "extends": "@repo/typescript-config/base.json",
    "compilerOptions": {
        "target": "ES2022",
        "lib": ["DOM", "DOM.Iterable", "ES2022"],
        "jsx": "preserve",
        "module": "ESNext",
        "moduleResolution": "Bundler",
        "allowJs": true,
        "noEmit": true,
        "incremental": true,
        "resolveJsonModule": true,
        "plugins": [{ "name": "next" }],
        "baseUrl": ".",
        "paths": { "~/*": ["./*"] }
    },
    "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    "exclude": ["node_modules"]
}
```

The repo's `@repo/typescript-config/base.json` is deliberately minimal so
it composes with Next.js's expected JSX and module settings.

## 9. Update `turbo.json`

Next.js writes to `.next/` with a cache at `.next/cache/`. Add those to
the root `turbo.json` `build.outputs` array. **Do not cache
`.next/cache/`** or Turbo will hoard incremental build artifacts forever.

```json
{
    "$schema": "https://turborepo.dev/schema.json",
    "tasks": {
        "build": {
            "dependsOn": ["^build"],
            "inputs": ["$TURBO_DEFAULT$", ".env*"],
            "outputs": [
                "dist/**",
                "build/**",
                "generated/**",
                ".next/**",
                "!.next/cache/**"
            ]
        }
    }
}
```

## 10. Railway deployment

Create a new Railway service and set:

| Setting              | Value                                                                |
|----------------------|----------------------------------------------------------------------|
| `NIXPACKS_BUILD_CMD` | `bun install --production=false && bunx turbo run build --filter=web` |
| `NIXPACKS_START_CMD` | `bun run start`                                                      |
| Watch paths          | `apps/web/**`, `packages/**`                                         |

Next.js reads `process.env.PORT` automatically, so no additional flag is
needed on Railway.

Extend `apps/cli/src/commands/railway-setup.ts` if you want the CLI's
one-shot Railway bootstrapper to provision this service too.

## 11. Verify the setup

From the repo root:

```bash
bun install                              # creates workspace symlinks
bun run dev --filter=web                  # starts Next.js on port 5530
bun run build --filter=web                # produces the production build
bun run typecheck --filter=web            # runs tsc
```

Visit `http://localhost:5530` and confirm the button renders with the
shared OKLCH `text-primary` color.

## Known gotchas

- **Turbopack for `next build`** is still beta in Next 15. Leave the
  build on webpack (no `--turbo` flag on `next build`). Only use
  Turbopack for `next dev`.
- **React Server Components and `@repo/ui`.** Components in `@repo/ui`
  that use client hooks must have `'use client'` at the top. They do
  already (the `Button` is client). You can still import them from
  server components.
- **Prisma client in server code only.** Use `@repo/database` only from
  server components, route handlers, and server actions. Never import
  it into a file that runs on the client.
- **`transpilePackages` vs `serverComponentsExternalPackages`.** You
  need the first (because `@repo/ui` is raw TSX). You do **not** need
  `serverComponentsExternalPackages` for `@repo/ui`. Only add that for
  server-only packages that bundle native bindings or pre-compiled CJS.
