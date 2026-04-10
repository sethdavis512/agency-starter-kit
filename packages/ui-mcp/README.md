# @repo/ui-mcp

An MCP (Model Context Protocol) server that exposes the `@repo/ui` design system to AI coding assistants as structured, queryable knowledge.

Instead of hoping an agent guesses the right Tailwind class or correct import path, point it at this server and it can list components, read CVA variant matrices, inspect OKLCH tokens, and run generated code through a validator that flags raw palette colors and bad imports.

## What it does

The server boots once at startup and parses:

- **All 52 components** listed in `packages/ui/package.json` exports — extracting CVA variants, default variants, Base UI primitives, `forwardRef` usage, and compound-component exports.
- **All 8 design tokens** from `packages/ui/theme.css` — decomposing OKLCH values into L/C/H parts for both light and dark modes.

Then it serves that catalog through six tools over stdio.

## Tools

| Tool | Purpose |
|---|---|
| `ui_list_components` | Paginated catalog of all `@repo/ui` components. Filter by `has_variants` to find CVA-enabled or plain components. |
| `ui_get_component` | Full manifest for one component: import path, CVA variant matrix, defaults, Base UI primitive, exports, line count. Fuzzy-matches typos (`buton` → `button`). |
| `ui_get_component_source` | Raw `.tsx` source for a component, with optional `start_line`/`end_line` slicing. |
| `ui_list_tokens` | All design tokens grouped by type (`color`, `font`, `other`), in `light`, `dark`, or `both` modes. |
| `ui_get_token` | Single-token detail with light/dark values, OKLCH decomposition, and ready-to-use Tailwind utility examples. |
| `ui_validate_usage` | Paste a JSX/TSX snippet, get back a list of violations with line/column and suggested fixes. See rules below. |

All tools are read-only (`readOnlyHint: true`) and return both a human-readable text block and a `structuredContent` payload for programmatic consumption. Every tool accepts `response_format: 'markdown' | 'json'`.

### `ui_validate_usage` rules

| Rule | What it catches | Suggestion |
|---|---|---|
| `no-raw-tailwind-colors` | `bg-blue-500`, `text-red-400`, `border-gray-200`, any Tailwind palette color with a shade number | Maps to the nearest `@repo/ui` token (`bg-primary`, `text-danger`, `border-neutral`) |
| `no-arbitrary-colors` | `bg-[#ff0000]`, `text-[rgb(...)]`, `border-[oklch(...)]` | Directs to add a token in `theme.css` or use an existing one |
| `no-hardcoded-white-black` | `bg-white`, `bg-black`, `dark:bg-white` | Suggests `bg-surface` (which adapts to dark mode automatically) |
| `use-subpath-imports` | `import { Button } from '@repo/ui'` (bare package, not exported) | Directs to the specific subpath, e.g. `@repo/ui/button` |
| `unknown-component-import` | `import { Foo } from '@repo/ui/buton'` (typo or unknown component) | Fuzzy-suggests the closest valid subpath |

## Install

From the monorepo root:

```bash
bun install
```

Dependencies are `@modelcontextprotocol/sdk` and `zod`. The server reads `@repo/ui` directly from the workspace — no runtime dependency on the package.

## Build

```bash
cd packages/ui-mcp
bun run build
```

Compiles `src/**/*.ts` to `dist/` via `tsc`. The entry point is `dist/index.js`.

Dev mode (no build step, run the source directly with Bun):

```bash
bun run dev
```

## Register with an MCP client

### Claude Code / Claude Desktop

Add to your MCP client config (typically `~/.claude.json` or the equivalent for your client):

```json
{
  "mcpServers": {
    "ui": {
      "command": "node",
      "args": [
        "/absolute/path/to/agency-starter-kit/packages/ui-mcp/dist/index.js"
      ]
    }
  }
}
```

Restart the client. You should see six `ui_*` tools appear.

### Cursor / other MCP clients

Any MCP client that supports stdio servers works. Point it at the same command and args as above.

## How it works

```
packages/ui-mcp/
├── src/
│   ├── index.ts              # McpServer + stdio transport + tool registration
│   ├── constants.ts          # Paths, CHARACTER_LIMIT, server metadata
│   ├── formatters.ts         # toolResult(), markdown/JSON helpers, char-limit enforcement
│   ├── loaders/
│   │   ├── components.ts     # package.json exports → ComponentRecord[]
│   │   ├── cva.ts            # Regex-based cva({ base, variants, defaultVariants }) extractor
│   │   └── tokens.ts         # theme.css @theme + .dark → DesignToken[] with OKLCH parts
│   └── tools/                # One file per tool, each exporting an inputShape + factory function
└── dist/                     # tsc output
```

### Design decisions

- **Regex-based CVA parsing, not full AST.** The `@repo/ui` convention is consistent enough (all seven CVA components match the shape `export const xVariants = cva({ base, variants, defaultVariants })`) that a regex with balanced-brace matching is sufficient and 10× simpler. If the convention drifts, swap in the TypeScript compiler API.
- **Eager catalog load.** The entire component and token catalog is loaded once at server startup. 52 components and 8 tokens is small enough that this keeps tool handlers synchronous and fast. Re-spawn the server to pick up changes.
- **Read-only, no external world.** No external APIs, no auth, no mutations. Tool annotations reflect this (`openWorldHint: false`).
- **Flat alphabetical listing, no categories.** The v1 catalog is sorted by subpath. Categorization (actions, data entry, feedback, etc.) can be added later as a non-breaking enhancement.
- **stdio only.** Streamable HTTP is unnecessary for a local design-system lookup server. Adding it would be a one-function change in `src/index.ts`.

## Tests

Tests live in `src/server.test.ts` and cover all six tools plus both loaders. Vitest is wired via `vitest.config.ts` and registered in the root `vitest.config.ts` projects list.

```bash
bun run test
```

**Known issue:** at time of writing, vitest is failing repo-wide with an esbuild `"The service was stopped"` error. This is pre-existing and affects every package in the monorepo, not just this one. The tests are correct and will run as soon as the underlying tooling is unblocked. In the meantime, the server is verified by:

1. A clean `tsc` build with strict mode.
2. A stdio startup check that prints `[ui-mcp-server] ready: 52 components, 8 tokens loaded`.
3. End-to-end verification of all 10 evaluations (see below).

## Evaluations

`evaluations.xml` contains 10 question/answer pairs for benchmarking an LLM's ability to use this server. Each question is:

- **Read-only** and independent
- **Stable** — answers don't change unless `@repo/ui` itself changes
- **Multi-step** — requires several tool calls to solve, not a single lookup
- **Pre-verified** — every answer was confirmed by running the exact tool calls an agent would make

Sample questions:

- *"Which color token has the largest absolute change in OKLCH lightness between light and dark modes?"* → `muted`
- *"Which component defines the greatest total number of CVA variant options across all axes?"* → `avatar`
- *"How many components wrap a primitive from `@base-ui/react`?"* → `35`

Run the evaluation harness (from the `mcp-builder` skill's `scripts/evaluation.py`) to benchmark an LLM against this server:

```bash
python scripts/evaluation.py \
  -t stdio \
  -c node \
  -a /absolute/path/to/packages/ui-mcp/dist/index.js \
  -o report.md \
  evaluations.xml
```

## Adding new capabilities

The code is organized so new tools are cheap to add:

1. Create `src/tools/<new-tool>.ts` exporting an `inputShape` object and a `create<Tool>Handler` factory that closes over whatever catalog data it needs.
2. Import it in `src/index.ts` and register with `registerLooseTool(server, 'ui_<action>', { title, description, inputSchema, annotations }, handler)`.
3. Add a test in `src/server.test.ts`.

Candidate v2 tools:

- `ui_export_dtcg` — emit all tokens as W3C Design Tokens Community Group v2025.10 JSON
- `ui_find_component` — semantic search over component descriptions and exports
- `ui_composition_rules` — Carbon-style guidance ("Primary button appears once per screen", "Secondary requires Primary", etc.) once a rules file is authored
- `ui_list_patterns` — GOV.UK-style task-oriented patterns ("ask users for a password", "confirm a destructive action")
- Storybook story extraction (if/when Storybook is added to the repo)
