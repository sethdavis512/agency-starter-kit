# Adding a Vite 7 + React SPA

This guide covers adding a pure client-side React SPA powered by Vite 7.
This is **not** the same as the existing `portal` and `admin` apps, which
use React Router 7 framework mode (Vite plus an SSR bundler). A Vite SPA
is the right pick for internal tools, dashboard prototypes, client-only
admin panels, and anywhere you explicitly do not want server-side
rendering.

> Before you start, read [apps/README.md](../../apps/README.md) for the
> contract every app must satisfy. This guide fills in the Vite SPA
> specifics.

## 1. Scaffold the directory

Target layout:

```
apps/tools/
  public/
  src/
    App.tsx
    index.css
    main.tsx
  index.html
  package.json
  tsconfig.json
  vite.config.ts
```

You can bootstrap with `bunx create-vite@latest apps/tools --template react-ts --no-install` and then align the files with the templates
below.

## 2. `apps/tools/package.json`

```json
{
    "name": "tools",
    "version": "0.0.0",
    "private": true,
    "type": "module",
    "scripts": {
        "dev": "vite",
        "build": "vite build",
        "preview": "vite preview",
        "start": "serve -s dist -l ${PORT:-5560}",
        "lint": "eslint .",
        "typecheck": "tsc --noEmit",
        "test": "vitest run --passWithNoTests",
        "test:watch": "vitest"
    },
    "dependencies": {
        "react": "^19.2.4",
        "react-dom": "^19.2.4",
        "serve": "^14.2.4"
    },
    "devDependencies": {
        "@repo/typescript-config": "*",
        "@repo/ui": "*",
        "@tailwindcss/vite": "^4.1.13",
        "@types/react": "^19.2.7",
        "@types/react-dom": "^19.2.3",
        "@vitejs/plugin-react": "^5.0.4",
        "tailwindcss": "^4.1.13",
        "typescript": "^5.9.2",
        "vite": "^7.1.7",
        "vite-tsconfig-paths": "^5.1.4"
    }
}
```

Notes:

- Pin React to 19.2.4 to match `portal` and `admin`.
- `serve` is the `start` entrypoint for Railway. Vite's own `preview`
  command is dev-only and should not run in production.
- Port 5560 is a suggestion. Pick something outside the 551x/552x range
  already used by other apps.

## 3. `apps/tools/vite.config.ts`

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    plugins: [react(), tailwindcss(), tsconfigPaths()],
    server: {
        port: 5560,
        host: true,
    },
    preview: {
        port: 5560,
        host: true,
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
        target: 'esnext',
    },
});
```

The `@tailwindcss/vite` plugin is the Tailwind v4 way. No PostCSS
config file needed.

## 4. `apps/tools/index.html`

Vite expects `index.html` at the app root, **not** inside `src/`.

```html
<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Tools</title>
    </head>
    <body>
        <div id="root"></div>
        <script type="module" src="/src/main.tsx"></script>
    </body>
</html>
```

## 5. `apps/tools/src/index.css`

```css
@import "tailwindcss";
@import "../../../packages/ui/theme.css";
@source "../../../packages/ui";
```

Three `../` segments. The file lives at `apps/tools/src/index.css`,
which is three directories deep from the repo root (`src` -> `tools`
-> `apps` -> root), the same depth as the existing React Router 7 apps.

## 6. `apps/tools/src/main.tsx`

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>
);
```

## 7. `apps/tools/src/App.tsx`

Smoke test that pulls a component from `@repo/ui`:

```tsx
import { Button } from '@repo/ui/button';

export default function App() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-4">
            <h1 className="text-4xl font-bold text-primary">Vite SPA</h1>
            <Button variant="primary">Shared UI works</Button>
        </main>
    );
}
```

## 8. `apps/tools/tsconfig.json`

Extend the repo's Vite preset. `@repo/typescript-config/vite.json`
already sets `jsx: "react-jsx"`, `module: "ESNext"`, `noEmit: true`, and
strict options that are correct for a Vite SPA.

```json
{
    "extends": "@repo/typescript-config/vite.json",
    "compilerOptions": {
        "types": ["vite/client"],
        "baseUrl": ".",
        "paths": { "~/*": ["./src/*"] }
    },
    "include": ["src", "vite.config.ts"]
}
```

## 9. Turbo integration

Vite writes to `dist/`, which is already covered by the root
`turbo.json` `outputs` array. **No `turbo.json` changes needed.**

## 10. Railway deployment

| Setting              | Value                                                                   |
|----------------------|-------------------------------------------------------------------------|
| `NIXPACKS_BUILD_CMD` | `bun install --production=false && bunx turbo run build --filter=tools` |
| `NIXPACKS_START_CMD` | `bun run start`                                                         |
| Watch paths          | `apps/tools/**`, `packages/**`                                          |

The `start` script runs `serve -s dist -l $PORT`, which:

- Serves the built SPA from `dist/` on whatever port Railway injects.
- Binds to `0.0.0.0` by default.
- The `-s` flag enables **SPA fallback**: unknown routes return
  `index.html` so client-side routing (React Router, TanStack Router,
  etc.) works correctly on direct URL loads.

Railway's healthcheck can point at `/` directly. `serve -s` returns
`index.html` with a 200 for any path, so no custom health endpoint
is needed.

> If you opt into Railway's Railpack builder instead of Nixpacks, it
> will auto-detect a Vite app and serve the `dist/` folder with Caddy.
> In that case you can drop `serve` from `dependencies` and simplify
> the `start` script. For Nixpacks (the current default in this kit),
> stick with `serve`.

## 11. Verify the setup

From the repo root:

```bash
bun install                              # workspace symlinks
bun run dev --filter=tools                # starts Vite on port 5560
bun run build --filter=tools              # builds to apps/tools/dist/
bun run typecheck --filter=tools          # runs tsc
```

Visit `http://localhost:5560` and confirm the `Button` from `@repo/ui`
renders with the shared OKLCH `text-primary` color.

## Known gotchas

- **`vite preview` is not for production.** Use `serve -s dist -l $PORT`
  in the `start` script. Vite's own docs explicitly warn against using
  `vite preview` as a production server.
- **SPA fallback matters.** Without `serve -s`, a direct hit on
  `/some/deep/route` returns 404. Any client-router SPA needs this
  flag (or equivalent `try_files` logic in Nginx/Caddy).
- **Don't import `@repo/auth/server` or `@repo/database`.** Those
  packages are server-only. A Vite SPA runs entirely in the browser.
  Talk to the portal or admin's API routes for anything that needs
  server state.
- **Tailwind `@source` path is three `../`** for a CSS file at
  `apps/<name>/src/index.css`. Same depth as `portal` and `admin`. If
  you move the CSS under a subdirectory like
  `apps/<name>/src/styles/global.css`, add one more `../` (four total)
  because the file is now one directory deeper. Always count from the
  CSS file itself, not the app root.
- **If you add React Router inside this SPA** (the client-only
  version, not framework mode), use `createBrowserRouter` from
  `react-router` directly. Do **not** import from
  `@react-router/dev` because that is for framework mode only.
