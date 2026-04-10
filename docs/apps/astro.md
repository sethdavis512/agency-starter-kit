# Adding an Astro 5 App

This guide covers adding an Astro 5 site to the monorepo. Astro is the
right pick when the app is content-heavy (marketing, blog, landing pages,
docs portal that is not Docusaurus) and you want minimal client JavaScript
with selective "islands" of React interactivity that reuse `@repo/ui`.

> Before you start, read [apps/README.md](../../apps/README.md) for the
> contract every app must satisfy. This guide fills in the Astro
> specifics.

## 1. Scaffold the directory

Target layout:

```
apps/marketing/
  public/
  src/
    layouts/
      BaseLayout.astro
    pages/
      index.astro
    styles/
      global.css
  astro.config.mjs
  package.json
  tsconfig.json
```

You can bootstrap with `bunx create-astro@latest apps/marketing --template minimal --typescript strict --no-install --no-git` and then align the
generated files with the templates below.

## 2. `apps/marketing/package.json`

```json
{
    "name": "marketing",
    "version": "0.0.0",
    "private": true,
    "type": "module",
    "scripts": {
        "dev": "astro dev",
        "build": "astro build",
        "preview": "astro preview",
        "start": "node ./dist/server/entry.mjs",
        "typecheck": "astro check",
        "lint": "eslint .",
        "test": "vitest run --passWithNoTests"
    },
    "dependencies": {
        "@astrojs/node": "^9.2.0",
        "@astrojs/react": "^5.0.3",
        "@repo/ui": "*",
        "astro": "^5.10.0",
        "react": "^19.2.4",
        "react-dom": "^19.2.4"
    },
    "devDependencies": {
        "@repo/typescript-config": "*",
        "@tailwindcss/vite": "^4.1.13",
        "@types/react": "^19.2.7",
        "@types/react-dom": "^19.2.3",
        "tailwindcss": "^4.1.13",
        "typescript": "^5.9.2"
    }
}
```

Notes:

- `@astrojs/react` 5.x supports React 19.
- `@astrojs/node` is the SSR adapter. Drop it if you only need static
  output.
- Pinning `react` / `react-dom` to `19.2.4` keeps Astro on the same
  version as `portal` and `admin`.
- `astro preview` is **dev only**. Production on Railway uses
  `node ./dist/server/entry.mjs` via the `start` script.

## 3. `apps/marketing/astro.config.mjs`

SSR mode with React, Tailwind v4, and the Node adapter:

```js
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    output: 'server',
    adapter: node({ mode: 'standalone' }),
    server: { host: true, port: 5540 },
    integrations: [react()],
    vite: {
        plugins: [tailwindcss()],
        ssr: {
            // Force Vite to bundle @repo/ui during SSR because the
            // package ships raw TSX, not compiled JS.
            noExternal: ['@repo/ui'],
        },
    },
});
```

For a fully static site (no Node runtime on Railway), drop `output` and
the `adapter` line. Astro defaults to static output and writes HTML to
`dist/`.

## 4. Tailwind v4 in Astro

The **`@tailwindcss/vite` plugin is the current answer**. The old
`@astrojs/tailwind` integration was designed for Tailwind v3 and is
deprecated. If the scaffolder adds it, remove it in favor of the Vite
plugin shown above.

## 5. `apps/marketing/src/styles/global.css`

```css
@import "tailwindcss";
@import "../../../../packages/ui/theme.css";

@source "../../../../packages/ui";
```

**Four `../` segments**, not three. The CSS file lives at
`apps/marketing/src/styles/global.css`, which is four directories deep
from the repo root (`styles` -> `src` -> `marketing` -> `apps` ->
root). This is deeper than the React Router 7 apps which put their CSS
at `apps/<name>/app/app.css`.

> Getting the `@source` path wrong is the most common Tailwind issue
> when adding an Astro app. If `text-primary` stops working, recount
> the hops.

## 6. `apps/marketing/src/layouts/BaseLayout.astro`

```astro
---
import '../styles/global.css';

interface Props {
    title: string;
}

const { title } = Astro.props;
---
<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
    </head>
    <body>
        <slot />
    </body>
</html>
```

## 7. `apps/marketing/src/pages/index.astro`

Smoke test page that mixes an Astro template with a React island from
`@repo/ui`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { Button } from '@repo/ui/button';
---
<BaseLayout title="Marketing">
    <main class="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 class="text-4xl font-bold text-primary">Astro + @repo/ui</h1>
        <Button client:load variant="primary">Hydrated on load</Button>
    </main>
</BaseLayout>
```

The `client:load` directive tells Astro to ship the React runtime for
this component and hydrate it in the browser. Without a client
directive the button renders as static HTML with no event handlers.

## 8. `apps/marketing/tsconfig.json`

Astro requires its own tsconfig preset for `.astro` file declarations
and the React JSX runtime. Extend Astro's preset, not the repo's shared
`@repo/typescript-config`.

```json
{
    "extends": "astro/tsconfigs/strict",
    "compilerOptions": {
        "jsx": "react-jsx",
        "jsxImportSource": "react",
        "baseUrl": ".",
        "paths": { "~/*": ["./src/*"] }
    },
    "include": [".astro/types.d.ts", "**/*"],
    "exclude": ["dist"]
}
```

## 9. Update `turbo.json`

Astro writes to `dist/` (already covered by the root `outputs` array)
and keeps a scratch directory at `.astro/` for generated types and
content collection cache. Add it to the root `turbo.json`:

```json
{
    "tasks": {
        "build": {
            "outputs": [
                "dist/**",
                "build/**",
                "generated/**",
                ".astro/**"
            ]
        }
    }
}
```

## 10. Railway deployment

### SSR (recommended when you want loaders or forms)

| Setting              | Value                                                                       |
|----------------------|-----------------------------------------------------------------------------|
| `NIXPACKS_BUILD_CMD` | `bun install --production=false && bunx turbo run build --filter=marketing` |
| `NIXPACKS_START_CMD` | `bun run start`                                                             |
| Watch paths          | `apps/marketing/**`, `packages/**`                                          |

The `start` script runs `node ./dist/server/entry.mjs`, which the
`@astrojs/node` adapter generates. It respects `HOST` and `PORT` env
vars because `server.host: true` is set in `astro.config.mjs`, and
Railway sets `PORT` automatically.

### Static site (faster, CDN-friendly)

Drop `output: 'server'` and the adapter from `astro.config.mjs`. Then:

1. Add `serve` as a dependency: `bun add serve --filter=marketing`.
2. Change the `start` script to: `"start": "serve -s dist -l ${PORT:-5540}"`.
3. Leave the Railway build/start commands as above.

The `-s` flag enables SPA fallback so unknown routes return
`index.html`. Remove `-s` if you do not want that behavior.

## 11. Verify the setup

From the repo root:

```bash
bun install                                     # workspace symlinks
bun run dev --filter=marketing                  # starts on port 5540
bun run build --filter=marketing                # builds to dist/
bun run typecheck --filter=marketing            # runs astro check
```

Open `http://localhost:5540` and confirm the React island from
`@repo/ui/button` renders with the shared OKLCH `text-primary` color.

## Known gotchas

- **`noExternal: ['@repo/ui']` is not optional.** Without it, Astro's
  SSR step tries to import the package as compiled JS from
  `node_modules` and crashes because the package only ships `.tsx`.
- **`astro preview` is not a production server.** Use the Node adapter
  entrypoint for SSR, or `serve` for static output.
- **Default port is 4321.** Override it via `server.port` so multiple
  Astro apps can coexist with `portal` (5520) and `admin` (5510).
- **`@source` path depth is four.** This is the single most common
  source of "my Tailwind classes stopped working" reports when adding
  Astro to an existing monorepo.
- **Islands need a `client:` directive.** Components imported from
  `@repo/ui` that rely on React state will not hydrate unless you add
  `client:load`, `client:idle`, `client:visible`, or similar.
