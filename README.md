# `Turborepo` Vite starter

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

Run the following command:

```sh
npx create-turbo@latest -e with-vite
```

## What's inside?

This Turborepo includes the following packages and apps:

### Apps and Packages

- `docs`: a vanilla [vite](https://vitejs.dev) ts app
- `web`: another vanilla [vite](https://vitejs.dev) ts app
- `@repo/ui`: a stub component & utility library shared by both `web` and `docs` applications
- `@repo/eslint-config`: shared `eslint` configurations
- `@repo/typescript-config`: `tsconfig.json`s used throughout the monorepo

Each package and app is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

## License

[MIT](./LICENSE) — use this template freely for your own projects.
