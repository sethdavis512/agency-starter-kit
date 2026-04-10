import { z } from 'zod';
import type { ComponentRecord } from '../loaders/components.js';
import {
    ResponseFormatValues,
    type ResponseFormat,
    enforceCharacterLimit,
    formatJson,
    toolResult
} from '../formatters.js';

export const listComponentsInputShape = {
    limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .default(50)
        .describe('Maximum number of components to return (default 50)'),
    offset: z
        .number()
        .int()
        .min(0)
        .default(0)
        .describe('Number of components to skip for pagination'),
    has_variants: z
        .boolean()
        .optional()
        .describe(
            'If set, filter to components that have (true) or do not have (false) CVA variant definitions'
        ),
    response_format: z
        .enum(ResponseFormatValues)
        .default('markdown')
        .describe(
            "Output format: 'markdown' for human-readable or 'json' for machine-readable"
        )
};

type ListComponentsInput = {
    limit: number;
    offset: number;
    has_variants?: boolean;
    response_format: ResponseFormat;
};

interface ListedComponent {
    name: string;
    subpath: string;
    import_path: string;
    base_ui_primitive: string | null;
    has_variants: boolean;
    variant_axes: string[];
    exports: string[];
}

function toListed(record: ComponentRecord): ListedComponent {
    const variantAxes = record.cva.flatMap((def) => Object.keys(def.variants));
    return {
        // Display name is the first exported symbol, falling back to subpath
        name: record.exports[0]?.name ?? record.subpath,
        subpath: record.subpath,
        import_path: record.importPath,
        base_ui_primitive: record.baseUiPrimitive,
        has_variants: variantAxes.length > 0,
        variant_axes: variantAxes,
        exports: record.exports.map((e) => e.name)
    };
}

export function createListComponentsHandler(catalog: ComponentRecord[]) {
    return async (params: ListComponentsInput) => {
        let filtered = catalog.map(toListed);
        if (typeof params.has_variants === 'boolean') {
            filtered = filtered.filter(
                (c) => c.has_variants === params.has_variants
            );
        }

        const total = filtered.length;
        const page = filtered.slice(
            params.offset,
            params.offset + params.limit
        );
        const hasMore = params.offset + page.length < total;

        const output = {
            total,
            count: page.length,
            offset: params.offset,
            components: page,
            has_more: hasMore,
            ...(hasMore
                ? { next_offset: params.offset + page.length }
                : {})
        };

        let text: string;
        if (params.response_format === 'json') {
            text = formatJson(output);
        } else {
            const lines: string[] = [
                `# @repo/ui Components`,
                '',
                `Showing ${page.length} of ${total} components${
                    typeof params.has_variants === 'boolean'
                        ? ` (filtered by has_variants=${params.has_variants})`
                        : ''
                }.`,
                ''
            ];
            for (const c of page) {
                lines.push(`## ${c.name}`);
                lines.push(`- **Import**: \`${c.import_path}\``);
                if (c.base_ui_primitive) {
                    lines.push(
                        `- **Base UI primitive**: \`${c.base_ui_primitive}\``
                    );
                }
                lines.push(
                    `- **Variants**: ${
                        c.has_variants ? c.variant_axes.join(', ') : 'none'
                    }`
                );
                if (c.exports.length > 1) {
                    lines.push(
                        `- **Exports**: ${c.exports.join(', ')}`
                    );
                }
                lines.push('');
            }
            if (hasMore) {
                lines.push(
                    `_More results available. Call again with offset=${output.next_offset}._`
                );
            }
            text = lines.join('\n');
        }

        const { text: finalText } = enforceCharacterLimit(
            text,
            'Use the limit and offset parameters to page through results.'
        );
        return toolResult(finalText, output);
    };
}
