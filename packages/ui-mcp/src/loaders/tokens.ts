import { readFile } from 'node:fs/promises';
import { UI_THEME_PATH } from '../constants.js';

export type TokenType = 'color' | 'font' | 'other';

export interface OklchParts {
    /** Lightness (0-1 or percentage string from source, normalized to 0-1) */
    l: number;
    /** Chroma */
    c: number;
    /** Hue in degrees */
    h: number;
}

export interface DesignToken {
    /** The full CSS custom property name including the leading `--` (e.g. `--color-primary`) */
    cssName: string;
    /** The short name after the type prefix (e.g. `primary`) */
    name: string;
    /** Token type derived from the prefix */
    type: TokenType;
    /** Light mode value exactly as written in the source */
    lightValue: string;
    /** Dark mode value exactly as written in the source (if overridden) */
    darkValue: string | null;
    /** Decomposed OKLCH parts for light mode (if parseable) */
    lightOklch: OklchParts | null;
    /** Decomposed OKLCH parts for dark mode (if parseable) */
    darkOklch: OklchParts | null;
}

/**
 * Extract the body of a CSS block opened by a given selector/at-rule.
 * Supports `@theme { ... }` and `.dark { ... }`.
 */
function extractBlock(source: string, header: RegExp): string | null {
    const match = header.exec(source);
    if (!match) return null;

    // Find the opening brace after the match
    const start = match.index + match[0].length;
    const braceOpen = source.indexOf('{', start);
    if (braceOpen === -1) return null;

    // Walk to matching brace (no string handling needed for CSS)
    let depth = 0;
    for (let i = braceOpen; i < source.length; i++) {
        const ch = source[i];
        if (ch === '{') depth++;
        else if (ch === '}') {
            depth--;
            if (depth === 0) return source.slice(braceOpen + 1, i);
        }
    }
    return null;
}

/**
 * Parse custom property declarations inside a CSS block body.
 * Returns a map of `--name` → value string.
 */
function parseCustomProperties(body: string): Map<string, string> {
    const result = new Map<string, string>();
    // Match `--name: value;` allowing for function calls like oklch(...) or var(...)
    const pattern = /(--[A-Za-z0-9_-]+)\s*:\s*([^;]+);/g;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(body)) !== null) {
        result.set(match[1]!, match[2]!.trim());
    }
    return result;
}

/**
 * Attempt to parse an `oklch(L C H)` or `oklch(L% C H)` value.
 * Returns null for non-oklch values (e.g. hex, keyword colors).
 */
function parseOklch(value: string): OklchParts | null {
    const match = /oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)\s*\)/.exec(
        value
    );
    if (!match) return null;
    const lRaw = parseFloat(match[1]!);
    const isPercent = match[2] === '%';
    const l = isPercent ? lRaw / 100 : lRaw;
    const c = parseFloat(match[3]!);
    const h = parseFloat(match[4]!);
    return { l, c, h };
}

/**
 * Classify a CSS custom property by its prefix.
 */
function classifyToken(cssName: string): {
    type: TokenType;
    shortName: string;
} {
    if (cssName.startsWith('--color-')) {
        return { type: 'color', shortName: cssName.slice('--color-'.length) };
    }
    if (cssName.startsWith('--font-')) {
        return { type: 'font', shortName: cssName.slice('--font-'.length) };
    }
    return { type: 'other', shortName: cssName.slice(2) };
}

/**
 * Load and parse the @repo/ui theme.css file into a structured token list.
 */
export async function loadTokenCatalog(): Promise<DesignToken[]> {
    const source = await readFile(UI_THEME_PATH, 'utf8');

    const themeBody = extractBlock(source, /@theme\b/);
    // Use a lookahead for `{` so we skip occurrences inside @custom-variant
    // selector literals like `@custom-variant dark (&:where(.dark, .dark *))`.
    const darkBody = extractBlock(source, /\.dark(?=\s*\{)/);

    const lightProps = themeBody
        ? parseCustomProperties(themeBody)
        : new Map<string, string>();
    const darkProps = darkBody
        ? parseCustomProperties(darkBody)
        : new Map<string, string>();

    const tokens: DesignToken[] = [];

    // Build from the light-mode set (it's the source of truth for what exists)
    for (const [cssName, lightValue] of lightProps) {
        const { type, shortName } = classifyToken(cssName);
        const darkValue = darkProps.get(cssName) ?? null;
        tokens.push({
            cssName,
            name: shortName,
            type,
            lightValue,
            darkValue,
            lightOklch: parseOklch(lightValue),
            darkOklch: darkValue ? parseOklch(darkValue) : null
        });
    }

    // Sort: colors first (grouped), then fonts, then other; alpha within group
    const typeOrder: Record<TokenType, number> = {
        color: 0,
        font: 1,
        other: 2
    };
    tokens.sort((a, b) => {
        const byType = typeOrder[a.type] - typeOrder[b.type];
        if (byType !== 0) return byType;
        return a.name.localeCompare(b.name);
    });

    return tokens;
}
