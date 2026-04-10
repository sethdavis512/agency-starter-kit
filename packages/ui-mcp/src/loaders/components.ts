import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
    UI_PACKAGE_JSON_PATH,
    UI_PACKAGE_PATH
} from '../constants.js';
import { extractCvaDefinitions, type CvaDefinition } from './cva.js';

export interface ComponentExport {
    /** Name as it appears in exported symbols (e.g. 'Button', 'AlertDescription') */
    name: string;
    /** Kind of export: function, const, class, or re-export */
    kind: 'function' | 'const' | 'class' | 'reexport';
}

export interface ComponentRecord {
    /** Subpath key from package.json (e.g. 'button', 'alert-dialog') */
    subpath: string;
    /** Full import path (e.g. '@repo/ui/button') */
    importPath: string;
    /** Absolute path to the source .tsx file */
    filePath: string;
    /** Path relative to `packages/ui/` (e.g. 'components/Button/Button.tsx') */
    relativePath: string;
    /** Base UI primitive imported, if any (e.g. '@base-ui/react/button') */
    baseUiPrimitive: string | null;
    /** All exported symbols from the component's source file */
    exports: ComponentExport[];
    /** CVA variant definitions found in the source */
    cva: CvaDefinition[];
    /** Whether the source contains `React.forwardRef` */
    usesForwardRef: boolean;
    /** Raw source code line count (useful for quick summaries) */
    lineCount: number;
}

const SKIPPED_SUBPATHS = new Set(['utils', 'theme']);

/**
 * Resolve the source file for a package.json export entry.
 *
 * For folder-based components the exports map to an `index.ts` barrel.
 * We follow the barrel to find the actual .tsx implementation file.
 */
async function resolveSourceFile(
    exportValue: string
): Promise<string | null> {
    const absolute = resolve(UI_PACKAGE_PATH, exportValue);

    // If the export already points at a .tsx file, use it directly.
    if (absolute.endsWith('.tsx')) return absolute;

    // Barrel index.ts: read it and look for `export ... from './Component'`
    if (absolute.endsWith('.ts')) {
        try {
            const source = await readFile(absolute, 'utf8');
            const reexport =
                /export\s+(?:\*|\{[^}]*\})\s+from\s+["']\.\/([^"']+)["']/.exec(
                    source
                );
            if (reexport) {
                const dir = absolute.slice(0, absolute.lastIndexOf('/'));
                const tsxPath = resolve(dir, `${reexport[1]!}.tsx`);
                return tsxPath;
            }
        } catch {
            return null;
        }
    }

    return null;
}

/**
 * Extract all exported symbols from a TypeScript source file via regex.
 * Catches `export function`, `export const`, `export class`, and `export { ... }`.
 */
function extractExports(source: string): ComponentExport[] {
    const exports: ComponentExport[] = [];
    const seen = new Set<string>();

    const add = (name: string, kind: ComponentExport['kind']) => {
        if (!seen.has(name)) {
            seen.add(name);
            exports.push({ name, kind });
        }
    };

    // export function Foo
    const fnPattern = /export\s+function\s+([A-Za-z_$][\w$]*)/g;
    let m: RegExpExecArray | null;
    while ((m = fnPattern.exec(source)) !== null) {
        add(m[1]!, 'function');
    }

    // export const Foo
    const constPattern = /export\s+const\s+([A-Za-z_$][\w$]*)/g;
    while ((m = constPattern.exec(source)) !== null) {
        add(m[1]!, 'const');
    }

    // export class Foo
    const classPattern = /export\s+class\s+([A-Za-z_$][\w$]*)/g;
    while ((m = classPattern.exec(source)) !== null) {
        add(m[1]!, 'class');
    }

    // export { Foo, Bar as Baz } (possibly from '...')
    const reexportPattern = /export\s*\{([^}]+)\}/g;
    while ((m = reexportPattern.exec(source)) !== null) {
        const inner = m[1]!;
        for (const part of inner.split(',')) {
            const trimmed = part.trim();
            if (!trimmed) continue;
            // Handle `Foo as Bar` → we want the exported name (Bar)
            const asMatch = /^([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)/.exec(
                trimmed
            );
            const name = asMatch ? asMatch[2]! : trimmed;
            if (/^[A-Za-z_$][\w$]*$/.test(name) && name !== 'type') {
                add(name, 'reexport');
            }
        }
    }

    return exports;
}

/**
 * Find the first `@base-ui/react/*` import in a source file.
 * Returns the module specifier (e.g. `@base-ui/react/button`) or null.
 */
function findBaseUiPrimitive(source: string): string | null {
    const match = /from\s+["'](@base-ui\/react\/[^"']+)["']/.exec(source);
    return match ? match[1]! : null;
}

interface PackageJsonShape {
    exports?: Record<string, string>;
}

/**
 * Build the full component catalog by reading packages/ui/package.json
 * exports and loading each source file.
 */
export async function loadComponentCatalog(): Promise<ComponentRecord[]> {
    const pkgRaw = await readFile(UI_PACKAGE_JSON_PATH, 'utf8');
    const pkg = JSON.parse(pkgRaw) as PackageJsonShape;
    const exports = pkg.exports ?? {};

    const records: ComponentRecord[] = [];

    for (const [key, value] of Object.entries(exports)) {
        // Export keys look like './button'; strip the leading './'
        const subpath = key.replace(/^\.\//, '');
        if (SKIPPED_SUBPATHS.has(subpath)) continue;
        if (typeof value !== 'string') continue;

        const filePath = await resolveSourceFile(value);
        if (!filePath) continue;

        let source: string;
        try {
            source = await readFile(filePath, 'utf8');
        } catch {
            continue;
        }

        const relativePath = filePath
            .replace(`${UI_PACKAGE_PATH}/`, '')
            .replace(UI_PACKAGE_PATH, '');

        records.push({
            subpath,
            importPath: `@repo/ui/${subpath}`,
            filePath,
            relativePath,
            baseUiPrimitive: findBaseUiPrimitive(source),
            exports: extractExports(source),
            cva: extractCvaDefinitions(source),
            usesForwardRef: /React\.forwardRef\b|\bforwardRef\b/.test(source),
            lineCount: source.split('\n').length
        });
    }

    // Sort alphabetically by subpath for a stable listing
    records.sort((a, b) => a.subpath.localeCompare(b.subpath));
    return records;
}

/**
 * Read the raw source for a component by subpath.
 * Returns null if the subpath is unknown.
 */
export async function readComponentSource(
    catalog: ComponentRecord[],
    subpath: string
): Promise<string | null> {
    const record = catalog.find((r) => r.subpath === subpath);
    if (!record) return null;
    try {
        return await readFile(record.filePath, 'utf8');
    } catch {
        return null;
    }
}
