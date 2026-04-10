import { z } from 'zod';
import type { DesignToken } from '../loaders/tokens.js';
import {
    ResponseFormatValues,
    type ResponseFormat,
    formatJson,
    toolResult
} from '../formatters.js';

export const getTokenInputShape = {
    name: z
        .string()
        .min(1)
        .describe(
            "Token name, either short form ('primary') or full CSS name ('--color-primary')"
        ),
    response_format: z
        .enum(ResponseFormatValues)
        .default('markdown')
        .describe(
            "Output format: 'markdown' for human-readable or 'json' for machine-readable"
        )
};

type GetTokenInput = {
    name: string;
    response_format: ResponseFormat;
};

function findToken(
    tokens: DesignToken[],
    name: string
): DesignToken | null {
    const needle = name.trim().toLowerCase();
    return (
        tokens.find(
            (t) =>
                t.name.toLowerCase() === needle ||
                t.cssName.toLowerCase() === needle ||
                t.cssName.toLowerCase() === `--${needle}` ||
                t.cssName.toLowerCase() === `--color-${needle}` ||
                t.cssName.toLowerCase() === `--font-${needle}`
        ) ?? null
    );
}

export function createGetTokenHandler(tokens: DesignToken[]) {
    return async (params: GetTokenInput) => {
        const token = findToken(tokens, params.name);
        if (!token) {
            const sample = tokens
                .slice(0, 8)
                .map((t) => t.name)
                .join(', ');
            return toolResult(
                `Error: No token found matching '${params.name}'. Available tokens include: ${sample}. Call ui_list_tokens for the full list.`
            );
        }

        const output = {
            name: token.name,
            css_name: token.cssName,
            type: token.type,
            light: {
                value: token.lightValue,
                oklch: token.lightOklch
            },
            dark: {
                value: token.darkValue,
                oklch: token.darkOklch
            },
            utility_examples:
                token.type === 'color'
                    ? [
                          `bg-${token.name}`,
                          `text-${token.name}`,
                          `border-${token.name}`,
                          `ring-${token.name}`,
                          `bg-${token.name}/50`
                      ]
                    : token.type === 'font' && token.name === 'sans'
                      ? ['font-sans']
                      : []
        };

        let text: string;
        if (params.response_format === 'json') {
            text = formatJson(output);
        } else {
            const lines: string[] = [
                `# Token: ${token.name}`,
                '',
                `- **CSS name**: \`${token.cssName}\``,
                `- **Type**: ${token.type}`,
                `- **Light value**: \`${token.lightValue}\``,
                `- **Dark value**: \`${token.darkValue ?? '(inherits light)'}\``
            ];
            if (token.lightOklch) {
                lines.push(
                    `- **Light OKLCH**: L=${token.lightOklch.l.toFixed(3)} C=${token.lightOklch.c.toFixed(3)} H=${token.lightOklch.h.toFixed(1)}`
                );
            }
            if (token.darkOklch) {
                lines.push(
                    `- **Dark OKLCH**: L=${token.darkOklch.l.toFixed(3)} C=${token.darkOklch.c.toFixed(3)} H=${token.darkOklch.h.toFixed(1)}`
                );
            }
            if (output.utility_examples.length > 0) {
                lines.push('');
                lines.push('## Utility examples');
                lines.push('');
                for (const u of output.utility_examples) {
                    lines.push(`- \`${u}\``);
                }
            }
            text = lines.join('\n');
        }

        return toolResult(text, output);
    };
}
