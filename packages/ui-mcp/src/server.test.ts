import { describe, it, expect, beforeAll } from 'vitest';
import { loadComponentCatalog, type ComponentRecord } from './loaders/components.ts';
import { loadTokenCatalog, type DesignToken } from './loaders/tokens.ts';
import { createListComponentsHandler } from './tools/list-components.ts';
import { createGetComponentHandler } from './tools/get-component.ts';
import { createGetComponentSourceHandler } from './tools/get-component-source.ts';
import { createListTokensHandler } from './tools/list-tokens.ts';
import { createGetTokenHandler } from './tools/get-token.ts';
import { createValidateUsageHandler } from './tools/validate-usage.ts';

function extractText(result: {
    content: Array<{ type: string; text: string }>;
}): string {
    return result.content[0]?.text ?? '';
}

function extractStructured<T>(result: { structuredContent?: T }): T {
    if (!result.structuredContent) {
        throw new Error('Expected structuredContent on tool result');
    }
    return result.structuredContent;
}

describe('ui-mcp-server', () => {
    let components: ComponentRecord[];
    let tokens: DesignToken[];

    beforeAll(async () => {
        [components, tokens] = await Promise.all([
            loadComponentCatalog(),
            loadTokenCatalog()
        ]);
    });

    describe('loaders', () => {
        it('loads the full @repo/ui component catalog', () => {
            expect(components.length).toBeGreaterThanOrEqual(50);
            expect(components.find((c) => c.subpath === 'button')).toBeDefined();
            expect(components.find((c) => c.subpath === 'dialog')).toBeDefined();
        });

        it('loads all theme.css tokens with OKLCH decomposition', () => {
            expect(tokens.length).toBeGreaterThanOrEqual(7);
            const primary = tokens.find((t) => t.name === 'primary');
            expect(primary).toBeDefined();
            expect(primary!.type).toBe('color');
            expect(primary!.lightOklch).not.toBeNull();
            expect(primary!.darkOklch).not.toBeNull();
        });

        it('extracts CVA variant matrices from Button source', () => {
            const button = components.find((c) => c.subpath === 'button')!;
            expect(button.cva).toHaveLength(1);
            const def = button.cva[0]!;
            expect(def.exportName).toBe('buttonVariants');
            expect(def.variants.variant).toContain('primary');
            expect(def.variants.variant).toContain('destructive');
            expect(def.variants.size).toEqual(['sm', 'md', 'lg']);
            expect(def.defaultVariants).toEqual({
                variant: 'primary',
                size: 'md'
            });
        });

        it('handles compound components (Dialog) with no CVA', () => {
            const dialog = components.find((c) => c.subpath === 'dialog')!;
            expect(dialog.cva).toHaveLength(0);
            const names = dialog.exports.map((e) => e.name);
            expect(names).toContain('DialogRoot');
            expect(names).toContain('DialogPopup');
        });
    });

    describe('ui_list_components', () => {
        it('returns paginated results with structured content', async () => {
            const handler = createListComponentsHandler(components);
            const out = await handler({
                limit: 50,
                offset: 0,
                response_format: 'markdown'
            });
            const structured = extractStructured<{
                total: number;
                count: number;
                components: unknown[];
            }>(out);
            expect(structured.total).toBe(components.length);
            expect(structured.components.length).toBeGreaterThan(0);
        });

        it('filters by has_variants=true', async () => {
            const handler = createListComponentsHandler(components);
            const out = await handler({
                limit: 100,
                offset: 0,
                has_variants: true,
                response_format: 'json'
            });
            const structured = extractStructured<{
                components: Array<{ has_variants: boolean }>;
            }>(out);
            expect(structured.components.length).toBeGreaterThan(0);
            expect(
                structured.components.every((c) => c.has_variants === true)
            ).toBe(true);
        });
    });

    describe('ui_get_component', () => {
        it('returns full manifest for button', async () => {
            const handler = createGetComponentHandler(components);
            const out = await handler({
                name: 'button',
                response_format: 'json'
            });
            const structured = extractStructured<{
                subpath: string;
                cva: Array<{
                    export_name: string;
                    variants: Record<string, string[]>;
                    default_variants: Record<string, string>;
                }>;
            }>(out);
            expect(structured.subpath).toBe('button');
            expect(structured.cva[0]!.export_name).toBe('buttonVariants');
            expect(structured.cva[0]!.default_variants.variant).toBe('primary');
        });

        it('surfaces fuzzy suggestions for typos', async () => {
            const handler = createGetComponentHandler(components);
            const out = await handler({
                name: 'buton',
                response_format: 'markdown'
            });
            const text = extractText(out);
            expect(text).toMatch(/Error:/);
            expect(text.toLowerCase()).toContain('button');
        });
    });

    describe('ui_get_component_source', () => {
        it('returns raw source with line numbers', async () => {
            const handler = createGetComponentSourceHandler(components);
            const out = await handler({ name: 'badge' });
            const text = extractText(out);
            expect(text).toContain('badgeVariants');
            expect(text).toContain('cva(');
        });

        it('slices by line range', async () => {
            const handler = createGetComponentSourceHandler(components);
            const out = await handler({
                name: 'button',
                start_line: 1,
                end_line: 5
            });
            const structured = extractStructured<{ source: string }>(out);
            expect(structured.source.split('\n')).toHaveLength(5);
        });
    });

    describe('ui_list_tokens', () => {
        it('returns all tokens in both modes by default', async () => {
            const handler = createListTokensHandler(tokens);
            const out = await handler({
                mode: 'both',
                response_format: 'json'
            });
            const structured = extractStructured<{
                total: number;
                tokens: Array<{ name: string; type: string }>;
            }>(out);
            expect(structured.total).toBe(tokens.length);
            const names = structured.tokens.map((t) => t.name);
            expect(names).toContain('primary');
            expect(names).toContain('danger');
            expect(names).toContain('surface');
        });

        it('filters by type=color', async () => {
            const handler = createListTokensHandler(tokens);
            const out = await handler({
                type: 'color',
                mode: 'light',
                response_format: 'json'
            });
            const structured = extractStructured<{
                tokens: Array<{ type: string }>;
            }>(out);
            expect(
                structured.tokens.every((t) => t.type === 'color')
            ).toBe(true);
        });
    });

    describe('ui_get_token', () => {
        it('resolves by short name', async () => {
            const handler = createGetTokenHandler(tokens);
            const out = await handler({
                name: 'primary',
                response_format: 'json'
            });
            const structured = extractStructured<{
                name: string;
                light: { oklch: { l: number; c: number; h: number } | null };
                dark: { value: string | null };
                utility_examples: string[];
            }>(out);
            expect(structured.name).toBe('primary');
            expect(structured.light.oklch).not.toBeNull();
            expect(structured.dark.value).not.toBeNull();
            expect(structured.utility_examples).toContain('bg-primary');
        });

        it('resolves by full CSS name', async () => {
            const handler = createGetTokenHandler(tokens);
            const out = await handler({
                name: '--color-danger',
                response_format: 'json'
            });
            const structured = extractStructured<{ name: string }>(out);
            expect(structured.name).toBe('danger');
        });
    });

    describe('ui_validate_usage', () => {
        it('flags raw Tailwind colors, arbitrary values, bg-white/black, and bad imports', async () => {
            const handler = createValidateUsageHandler(components, tokens);
            const dirty = `
import { Button } from '@repo/ui/button';
import { Card } from '@repo/ui';
import { Foo } from '@repo/ui/buton';

export function BadComponent() {
    return (
        <div className="bg-blue-500 text-white border-gray-200">
            <Button className="bg-[#ff0000]">Click</Button>
            <span className="dark:bg-red-400 bg-black">hi</span>
        </div>
    );
}
`.trim();
            const out = await handler({
                snippet: dirty,
                response_format: 'json'
            });
            const structured = extractStructured<{
                violation_count: number;
                violations: Array<{ rule: string }>;
            }>(out);
            expect(structured.violation_count).toBeGreaterThanOrEqual(6);
            const rules = new Set(structured.violations.map((v) => v.rule));
            expect(rules.has('no-raw-tailwind-colors')).toBe(true);
            expect(rules.has('no-arbitrary-colors')).toBe(true);
            expect(rules.has('no-hardcoded-white-black')).toBe(true);
            expect(rules.has('use-subpath-imports')).toBe(true);
            expect(rules.has('unknown-component-import')).toBe(true);
        });

        it('returns zero violations for a clean snippet', async () => {
            const handler = createValidateUsageHandler(components, tokens);
            const clean = `
import { Button } from '@repo/ui/button';
import { Badge } from '@repo/ui/badge';

export function GoodComponent() {
    return (
        <div className="bg-surface text-neutral border-neutral/25">
            <Button variant="primary">Click</Button>
            <Badge variant="accent">new</Badge>
        </div>
    );
}
`.trim();
            const out = await handler({
                snippet: clean,
                response_format: 'json'
            });
            const structured = extractStructured<{
                violation_count: number;
            }>(out);
            expect(structured.violation_count).toBe(0);
        });
    });
});
