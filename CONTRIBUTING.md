# Contributing

This repo is a **template** — a starting point meant to be forked or used
via `create-turbo` (see the [README](./README.md)), not a shared library
with a single canonical deployment. If you've used this kit to start your
own project, you own that copy: there's no expectation you'll upstream your
changes, and no obligation for this repo to track your fork.

## When a pull request makes sense

PRs against this repo are welcome for things that improve the template
itself:

- Bug fixes in the scaffolding (broken imports, misconfigured tooling,
  incorrect docs/commands)
- Fixes to shared packages (`packages/*`) that both `portal` and `admin`
  depend on
- Small, focused improvements to developer experience (setup steps, CLI
  commands, CI)

PRs are not the right vehicle for product-specific features, business logic,
or anything specific to how you're using your fork — build that in your own
copy instead.

## Before opening a PR

1. Run the checks that CI runs:
   ```bash
   bun run typecheck
   bun run lint
   bun run test
   bun run build
   ```
2. If your change touches app behavior, run the e2e suite for the affected
   app: `bun run e2e:portal` or `bun run e2e:admin`.
3. Keep the diff scoped to the fix — this is a shared template, so unrelated
   refactors make review harder for something other people are about to
   fork.

## License

By contributing, you agree that your contributions will be licensed under
the [MIT License](./LICENSE) that covers this project.
