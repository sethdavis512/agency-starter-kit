# Admin

Internal admin console in the agency-starter-kit monorepo. Built with
[React Router 7](https://reactrouter.com/) (framework mode, SSR enabled) +
Vite + Tailwind CSS v4.

`admin` and `portal` are a near-identical scaffold pair: same routes, same
auth flow, same shared `@repo/*` packages — they differ only by dev port and
a UI `variant` prop used for branding. There is no role-based access control
yet; `admin` is not gated to admin users. The only role-aware UI is the
admin profile page showing `user.role`. Treat the duplication as template
scaffolding, not a divergent product.

## Getting Started

Run everything from the **repo root**, not from `apps/admin`. Bun workspaces
hoist dependencies and create the `@repo/*` symlinks at the root.

### Installation

```bash
bun install
```

### Environment

Copy `.env.example` to `.env` in this directory and fill in `DATABASE_URL`
(matching `packages/database/.env`) and `BETTER_AUTH_SECRET`. See
`.env.example` for details on each variable.

### Database

```bash
bun run db:up        # start local Postgres (optional, from repo root)
bun run cli db:setup # generate + push + seed
```

### Development

```bash
bun run dev --filter=admin
```

The app is available at **`http://localhost:5510`** (not the React Router
template default of 5173 — see `vite.config.ts`).

### Authentication

Auth is handled by the shared `@repo/auth` package (Better Auth). Routes
`sign-in`, `sign-up`, `sign-out`, and `api/auth/*` wire the flow. Protected
routes live under `protected-layout.tsx`, which calls `requireAuth` — this
gates access only, it does not check role.

## Building for Production

```bash
bun run build --filter=admin
```

## Deployment

Deployed to Railway. See the repo root `CLAUDE.md` for the build command and
watch paths.

## Testing

```bash
bun run test --filter=admin      # unit tests (Vitest)
bun run e2e:admin                # Playwright e2e (from repo root)
```
