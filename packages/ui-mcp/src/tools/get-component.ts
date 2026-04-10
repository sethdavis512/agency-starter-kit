import { z } from 'zod';
import type { ComponentRecord } from '../loaders/components.js';
import {
    ResponseFormatValues,
    type ResponseFormat,
    enforceCharacterLimit,
    formatJson,
    toolResult
} from '../formatters.js';

export const getComponentInputShape = {
    name: z
        .string()
        .min(1)
        .describe(
            "Component subpath as declared in @repo/ui/package.json exports (e.g. 'button', 'alert-dialog')"
        ),
    response_format: z
        .enum(ResponseFormatValues)
        .default('markdown')
        .describe(
            "Output format: 'markdown' for human-readable or 'json' for machine-readable"
        )
};

type GetComponentInput = {
    name: string;
    response_format: ResponseFormat;
};

function buildSuggestion(catalog: ComponentRecord[], target: string): string {
    const all = catalog.map((c) => c.subpath);
    const matches = all
        .map((s) => ({ s, d: levenshtein(s, target) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 3)
        .filter((m) => m.d <= 4)
        .map((m) => m.s);
    if (matches.length === 0) return '';
    return ` Did you mean: ${matches.map((m) => `'${m}'`).join(', ')}?`;
}

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

export function createGetComponentHandler(catalog: ComponentRecord[]) {
    return async (params: GetComponentInput) => {
        const normalized = params.name.replace(/^\.?\//, '').toLowerCase();
        const record = catalog.find(
            (c) =>
                c.subpath === normalized ||
                c.exports.some((e) => e.name.toLowerCase() === normalized)
        );

        if (!record) {
            const suggestion = buildSuggestion(catalog, normalized);
            return toolResult(
                `Error: No component found for '${params.name}'.${suggestion}`
            );
        }

        const output = {
            subpath: record.subpath,
            import_path: record.importPath,
            file_path: record.relativePath,
            base_ui_primitive: record.baseUiPrimitive,
            uses_forward_ref: record.usesForwardRef,
            line_count: record.lineCount,
            exports: record.exports,
            cva: record.cva.map((def) => ({
                export_name: def.exportName,
                base: def.base,
                variants: def.variants,
                default_variants: def.defaultVariants
            }))
        };

        let text: string;
        if (params.response_format === 'json') {
            text = formatJson(output);
        } else {
            const lines: string[] = [
                `# ${record.exports[0]?.name ?? record.subpath}`,
                '',
                `- **Import**: \`${record.importPath}\``,
                `- **Source**: \`packages/ui/${record.relativePath}\``,
                `- **Lines**: ${record.lineCount}`
            ];
            if (record.baseUiPrimitive) {
                lines.push(
                    `- **Base UI primitive**: \`${record.baseUiPrimitive}\``
                );
            }
            if (record.usesForwardRef) {
                lines.push(`- **Uses forwardRef**: yes`);
            }
            lines.push('');

            if (record.exports.length > 0) {
                lines.push('## Exports');
                lines.push('');
                for (const e of record.exports) {
                    lines.push(`- \`${e.name}\` (${e.kind})`);
                }
                lines.push('');
            }

            if (record.cva.length > 0) {
                lines.push('## CVA Variants');
                lines.push('');
                for (const def of record.cva) {
                    lines.push(`### \`${def.exportName}\``);
                    lines.push('');
                    if (def.base) {
                        lines.push(
                            `- **Base classes**: \`${def.base.slice(0, 120)}${def.base.length > 120 ? '...' : ''}\``
                        );
                    }
                    for (const [axis, values] of Object.entries(def.variants)) {
                        const defaultVal = def.defaultVariants[axis];
                        const valueList = values
                            .map((v) =>
                                v === defaultVal ? `**${v}** (default)` : v
                            )
                            .join(', ');
                        lines.push(`- **${axis}**: ${valueList}`);
                    }
                    lines.push('');
                }
            } else {
                lines.push(
                    '_This component has no CVA variants. Use the get_component_source tool to view its implementation._'
                );
                lines.push('');
            }
            text = lines.join('\n');
        }

        const { text: finalText } = enforceCharacterLimit(
            text,
            'Call ui_get_component_source to view the raw source in chunks.'
        );
        return toolResult(finalText, output);
    };
}
