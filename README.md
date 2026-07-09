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

bun run cli db:setup   # generate Prisma client + push schema + seed
bun run dev
```

Docker is optional — if you already have a `DATABASE_URL`, skip `db:up` and just set it in the three `.env` files. Stop the local database with `bun run db:down` (data persists in a named volume).

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

## Where to go next

- [CLAUDE.md](./CLAUDE.md) — commands, architecture, and conventions for
  working in this repo
- [apps/README.md](./apps/README.md) — the contract every app must satisfy,
  plus framework quickstarts (Next.js, Astro, Docusaurus, Vite SPA)
- [docs/apps/](./docs/apps/) — per-framework guides referenced above

## License

[MIT](./LICENSE) — use this template freely for your own projects.
