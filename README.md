# Agency Starter Kit

A Turborepo starter kit for agencies shipping client web apps: two
React Router 7 + Vite apps (`portal` and `admin`) sharing an auth layer,
a Prisma/PostgreSQL database, and a ~52-component design system.

This is a template meant to be forked or copied as the starting point for
your own project — see [Using this example](#using-this-example) below. If
you spot a bug in the scaffolding itself (not in your fork), pull requests
are welcome; see [CONTRIBUTING.md](./CONTRIBUTING.md) for what's in scope
and how to validate a change before opening one.

## Local development database

The apps connect to PostgreSQL via a single `DATABASE_URL` environment variable — point it at any Postgres (Railway, Neon, a local install, etc.). For a zero-setup local database, an optional Docker Compose service is included:

```sh
bun run db:up     # start local Postgres (docker compose, detached)
```

Then create your `.env` files from the committed examples (their defaults already match the Compose service) and set up the schema:

```sh
cp packages/database/.env.example packages/database/.env
cp apps/portal/.env.example apps/portal/.env
cp apps/admin/.env.example apps/admin/.env

bun run cli db:setup   # generate Prisma client + apply migrations + seed demo users
bun run dev
```

Docker is optional — if you already have a `DATABASE_URL`, skip `db:up` and just set it in the three `.env` files. Stop the local database with `bun run db:down` (data persists in a named volume).

### Environment variables

Each app's `.env.example` documents these; the runtime ones go in `apps/portal/.env` and `apps/admin/.env`, and `DATABASE_URL` also in `packages/database/.env`.

| Variable                     | Required              | Purpose                                                                                                                                                  |
| ---------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`               | Yes (build + runtime) | Postgres connection string for Prisma.                                                                                                                   |
| `BETTER_AUTH_URL`            | Yes                   | Public base URL of the app (`http://localhost:5520` / `5510` locally).                                                                                   |
| `BETTER_AUTH_SECRET`         | Yes (deployed)        | Signing secret, `openssl rand -base64 32`.                                                                                                               |
| `TRUSTED_ORIGINS`            | Deployed              | Extra comma-separated origins for the CSRF check.                                                                                                        |
| `RESEND_API_KEY`             | No                    | Send password-reset and verification email through [Resend](https://resend.com). Unset → messages and their links are printed to the server log instead. |
| `EMAIL_FROM`                 | With `RESEND_API_KEY` | Sender address, e.g. `Agency Starter Kit <no-reply@example.com>` (a domain verified in Resend).                                                          |
| `REQUIRE_EMAIL_VERIFICATION` | No (default `0`)      | Set to `1` to block sign-in until the emailed verification link is clicked.                                                                              |

Password reset works out of the box with no email provider: request a link at `/forgot-password`, copy it from the dev server's stdout, and open it to land on `/reset-password`.

Schema changes live in `packages/database/prisma/migrations/`. After editing
`schema.prisma`, run `bun run cli db:setup` again (or `bunx prisma migrate dev`
from `packages/database/`) to create and apply a new migration. `db:setup` only
seeds the demo users automatically when `DATABASE_URL` points at `localhost`;
against any other host it skips the seed unless you pass `--seed` and set
`SEED_PASSWORD`.

## Deploying

The apps are built for Railway (see [CLAUDE.md](./CLAUDE.md#deployment) for
the service layout), but the database release step is the same anywhere:
apply pending migrations **before** starting the new app version.

```sh
bun run cli db:migrate   # prisma migrate deploy — applies pending migrations, never seeds
```

`db:migrate` reads `DATABASE_URL` from the environment (on Railway, set it on
the service and use the command as the release/pre-deploy step). It is
idempotent — running it against an up-to-date database is a no-op that exits
0 — and it never runs the demo seed, so it is safe to wire into CI and every
deploy. Do not use `db:setup` or `prisma db push` against a production
database: `db:setup` runs `migrate dev`, which can reset a database it finds
out of sync, and `db push` leaves no migration history behind.

## Rebranding / placeholder content

This repo ships with a placeholder "🐔 Stealthy Chicken" demo brand baked into
the UI shell and CLI scaffolder so the apps aren't blank out of the box. It is
**not** meant to ship to production — replace it before launching a real app:

- `package.json` (`name`) — root workspace package name.
- `packages/utils/brand.ts` — the single `BRAND_NAME` constant consumed by
  `@repo/ui`'s `Header`, `Sidebar`, and `Footer`, and by both apps' landing,
  dashboard, and profile route titles. Change the value here to rebrand
  everywhere at once.
- `apps/portal/app/routes/landing.tsx` and `apps/admin/app/routes/landing.tsx`
  — landing page copy (beyond the brand name itself).
- `apps/cli/src/commands/add-route.ts` — the `add:route` scaffolder generates
  new route files that import `BRAND_NAME` from `@repo/utils/brand`, so newly
  scaffolded routes pick up a rebrand automatically.

## Using this example

Clone or use this repo as a GitHub template, then follow
[Local development database](#local-development-database) above to get
running.

## What's inside?

This Turborepo includes the following apps and packages:

### Apps

- `portal`: React Router 7 + Vite customer-facing app (dev port 5520)
- `admin`: React Router 7 + Vite internal admin console (dev port 5510)
- `cli`: Bun + Commander CLI for DB, user, session, and deployment operations

`portal` and `admin` are an intentionally near-identical scaffold pair —
same routes, same auth flow, same shared components — meant as a starting
point to diverge from. See [apps/README.md](./apps/README.md) for the
contract new apps must satisfy and framework quickstarts for adding more.

### Packages

- `@repo/database`: Prisma client + PostgreSQL schema
- `@repo/auth`: Better Auth wrapper shared by both apps
- `@repo/ui`: component library (~52 components) built on Base UI primitives
  with OKLCH design tokens
- `@repo/utils`: small shared helpers
- `@repo/ui-mcp`: standalone MCP server exposing `@repo/ui` to AI assistants
- `@repo/validation`: placeholder for shared validation schemas
- `@repo/eslint-config`: shared `eslint` configuration
- `@repo/typescript-config`: `tsconfig.json`s used throughout the monorepo

Each package and app is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting
- [Playwright](https://playwright.dev) for end-to-end testing
- [Vitest](https://vitest.dev) for unit testing

## Deployment

Each app deploys to its own Railway service. Build, start, health-check, and
restart settings are committed per service in `apps/portal/railway.json` and
`apps/admin/railway.json` (Railpack builder, `GET /health` as the health-check
path, restart on failure). `bun run cli railway:setup` creates the project and
services; then point each service at its file (Service → Settings →
Config-as-code → `apps/<app>/railway.json`) and deploy with
`bun run cli deploy`.

Two environment requirements beyond the usual runtime variables:

- **`DATABASE_URL` is needed at build time.** `turbo run build` runs
  `prisma generate`, which loads `DATABASE_URL` through
  `packages/database/prisma.config.ts` and fails when it is unset. Nothing
  connects during the build, so any well-formed Postgres URL satisfies it,
  but set the real one on the service before the first deploy — Railway
  exposes service variables to the build.
- **`/health` must return 200.** Both apps expose `GET /health`, a
  loader-only resource route that runs `SELECT 1` through `@repo/database`
  and returns `{ "status": "ok" }` (200) or `{ "status": "error" }` (503).
  Railway only routes traffic to a deploy once it passes.

`apps/<app>/Dockerfile` is an equivalent multi-stage image for other hosts or
for checking the production build locally, built from the repo root:

```sh
docker build -f apps/portal/Dockerfile --build-arg DATABASE_URL=postgresql://... .
```

## Where to go next

- [CLAUDE.md](./CLAUDE.md) — commands, architecture, and conventions for
  working in this repo
- [apps/README.md](./apps/README.md) — the contract every app must satisfy,
  plus framework quickstarts (Next.js, Astro, Docusaurus, Vite SPA)
- [docs/apps/](./docs/apps/) — per-framework guides referenced above

## License

[MIT](./LICENSE) — use this template freely for your own projects.
