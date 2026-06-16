<!--
SYNC IMPACT REPORT
==================
Version change: (uninitialized template) → 1.0.0
Bump rationale: Initial ratification — template placeholders replaced with concrete,
project-specific principles. MAJOR by convention for first adoption.

Modified principles (placeholder → concrete):
  - [PRINCIPLE_1_NAME] → I. Type-Safe Full-Stack Contracts
  - [PRINCIPLE_2_NAME] → II. Server & Data Boundary Isolation
  - [PRINCIPLE_3_NAME] → III. Design System Discipline
  - [PRINCIPLE_4_NAME] → IV. Test Coverage Across Layers (NON-NEGOTIABLE)
  - [PRINCIPLE_5_NAME] → V. Monorepo Modularity & Simplicity

Added sections:
  - Technology Constraints (was [SECTION_2_NAME])
  - Development Workflow & Quality Gates (was [SECTION_3_NAME])

Removed sections: none

Templates requiring updates:
  - .specify/templates/plan-template.md ✅ aligned (Constitution Check defers to this file; no edit needed)
  - .specify/templates/spec-template.md ✅ aligned (generic; no constitution-specific edit needed)
  - .specify/templates/tasks-template.md ✅ aligned (generic; tests remain opt-in per spec)
  - CLAUDE.md ✅ aligned (referenced as runtime guidance in Governance)

Follow-up TODOs: none — RATIFICATION_DATE set to first adoption date (2026-06-15).
-->

# Agency Starter Kit Constitution

## Core Principles

### I. Type-Safe Full-Stack Contracts

TypeScript strict mode is the law from request to render; implicit `any` and hand-typed
framework contracts are prohibited.

- Route `loader`/`action` argument and return types MUST be imported from the generated
  `./+types/<route-name>` module (`Route.LoaderArgs`, `Route.ActionArgs`,
  `Route.ComponentProps`) — never hand-written.
- Components MUST read data through props (`{ loaderData }: Route.ComponentProps`), not
  `useLoaderData` / `useActionData`.
- All external input (form data, search params, request bodies, env-derived values) MUST be
  validated with Zod schemas before use.

**Rationale**: Generated types and schema validation move integration failures to build time
instead of production, which is the entire point of a typed full-stack framework.

### II. Server & Data Boundary Isolation

Data access and sensitive logic live behind a server-only boundary; clients never touch the
database layer directly.

- The Prisma client MUST be imported only inside `*.server.ts` model files (within
  `@repo/database`), never in routes, components, or client code.
- DB queries and sensitive logic MUST live in `*.server.ts` model files; loaders/actions call
  those functions rather than querying Prisma inline.
- Server functions MUST return typed, mapped shapes — not raw Prisma models.
- Auth checks MUST use the shared `getUserFromSession` / `requireUser` pattern consistently.
- Schema changes MUST prefer Prisma enums for fixed value sets and soft deletes
  (`deletedAt DateTime?`) over hard deletes. `prisma migrate` and `prisma db push` MUST NOT be
  run without explicit human approval; regenerate the client (`prisma generate`) after schema
  changes.

**Rationale**: A single, server-only data boundary prevents credential and query leakage to
the client and keeps domain logic testable and reusable across apps.

### III. Design System Discipline

User interface is composed from the shared `@repo/ui` system, not ad-hoc markup and colors.

- Reach for a Base UI primitive (`@base-ui/react`) before building from raw HTML; use plain
  elements only when no primitive exists.
- Styling MUST use the OKLCH design tokens (`primary`, `secondary`, `accent`, `neutral`,
  `muted`, `danger`, `surface`). Raw Tailwind palette colors (e.g. `blue-500`), arbitrary
  color values (hex/rgb/hsl), and `bg-white` / `bg-black` are prohibited; use `bg-surface`.
- Components MUST use named function declarations and named exports (no default exports), merge
  classes with `cn()`, and use `forwardRef` only when DOM ref access is required (with
  `displayName` set). Prefer CVA for variant-driven styling and `lucide-react` for icons.
- A new `@repo/ui` component MUST register its subpath in the package `exports` map.

**Rationale**: A token-driven, primitive-backed system gives consistent theming (including dark
mode) and accessibility for free, and keeps every app visually and behaviorally coherent.

### IV. Test Coverage Across Layers (NON-NEGOTIABLE)

Behavior is protected by tests at the layer that matches the risk, and tests are a source of
truth — not an obstacle to route around.

- Unit and integration tests MUST use vitest (`describe`/`it`/`expect`/`vi`); jest is
  prohibited. Test files MUST be co-located next to the code they cover (no `__tests__/`).
- Integration tests are preferred over heavily mocked unit tests.
- End-to-end flows MUST be covered by Playwright per app (`portal`, `admin`).
- A failing test MUST be fixed or its cause surfaced — never rewritten merely to pass.

**Rationale**: Co-located, integration-leaning tests catch real regressions across the typed
boundary, and treating red tests as signal (not noise) keeps the suite trustworthy.

### V. Monorepo Modularity & Simplicity

Shared capability lives in packages; complexity must earn its place.

- Reusable logic MUST live in `packages/*` and be consumed via workspace packages. App-to-app
  imports are prohibited; apps depend only on shared packages.
- Turbo orchestrates the graph; `^build` dependencies (e.g. `prisma generate` before app
  builds) MUST be respected. `build`, `typecheck`, `lint`, and `test` are the merge gates.
- YAGNI applies: start simple, keep diffs minimal, and leave touched code better than found. Do
  NOT add dependencies, abstractions, error handling, or validation beyond what the task
  requires; new runtime dependencies require explicit approval.
- Prose and documentation MUST NOT use em dashes or double-hyphen (` -- `) separators.

**Rationale**: Clear package boundaries and a bias toward simplicity keep the starter kit easy
to extend, review, and reuse across client projects.

## Technology Constraints

- **Runtime & tooling**: Bun is the package manager and script runner; Turborepo orchestrates
  the workspace (`apps/*`, `packages/*`).
- **Apps**: `portal` and `admin` are React Router 7 + Vite + Tailwind v4 apps with SSR enabled.
  `cli` is a Commander.js tool compiled with `bun build --compile`.
- **Routing**: Config-based routing in `app/routes.ts`; the `~/` alias maps to `app/`.
- **Data**: PostgreSQL via Prisma, exported as a singleton from `@repo/database`.
- **Styling**: Tailwind v4 with each app's `app.css` importing `tailwindcss`, the UI
  `theme.css`, and a `@source` directive pointing at `packages/ui`.
- **Deployment**: Railway, one service per app, with watch paths scoped to that app plus
  `packages/**`.

## Development Workflow & Quality Gates

- Every change MUST keep `bun run build`, `typecheck`, `bun run lint`, and `bun run test`
  green before merge; e2e (`bun run e2e`) MUST pass for changes affecting user-facing flows.
- Cleanup and refactors SHOULD be committed separately from feature work to keep diffs
  reviewable. Cleanup MUST NOT be committed unprompted.
- Documentation MUST be updated only when a change makes existing docs wrong (not merely
  incomplete); new docs are not created unprompted.
- Outward-facing or hard-to-reverse actions (deploys, destructive DB operations, publishing)
  require explicit confirmation unless already authorized.

## Governance

This constitution supersedes ad-hoc practice. When guidance here conflicts with convenience,
this document wins.

- **Amendments**: Changes MUST be made through an update to this file with a Sync Impact Report,
  a version bump per the policy below, and propagation to any dependent templates and runtime
  guidance.
- **Versioning policy**: Semantic versioning of governance. MAJOR for backward-incompatible
  principle removals or redefinitions; MINOR for a new principle/section or materially expanded
  guidance; PATCH for clarifications and non-semantic refinements.
- **Compliance review**: All PRs and reviews MUST verify compliance with these principles.
  Deviations MUST be justified in the plan's Complexity Tracking section or rejected.
- **Runtime guidance**: `CLAUDE.md` and the `.claude/rules/*` files provide day-to-day
  development guidance and MUST stay consistent with this constitution.

**Version**: 1.0.0 | **Ratified**: 2026-06-15 | **Last Amended**: 2026-06-15
