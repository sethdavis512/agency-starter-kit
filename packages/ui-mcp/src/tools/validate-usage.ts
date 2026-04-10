import { z } from 'zod';
import type { ComponentRecord } from '../loaders/components.js';
import type { DesignToken } from '../loaders/tokens.js';
import {
    ResponseFormatValues,
    type ResponseFormat,
    formatJson,
    toolResult
} from '../formatters.js';

export const validateUsageInputShape = {
    snippet: z
        .string()
        .min(1)
        .max(20_000)
        .describe(
            'JSX or TSX source to check for @repo/ui design-system violations. Can include import statements.'
        ),
    response_format: z
        .enum(ResponseFormatValues)
        .default('markdown')
        .describe(
            "Output format: 'markdown' for human-readable or 'json' for machine-readable"
        )
};

type ValidateUsageInput = {
    snippet: string;
    response_format: ResponseFormat;
};

type Severity = 'error' | 'warning' | 'info';

interface Violation {
    line: number;
    column: number;
    severity: Severity;
    rule: string;
    message: string;
    suggestion: string | null;
    match: string;
}

/**
 * The full Tailwind default color palette. Using any of these with a
 * numeric shade (e.g. `bg-blue-500`) indicates a raw palette color
 * instead of a design token.
 *
 * Note: 'neutral' is excluded because @repo/ui defines a `neutral`
 * TOKEN. A raw `bg-neutral-500` would still be flagged via the number
 * suffix check below, but the shadeless `bg-neutral` is valid.
 */
const RAW_TAILWIND_COLORS = [
    'slate',
    'gray',
    'zinc',
    'stone',
    'red',
    'orange',
    'amber',
    'yellow',
    'lime',
    'green',
    'emerald',
    'teal',
    'cyan',
    'sky',
    'blue',
    'indigo',
    'violet',
    'purple',
    'fuchsia',
    'pink',
    'rose',
    'neutral'
];

const UTILITY_PREFIXES = [
    'bg',
    'text',
    'border',
    'ring',
    'ring-offset',
    'divide',
    'outline',
    'fill',
    'stroke',
    'from',
    'via',
    'to',
    'accent',
    'caret',
    'decoration',
    'placeholder',
    'shadow'
];

interface TailwindMatch {
    utility: string;
    color: string;
    shade: string;
    fullMatch: string;
    index: number;
}

function findRawTailwindColors(snippet: string): TailwindMatch[] {
    const results: TailwindMatch[] = [];
    const colorGroup = RAW_TAILWIND_COLORS.join('|');
    const utilGroup = UTILITY_PREFIXES.join('|');
    // Matches `bg-blue-500`, `hover:text-red-400`, `dark:bg-gray-900`, etc.
    const pattern = new RegExp(
        `(?<![\\w-])(?:[a-z:]+:)?(${utilGroup})-(${colorGroup})-(\\d{2,3})(?![\\w-])`,
        'g'
    );
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(snippet)) !== null) {
        results.push({
            utility: match[1]!,
            color: match[2]!,
            shade: match[3]!,
            fullMatch: match[0]!,
            index: match.index
        });
    }
    return results;
}

function findArbitraryColorValues(snippet: string): RegExpExecArray[] {
    const results: RegExpExecArray[] = [];
    // Matches `bg-[#ff0000]`, `text-[rgb(0,0,0)]`, `border-[hsl(...)]`
    const pattern =
        /(?<![\w-])(?:[a-z:]+:)?(?:bg|text|border|ring|fill|stroke|divide|outline)-\[(?:#[0-9a-fA-F]{3,8}|rgba?\([^\]]+\)|hsla?\([^\]]+\)|oklch\([^\]]+\))\]/g;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(snippet)) !== null) {
        results.push(match);
    }
    return results;
}

function findBgWhiteBlack(snippet: string): RegExpExecArray[] {
    const results: RegExpExecArray[] = [];
    // Matches `bg-white`, `bg-black`, `dark:bg-white` etc.
    const pattern =
        /(?<![\w-])(?:[a-z:]+:)?bg-(white|black)(?![\w-])/g;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(snippet)) !== null) {
        results.push(match);
    }
    return results;
}

function findUiImports(snippet: string): RegExpExecArray[] {
    const results: RegExpExecArray[] = [];
    const pattern =
        /import\s+(?:type\s+)?(?:\{[^}]+\}|[A-Za-z_$][\w$]*)\s+from\s+["'](@repo\/ui(?:\/[^"']+)?)["']/g;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(snippet)) !== null) {
        results.push(match);
    }
    return results;
}

function indexToLineColumn(
    snippet: string,
    index: number
): { line: number; column: number } {
    let line = 1;
    let column = 1;
    for (let i = 0; i < index && i < snippet.length; i++) {
        if (snippet[i] === '\n') {
            line++;
            column = 1;
        } else {
            column++;
        }
    }
    return { line, column };
}

/**
 * Levenshtein distance for fuzzy import-path suggestions.
 */
function levenshtein(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    const dp: number[] = new Array(n + 1);
    for (let j = 0; j <= n; j++) dp[j] = j;
    for (let i = 1; i <= m; i++) {
        let prev = dp[0]!;
        dp[0] = i;
        for (let j = 1; j <= n; j++) {
            const tmp = dp[j]!;
            dp[j] =
                a[i - 1] === b[j - 1]
                    ? prev
                    : 1 + Math.min(prev, dp[j]!, dp[j - 1]!);
            prev = tmp;
        }
    }
    return dp[n]!;
}

/**
 * Suggest a token replacement for a raw Tailwind color.
 * This is intentionally approximate — the goal is to push agents
 * toward tokens, not to match exact brand colors.
 */
function suggestTokenForRawColor(
    color: string,
    utility: string,
    tokens: DesignToken[]
): string {
    // Map color families to tokens based on hue category.
    // The @repo/ui tokens by hue: primary (indigo), accent (green),
    // secondary (coral/orange), danger (red), neutral/muted (gray).
    const familyMap: Record<string, string> = {
        slate: 'neutral',
        gray: 'neutral',
        zinc: 'neutral',
        stone: 'neutral',
        neutral: 'neutral',
        red: 'danger',
        orange: 'secondary',
        amber: 'secondary',
        yellow: 'secondary',
        lime: 'accent',
        green: 'accent',
        emerald: 'accent',
        teal: 'accent',
        cyan: 'accent',
        sky: 'primary',
        blue: 'primary',
        indigo: 'primary',
        violet: 'primary',
        purple: 'primary',
        fuchsia: 'secondary',
        pink: 'secondary',
        rose: 'danger'
    };
    const suggested = familyMap[color];
    if (!suggested) return '';
    // Confirm the suggested token actually exists
    if (!tokens.some((t) => t.name === suggested && t.type === 'color')) {
        return '';
    }
    return `${utility}-${suggested}`;
}

export function createValidateUsageHandler(
    catalog: ComponentRecord[],
    tokens: DesignToken[]
) {
    const validSubpaths = new Set(catalog.map((c) => c.subpath));
    const validComponentNames = new Set(
        catalog.flatMap((c) => c.exports.map((e) => e.name))
    );

    return async (params: ValidateUsageInput) => {
        const violations: Violation[] = [];
        const snippet = params.snippet;

        // Rule 1: raw Tailwind palette colors with shades
        for (const m of findRawTailwindColors(snippet)) {
            const { line, column } = indexToLineColumn(snippet, m.index);
            const suggested = suggestTokenForRawColor(
                m.color,
                m.utility,
                tokens
            );
            violations.push({
                line,
                column,
                severity: 'error',
                rule: 'no-raw-tailwind-colors',
                message: `Raw Tailwind color '${m.fullMatch}' — use a @repo/ui token instead. The theme adapts to light/dark; raw palette colors do not.`,
                suggestion: suggested
                    ? `Replace with \`${suggested}\``
                    : 'Use one of: bg-primary, bg-secondary, bg-accent, bg-neutral, bg-muted, bg-danger, bg-surface',
                match: m.fullMatch
            });
        }

        // Rule 2: arbitrary color values
        for (const m of findArbitraryColorValues(snippet)) {
            const { line, column } = indexToLineColumn(snippet, m.index);
            violations.push({
                line,
                column,
                severity: 'error',
                rule: 'no-arbitrary-colors',
                message: `Arbitrary color value '${m[0]}'. Hard-coded colors bypass the token system and break dark mode.`,
                suggestion:
                    'Use a token utility like `bg-primary`, or add a new token in packages/ui/theme.css if one is missing.',
                match: m[0]
            });
        }

        // Rule 3: bg-white / bg-black
        for (const m of findBgWhiteBlack(snippet)) {
            const { line, column } = indexToLineColumn(snippet, m.index);
            violations.push({
                line,
                column,
                severity: 'error',
                rule: 'no-hardcoded-white-black',
                message: `'${m[0]}' — prefer \`bg-surface\`, which adapts to dark mode automatically.`,
                suggestion: 'Replace with `bg-surface`',
                match: m[0]
            });
        }

        // Rule 4 & 5: @repo/ui imports
        for (const m of findUiImports(snippet)) {
            const importPath = m[1]!;
            const { line, column } = indexToLineColumn(snippet, m.index);
            if (importPath === '@repo/ui') {
                violations.push({
                    line,
                    column,
                    severity: 'error',
                    rule: 'use-subpath-imports',
                    message: `Bare \`@repo/ui\` is not an exported entry point. Use a subpath import for the specific component.`,
                    suggestion:
                        "e.g. `import { Button } from '@repo/ui/button'`",
                    match: importPath
                });
                continue;
            }
            const subpath = importPath.slice('@repo/ui/'.length);
            if (subpath === 'utils' || subpath === 'theme') continue;
            if (!validSubpaths.has(subpath)) {
                // Fuzzy suggestion
                const candidates = [...validSubpaths]
                    .map((s) => ({ s, d: levenshtein(s, subpath) }))
                    .sort((a, b) => a.d - b.d)
                    .slice(0, 3)
                    .filter((c) => c.d <= 4)
                    .map((c) => `@repo/ui/${c.s}`);
                violations.push({
                    line,
                    column,
                    severity: 'error',
                    rule: 'unknown-component-import',
                    message: `'${importPath}' is not a valid @repo/ui export.`,
                    suggestion:
                        candidates.length > 0
                            ? `Did you mean: ${candidates.map((c) => `\`${c}\``).join(', ')}?`
                            : 'Call ui_list_components to see all available components.',
                    match: importPath
                });
            }
        }

        const output = {
            snippet_lines: snippet.split('\n').length,
            violation_count: violations.length,
            error_count: violations.filter((v) => v.severity === 'error')
                .length,
            warning_count: violations.filter(
                (v) => v.severity === 'warning'
            ).length,
            violations
        };

        let text: string;
        if (params.response_format === 'json') {
            text = formatJson(output);
        } else {
            if (violations.length === 0) {
                text = [
                    '# Validation: clean',
                    '',
                    `No @repo/ui design-system violations found across ${output.snippet_lines} lines.`,
                    '',
                    '_Checks performed: raw Tailwind palette colors, arbitrary color values, hard-coded bg-white/bg-black, invalid @repo/ui imports._'
                ].join('\n');
            } else {
                const lines: string[] = [
                    `# Validation: ${output.error_count} error${output.error_count === 1 ? '' : 's'}, ${output.warning_count} warning${output.warning_count === 1 ? '' : 's'}`,
                    ''
                ];
                for (const v of violations) {
                    lines.push(
                        `## ${v.severity.toUpperCase()} at line ${v.line}, col ${v.column} — \`${v.rule}\``
                    );
                    lines.push('');
                    lines.push(v.message);
                    if (v.suggestion) lines.push('');
                    if (v.suggestion) lines.push(`**Fix**: ${v.suggestion}`);
                    lines.push('');
                }
                text = lines.join('\n');
            }
        }

        // validComponentNames is included in scope in case future rules
        // want to check JSX element usage against the catalog.
        void validComponentNames;

        return toolResult(text, output);
    };
}
