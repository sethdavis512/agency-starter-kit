/**
 * Regex-based CVA variant extractor.
 *
 * Parses source code of the form:
 *
 *   export const buttonVariants = cva({
 *     base: '...',
 *     variants: {
 *       variant: { primary: '...', secondary: '...' },
 *       size: { sm: '...', md: '...' }
 *     },
 *     defaultVariants: { variant: 'primary', size: 'md' }
 *   });
 *
 * This is intentionally brittle: it relies on the @repo/ui convention of
 * calling cva() at the top level with an object literal. If a component
 * drifts from that shape the parser will return an empty variant map rather
 * than throwing, so callers can still list the component.
 */

export interface CvaDefinition {
    /** Exported name of the variants helper (e.g. `buttonVariants`) */
    exportName: string;
    /** The literal passed to `base:` (if present) */
    base: string | null;
    /** `{ variant: ['primary', 'secondary'], size: ['sm', 'md'] }` */
    variants: Record<string, string[]>;
    /** `{ variant: 'primary', size: 'md' }` */
    defaultVariants: Record<string, string>;
}

/**
 * Find the index of the matching closing brace for an opening brace at
 * `openIndex`. Returns -1 if no match is found. Ignores braces inside
 * single- or double-quoted strings and template literals.
 */
function matchBrace(source: string, openIndex: number): number {
    if (source[openIndex] !== '{') return -1;
    let depth = 0;
    let inString: '"' | "'" | '`' | null = null;
    let escape = false;

    for (let i = openIndex; i < source.length; i++) {
        const ch = source[i];
        if (escape) {
            escape = false;
            continue;
        }
        if (ch === '\\') {
            escape = true;
            continue;
        }
        if (inString) {
            if (ch === inString) inString = null;
            continue;
        }
        if (ch === '"' || ch === "'" || ch === '`') {
            inString = ch;
            continue;
        }
        if (ch === '{') {
            depth++;
        } else if (ch === '}') {
            depth--;
            if (depth === 0) return i;
        }
    }
    return -1;
}

/**
 * Extract the body of a named object property like `variants: { ... }`
 * and return the substring between the outermost braces.
 */
function extractPropertyBody(
    body: string,
    propertyName: string
): string | null {
    const pattern = new RegExp(`\\b${propertyName}\\s*:\\s*\\{`);
    const match = pattern.exec(body);
    if (!match) return null;
    const braceIndex = match.index + match[0].length - 1;
    const closeIndex = matchBrace(body, braceIndex);
    if (closeIndex === -1) return null;
    return body.slice(braceIndex + 1, closeIndex);
}

/**
 * Extract the top-level keys of an object literal body (the substring
 * between its outer `{` and `}`). Handles nested objects, strings, and
 * template literals.
 */
function extractTopLevelKeys(objectBody: string): string[] {
    const keys: string[] = [];
    let depth = 0;
    let inString: '"' | "'" | '`' | null = null;
    let escape = false;
    let i = 0;

    const skipWhitespace = () => {
        while (i < objectBody.length && /\s/.test(objectBody[i]!)) i++;
    };

    const readKey = (): string | null => {
        skipWhitespace();
        if (i >= objectBody.length) return null;
        const ch = objectBody[i]!;

        // Quoted key
        if (ch === '"' || ch === "'") {
            const quote = ch;
            i++;
            let key = '';
            while (i < objectBody.length && objectBody[i] !== quote) {
                key += objectBody[i];
                i++;
            }
            i++; // consume closing quote
            return key;
        }

        // Bare identifier
        const idMatch = /^[A-Za-z_$][\w$]*/.exec(objectBody.slice(i));
        if (!idMatch) return null;
        i += idMatch[0].length;
        return idMatch[0];
    };

    const skipValue = () => {
        // Skip the colon
        skipWhitespace();
        if (objectBody[i] === ':') i++;
        skipWhitespace();

        // Read until the next top-level comma or end
        while (i < objectBody.length) {
            const ch = objectBody[i]!;
            if (escape) {
                escape = false;
                i++;
                continue;
            }
            if (ch === '\\') {
                escape = true;
                i++;
                continue;
            }
            if (inString) {
                if (ch === inString) inString = null;
                i++;
                continue;
            }
            if (ch === '"' || ch === "'" || ch === '`') {
                inString = ch;
                i++;
                continue;
            }
            if (ch === '{' || ch === '[' || ch === '(') {
                depth++;
                i++;
                continue;
            }
            if (ch === '}' || ch === ']' || ch === ')') {
                depth--;
                i++;
                continue;
            }
            if (ch === ',' && depth === 0) {
                i++;
                return;
            }
            i++;
        }
    };

    while (i < objectBody.length) {
        skipWhitespace();
        if (i >= objectBody.length) break;
        const key = readKey();
        if (!key) break;
        keys.push(key);
        skipValue();
    }

    return keys;
}

/**
 * Parse `defaultVariants: { variant: 'primary', size: 'md' }` into a
 * flat key->value record. Only handles string-literal values (which is
 * all the @repo/ui convention uses).
 */
function extractDefaultVariants(
    defaultsBody: string
): Record<string, string> {
    const result: Record<string, string> = {};
    const pattern =
        /(?:^|[,\s{])\s*(["']?)([A-Za-z_$][\w$]*)\1\s*:\s*(["'])((?:\\.|(?!\3).)*)\3/g;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(defaultsBody)) !== null) {
        const key = match[2]!;
        const value = match[4]!;
        result[key] = value;
    }
    return result;
}

/**
 * Find and parse all `cva({ ... })` calls in a source file.
 *
 * Returns one CvaDefinition per `export const NAME = cva({ ... })` found.
 */
export function extractCvaDefinitions(source: string): CvaDefinition[] {
    const definitions: CvaDefinition[] = [];
    // Match `export const foo = cva(` or `const foo = cva(`
    const exportPattern =
        /(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*cva\s*\(\s*\{/g;

    let match: RegExpExecArray | null;
    while ((match = exportPattern.exec(source)) !== null) {
        const exportName = match[1]!;
        // match.index + match[0].length - 1 points at the `{`
        const braceIndex = match.index + match[0].length - 1;
        const closeIndex = matchBrace(source, braceIndex);
        if (closeIndex === -1) continue;

        const body = source.slice(braceIndex + 1, closeIndex);

        // Extract base: 'literal' if present
        const baseMatch =
            /\bbase\s*:\s*(["'])((?:\\.|(?!\1).)*)\1/.exec(body);
        const base = baseMatch ? baseMatch[2]! : null;

        // Extract variants: { ... }
        const variantsBody = extractPropertyBody(body, 'variants');
        const variants: Record<string, string[]> = {};
        if (variantsBody) {
            // Each top-level key is a variant axis (e.g. `variant`, `size`)
            const axisKeys = extractTopLevelKeys(variantsBody);
            for (const axis of axisKeys) {
                const axisBody = extractPropertyBody(variantsBody, axis);
                if (axisBody) {
                    variants[axis] = extractTopLevelKeys(axisBody);
                }
            }
        }

        // Extract defaultVariants: { ... }
        const defaultsBody = extractPropertyBody(body, 'defaultVariants');
        const defaultVariants = defaultsBody
            ? extractDefaultVariants(defaultsBody)
            : {};

        definitions.push({
            exportName,
            base,
            variants,
            defaultVariants
        });
    }

    return definitions;
}
