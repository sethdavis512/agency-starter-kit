# Adding Apps to the Monorepo

This directory holds every deployable application in the starter kit. Each
entry in `apps/*` is an independent workspace managed by Turborepo and `bun`
workspaces. You can add as many additional apps as you want. This guide
explains the contract every new app must satisfy, and links to per-framework
quickstarts for the popular choices.

## What ships out of the box

| App    | Stack                 | Dev port | Purpose                    |
|--------|-----------------------|----------|----------------------------|
| portal | React Router 7 + Vite | 5520     | Customer-facing site       |
| admin  | React Router 7 + Vite | 5510     | Internal admin console     |
| cli    | Bun + Commander       | n/a      | Dev and ops automation CLI |

## Framework quickstart guides

Pick the framework that fits the problem, then follow its dedicated guide.
Each guide is self-contained: file contents, scripts, Railway wiring, and
known gotchas.

| Framework            | Best for                                               | Guide                                 |
|----------------------|--------------------------------------------------------|---------------------------------------|
| React Router 7       | Full-stack React with SSR and forms                    | See `apps/portal` and `apps/admin`    |
| Next.js 15           | Mature ecosystem, App Router, ISR, enterprise SEO      | [docs/apps/nextjs.md](../docs/apps/nextjs.md)         |
| Astro 5              | Content sites, marketing, blogs, minimal JS by default | [docs/apps/astro.md](../docs/apps/astro.md)           |
| Docusaurus 3         | Versioned documentation with MDX and i18n              | [docs/apps/docusaurus.md](../docs/apps/docusaurus.md) |
| Vite 7 + React SPA   | Internal tools, dashboards, client-only prototypes     | [docs/apps/vite.md](../docs/apps/vite.md)             |

> Nothing stops you from dropping in a completely different stack (SvelteKit,
> SolidStart, Remix, TanStack Start, a Go or Rust binary, etc.). As long as the
> workspace satisfies the contract below, Turbo and Railway will treat it the
> same as the existing apps.

## The contract every app must satisfy

Every directory under `apps/*` must meet these requirements so Turbo can
orchestrate it and Railway can deploy it.

### 1. A `package.json` with a workspace name and Turbo scripts

Minimum viable:

```json
{
    "name": "<your-app-name>",
    "version": "0.0.0",
    "private": true,
    "type": "module",
    "scripts": {
        "dev": "<start the dev server>",
        "build": "<produce a production build>",
        "start": "<serve the production build>",
        "lint": "<optional>",
        "typecheck": "<optional>",
        "test": "vitest run --passWithNoTests"
    }
}
```

Turbo discovers workspaces via the root `package.json` `"workspaces": ["apps/*", "packages/*"]`
glob. No manual registration is needed.

### 2. A unique dev port

Ports already claimed:

- 5510: `admin`
- 5520: `portal`

Pick something outside that range. Suggested defaults per framework are
listed in each framework guide.

### 3. Workspace dependencies for shared packages

Depend on shared code with the workspace protocol so bun creates the
symlink:

```json
{
    "dependencies": {
        "@repo/database": "*",
        "@repo/ui": "*",
        "@repo/auth": "*",
        "@repo/utils": "*",
        "@repo/validation": "*"
    }
}
```

Import with subpath exports, never deep relative paths:

```tsx
import { Button } from '@repo/ui/button';
import { prisma } from '@repo/database';
import { auth } from '@repo/auth/server';
```

### 4. Build outputs Turbo knows about

The root `turbo.json` already caches these output directories on the `build`
task:

```
dist/**
build/**
generated/**
```

Most frameworks fit one of those. Two exceptions are worth calling out:

- **Next.js** writes to `.next/` and its cache lives at `.next/cache/`. You
  must extend the root `turbo.json` `outputs` array to include `.next/**`
  and exclude `.next/cache/**`. See the Next.js guide.
- **Docusaurus** writes to `build/` (matches the default) but also creates a
  `.docusaurus/` scratch directory. Add `.docusaurus/**` to the root
  `turbo.json` `outputs` so Turbo caches it correctly.

### 5. Tailwind v4 wiring (for any app that renders `@repo/ui` components)

`@repo/ui` components expect the same design tokens every app. Wire them
in by creating one global CSS file in the app that does three things:

```css
@import "tailwindcss";
@import "../../../packages/ui/theme.css";
@source "../../../packages/ui";
```

The `@source` directive tells Tailwind v4 to scan `packages/ui` for class
names. The number of `../` segments depends on where the CSS file lives
relative to the repo root:

| CSS file location                         | `@source` path                |
|-------------------------------------------|-------------------------------|
| `apps/<name>/app/app.css`                 | `../../../packages/ui`        |
| `apps/<name>/app/globals.css`             | `../../../packages/ui`        |
| `apps/<name>/src/index.css`               | `../../../packages/ui`        |
| `apps/<name>/src/styles/global.css`       | `../../../../packages/ui`     |

> Count the directory hops from the CSS file back to the repo root, then
> append `packages/ui`. Getting this wrong is the most common reason
> Tailwind classes from `@repo/ui` stop working in a new app.

### 6. Bundler awareness of `@repo/ui`

`@repo/ui` ships **raw `.tsx`** with no build step. Every bundler must be
told to transform it:

| Framework      | How to enable                                             |
|----------------|-----------------------------------------------------------|
| React Router 7 | Automatic (Vite handles workspace packages)               |
| Vite SPA       | Automatic                                                 |
| Next.js 15     | `transpilePackages: ['@repo/ui']` in `next.config.ts`     |
| Astro 5        | `vite.ssr.noExternal: ['@repo/ui']` in `astro.config.mjs` |
| Docusaurus 3   | Not recommended. Use Docusaurus's own Infima theme.       |

### 7. Railway deployment shape

Every app deploys to its own Railway service. The monorepo uses Nixpacks
with a custom build and start command so the full monorepo is available
during the build.

| Setting              | Value                                                                     |
|----------------------|---------------------------------------------------------------------------|
| `NIXPACKS_BUILD_CMD` | `bun install --production=false && bunx turbo run build --filter=<name>`  |
| `NIXPACKS_START_CMD` | `bun run start`                                                           |
| Watch paths          | `apps/<name>/**`, `packages/**`                                           |

The `bun run start` command runs against the app workspace, so make sure
the new app's `package.json` has a working `start` script that binds to
`0.0.0.0` and reads `process.env.PORT`. Each framework guide shows the
right shape.

You can create the service manually with `railway add --service <name>`
then set the variables above, or extend `apps/cli/src/commands/railway-setup.ts`
and `deploy.ts` to cover the new app alongside `portal` and `admin`.

## End-to-end workflow for adding any new app

1. **Scaffold the directory.** Use the framework's create tool or create
   files manually following the relevant guide in `docs/apps/`. Place
   everything under `apps/<name>/`.
2. **Install from the repo root.** Run `bun install` from the repo root,
   not inside the new app. Bun workspaces hoist shared deps and create
   the workspace symlinks.
3. **Verify dev.** `bun run dev --filter=<name>` should start the dev
   server on the app's configured port. Open it and confirm an `@repo/ui`
   component (if used) renders with the design tokens.
4. **Verify build.** `bun run build --filter=<name>` should produce the
   build output in the expected directory and Turbo should cache it.
5. **Wire up tests.** Copy the `vitest.config.ts` pattern from `apps/portal`
   if the framework supports Vitest. Add a Playwright project to
   `playwright.config.ts` if you want browser-level coverage.
6. **Provision Railway.** Create a service, paste in the build and start
   commands, add the watch paths, and set any framework-specific env vars.
7. **Deploy.** `railway up --detach --service <name>` from the repo root.

## Troubleshooting

**Tailwind classes from `@repo/ui` aren't applying.** The `@source`
directive is missing or the path is wrong. Tailwind v4 resolves it
relative to the CSS file. Count the `../` hops back to the repo root.

**TypeScript cannot find `@repo/ui/button`.** Run `bun install` from the
repo root. Workspace symlinks live in the root `node_modules` and are
created by the root install.

**Dev server port is already in use.** Another app is already bound to
that port. Pick a different one in the framework's config.

**Turbo rebuilds unrelated apps on every change.** Check that your new
app's build output directory is covered by the root `turbo.json` `outputs`
array. Adding a framework with a new output directory (`.next`, `.output`,
`.svelte-kit`, etc.) without updating `turbo.json` breaks caching.

**Railway build succeeds but the service crashes at boot.** The app's
`start` script must bind to `0.0.0.0` on `$PORT`. Most frameworks read
`PORT` automatically. A few need an explicit host flag. Each guide
documents the exact command.

**Two apps pin different React minor versions.** Add an `overrides` /
`resolutions` block to the root `package.json` so bun picks a single
version. Required if you mix Docusaurus with React 19 apps and want to
avoid duplicate React copies in the root `node_modules`.

```json
{
    "overrides": {
        "react": "19.2.4",
        "react-dom": "19.2.4"
    },
    "resolutions": {
        "react": "19.2.4",
        "react-dom": "19.2.4"
    }
}
```

## Where to go next

- [docs/apps/nextjs.md](../docs/apps/nextjs.md) for Next.js 15
- [docs/apps/astro.md](../docs/apps/astro.md) for Astro 5
- [docs/apps/docusaurus.md](../docs/apps/docusaurus.md) for Docusaurus 3
- [docs/apps/vite.md](../docs/apps/vite.md) for a Vite + React SPA
