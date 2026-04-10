#!/usr/bin/env node
/**
 * ui-mcp-server
 *
 * An MCP server that exposes the @repo/ui design system as structured,
 * queryable knowledge: components, CVA variants, OKLCH tokens, and a
 * usage validator that flags raw Tailwind colors and invalid imports.
 *
 * Transport: stdio (local only).
 * Registration example (add to your MCP client config):
 *
 *   {
 *     "mcpServers": {
 *       "ui": {
 *         "command": "node",
 *         "args": ["/abs/path/to/packages/ui-mcp/dist/index.js"]
 *       }
 *     }
 *   }
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { z } from 'zod';

import { SERVER_NAME, SERVER_VERSION } from './constants.js';
import { loadComponentCatalog } from './loaders/components.js';
import { loadTokenCatalog } from './loaders/tokens.js';

import {
    listComponentsInputShape,
    createListComponentsHandler
} from './tools/list-components.js';
import {
    getComponentInputShape,
    createGetComponentHandler
} from './tools/get-component.js';
import {
    getComponentSourceInputShape,
    createGetComponentSourceHandler
} from './tools/get-component-source.js';
import {
    listTokensInputShape,
    createListTokensHandler
} from './tools/list-tokens.js';
import {
    getTokenInputShape,
    createGetTokenHandler
} from './tools/get-token.js';
import {
    validateUsageInputShape,
    createValidateUsageHandler
} from './tools/validate-usage.js';

const READ_ONLY_ANNOTATIONS = {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
} as const;

/**
 * Thin wrapper around `server.registerTool` that widens the input schema
 * and handler types to sidestep TS2589 ("type instantiation is excessively
 * deep") errors from the MCP SDK's generic inference on tools with several
 * Zod defaults. Runtime validation still flows through the Zod schema.
 */
type ToolInputShape = Record<string, z.ZodTypeAny>;
interface ToolConfig {
    title: string;
    description: string;
    inputSchema: ToolInputShape;
    annotations: typeof READ_ONLY_ANNOTATIONS;
}

// The handler type is intentionally loose: Zod still validates inputs at
// runtime, and the individual tool handlers carry their own precise types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseHandler = (params: any) => Promise<unknown>;

function registerLooseTool(
    server: McpServer,
    name: string,
    config: ToolConfig,
    handler: LooseHandler
): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (server.registerTool as any)(name, config, handler);
}

async function main() {
    // Load catalogs once at startup. They are small (52 components, 8 tokens)
    // so an eager load keeps tool handlers synchronous and fast.
    const [components, tokens] = await Promise.all([
        loadComponentCatalog(),
        loadTokenCatalog()
    ]);

    const server = new McpServer({
        name: SERVER_NAME,
        version: SERVER_VERSION
    });

    registerLooseTool(
        server,
        'ui_list_components',
        {
            title: 'List @repo/ui components',
            description: `List all components exported by the @repo/ui package.

Returns a paginated catalog derived from packages/ui/package.json exports. Each entry includes the subpath, import path, the Base UI primitive it wraps (if any), and the CVA variant axes it exposes.

Args:
  - limit (number): Maximum components to return, 1-100 (default: 50)
  - offset (number): Skip count for pagination (default: 0)
  - has_variants (boolean, optional): Filter to components with (true) or without (false) CVA variant definitions
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns an object with shape:
  {
    "total": number,
    "count": number,
    "offset": number,
    "components": [
      {
        "name": string,            // Primary export symbol
        "subpath": string,         // e.g. "button"
        "import_path": string,     // e.g. "@repo/ui/button"
        "base_ui_primitive": string | null,
        "has_variants": boolean,
        "variant_axes": string[],  // e.g. ["variant", "size"]
        "exports": string[]
      }
    ],
    "has_more": boolean,
    "next_offset"?: number
  }

Use this tool first to discover what components exist, then call ui_get_component for details on a specific one.`,
            inputSchema: listComponentsInputShape,
            annotations: READ_ONLY_ANNOTATIONS
        },
        createListComponentsHandler(components)
    );

    registerLooseTool(
        server,
        'ui_get_component',
        {
            title: 'Get @repo/ui component details',
            description: `Get the full manifest for a single @repo/ui component, including its CVA variant matrix, default variants, exported symbols, and Base UI primitive.

Args:
  - name (string): Component subpath from package.json exports (e.g. 'button', 'alert-dialog'). Case-insensitive. The primary exported symbol name (e.g. 'Button') also works.
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns an object with shape:
  {
    "subpath": string,
    "import_path": string,
    "file_path": string,
    "base_ui_primitive": string | null,
    "uses_forward_ref": boolean,
    "line_count": number,
    "exports": [{ "name": string, "kind": "function" | "const" | "class" | "reexport" }],
    "cva": [
      {
        "export_name": string,         // e.g. "buttonVariants"
        "base": string | null,         // base Tailwind classes
        "variants": { [axis: string]: string[] },  // e.g. { "variant": ["primary", "secondary"], "size": ["sm", "md"] }
        "default_variants": { [axis: string]: string }
      }
    ]
  }

Use this when you need to know the exact variants a component accepts before writing code that uses it. For the raw source file, use ui_get_component_source.

If no matching component is found, the response includes fuzzy "did you mean" suggestions.`,
            inputSchema: getComponentInputShape,
            annotations: READ_ONLY_ANNOTATIONS
        },
        createGetComponentHandler(components)
    );

    registerLooseTool(
        server,
        'ui_get_component_source',
        {
            title: 'Read @repo/ui component source',
            description: `Read the raw .tsx source of a @repo/ui component, optionally sliced to a line range.

Args:
  - name (string): Component subpath (e.g. 'button', 'dialog')
  - start_line (number, optional): 1-indexed first line to include
  - end_line (number, optional): 1-indexed last line to include (inclusive)

Returns the source with line numbers prefixed. Also returns structured content with:
  { "subpath": string, "start_line": number, "end_line": number, "total_lines": number, "source": string }

Use this when ui_get_component doesn't surface enough detail — for example, to inspect render logic, compound sub-component definitions, or raw className strings used outside CVA.`,
            inputSchema: getComponentSourceInputShape,
            annotations: READ_ONLY_ANNOTATIONS
        },
        createGetComponentSourceHandler(components)
    );

    registerLooseTool(
        server,
        'ui_list_tokens',
        {
            title: 'List @repo/ui design tokens',
            description: `List all OKLCH design tokens defined in packages/ui/theme.css.

Args:
  - type ('color' | 'font' | 'other', optional): Filter by token type
  - mode ('light' | 'dark' | 'both'): Which mode values to include (default: 'both')
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns an object with shape:
  {
    "total": number,
    "mode": "light" | "dark" | "both",
    "type"?: "color" | "font" | "other",
    "tokens": [
      {
        "name": string,                 // e.g. "primary"
        "css_name": string,             // e.g. "--color-primary"
        "type": "color" | "font" | "other",
        "utility_hint": string[],       // e.g. ["bg-primary", "text-primary", ...]
        "light_value"?: string,         // raw CSS value, included when mode is light or both
        "dark_value"?: string | null    // raw CSS value, included when mode is dark or both
      }
    ]
  }

Use this to discover what tokens are available before picking Tailwind utility classes. The tokens available are: primary, secondary, accent, neutral, muted, danger, surface.`,
            inputSchema: listTokensInputShape,
            annotations: READ_ONLY_ANNOTATIONS
        },
        createListTokensHandler(tokens)
    );

    registerLooseTool(
        server,
        'ui_get_token',
        {
            title: 'Get @repo/ui design token details',
            description: `Get detailed information for a single design token: CSS name, type, light/dark values, decomposed OKLCH parts, and ready-to-use Tailwind utility examples.

Args:
  - name (string): Token name. Accepts short form ('primary'), full CSS name ('--color-primary'), or hyphenated forms.
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns an object with shape:
  {
    "name": string,
    "css_name": string,
    "type": "color" | "font" | "other",
    "light": { "value": string, "oklch": { "l": number, "c": number, "h": number } | null },
    "dark":  { "value": string | null, "oklch": { "l": number, "c": number, "h": number } | null },
    "utility_examples": string[]
  }

If no token is found, the response includes a sample of available token names.`,
            inputSchema: getTokenInputShape,
            annotations: READ_ONLY_ANNOTATIONS
        },
        createGetTokenHandler(tokens)
    );

    registerLooseTool(
        server,
        'ui_validate_usage',
        {
            title: 'Validate @repo/ui snippet usage',
            description: `Check a JSX/TSX snippet for @repo/ui design-system violations. This is the single most useful tool in the server for keeping agent-generated code on-brand.

Args:
  - snippet (string): JSX or TSX source to check. Can include import statements.
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Checks performed:
  1. no-raw-tailwind-colors: flags 'bg-blue-500', 'text-red-400', 'border-gray-200' etc. and suggests the nearest @repo/ui token ('bg-primary', 'text-danger', 'border-neutral').
  2. no-arbitrary-colors: flags 'bg-[#ff0000]', 'text-[rgb(...)]', 'border-[oklch(...)]' etc.
  3. no-hardcoded-white-black: flags 'bg-white' and 'bg-black' and suggests 'bg-surface' (which adapts to dark mode).
  4. use-subpath-imports: flags bare 'import ... from @repo/ui' and directs to the correct subpath import.
  5. unknown-component-import: flags '@repo/ui/<typo>' and suggests the closest valid subpath.

Returns an object with shape:
  {
    "snippet_lines": number,
    "violation_count": number,
    "error_count": number,
    "warning_count": number,
    "violations": [
      {
        "line": number,
        "column": number,
        "severity": "error" | "warning" | "info",
        "rule": string,
        "message": string,
        "suggestion": string | null,
        "match": string
      }
    ]
  }

A clean snippet returns violation_count: 0. Use this after writing any new component or page to verify it stays on-theme.`,
            inputSchema: validateUsageInputShape,
            annotations: READ_ONLY_ANNOTATIONS
        },
        createValidateUsageHandler(components, tokens)
    );

    const transport = new StdioServerTransport();
    await server.connect(transport);
    // stdio servers must not log to stdout (stdout is the MCP transport)
    console.error(
        `[${SERVER_NAME}] ready: ${components.length} components, ${tokens.length} tokens loaded`
    );
}

main().catch((error) => {
    console.error('[ui-mcp-server] fatal error:', error);
    process.exit(1);
});
