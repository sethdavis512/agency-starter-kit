import { z } from 'zod';
import type { DesignToken, TokenType } from '../loaders/tokens.js';
import {
    ResponseFormatValues,
    type ResponseFormat,
    enforceCharacterLimit,
    formatJson,
    toolResult
} from '../formatters.js';

const TokenTypeValues = ['color', 'font', 'other'] as const;
const TokenModeValues = ['light', 'dark', 'both'] as const;

export const listTokensInputShape = {
    type: z
        .enum(TokenTypeValues)
        .optional()
        .describe(
            "Filter by token type: 'color', 'font', or 'other' (unprefixed). Omit to return all types."
        ),
    mode: z
        .enum(TokenModeValues)
        .default('both')
        .describe(
            "Which value to include in the response: 'light', 'dark', or 'both' (default)"
        ),
    response_format: z
        .enum(ResponseFormatValues)
        .default('markdown')
        .describe(
            "Output format: 'markdown' for human-readable or 'json' for machine-readable"
        )
};

type ListTokensInput = {
    type?: TokenType;
    mode: (typeof TokenModeValues)[number];
    response_format: ResponseFormat;
};

function projectToken(
    token: DesignToken,
    mode: ListTokensInput['mode']
) {
    const base = {
        name: token.name,
        css_name: token.cssName,
        type: token.type,
        utility_hint: buildUtilityHint(token)
    };
    if (mode === 'light' || mode === 'both') {
        Object.assign(base, { light_value: token.lightValue });
    }
    if (mode === 'dark' || mode === 'both') {
        Object.assign(base, { dark_value: token.darkValue });
    }
    return base;
}

function buildUtilityHint(token: DesignToken): string[] {
    if (token.type === 'color') {
        return [
            `bg-${token.name}`,
            `text-${token.name}`,
            `border-${token.name}`,
            `ring-${token.name}`
        ];
    }
    if (token.type === 'font' && token.name === 'sans') {
        return ['font-sans'];
    }
    return [];
}

export function createListTokensHandler(tokens: DesignToken[]) {
    return async (params: ListTokensInput) => {
        const filtered = params.type
            ? tokens.filter((t) => t.type === params.type)
            : tokens;
        const projected = filtered.map((t) => projectToken(t, params.mode));

        const output = {
            total: projected.length,
            mode: params.mode,
            ...(params.type ? { type: params.type } : {}),
            tokens: projected
        };

        let text: string;
        if (params.response_format === 'json') {
            text = formatJson(output);
        } else {
            const lines: string[] = [
                `# @repo/ui Design Tokens`,
                '',
                `${projected.length} tokens${
                    params.type ? ` (type=${params.type})` : ''
                }, showing ${params.mode} mode.`,
                ''
            ];
            const byType = new Map<string, DesignToken[]>();
            for (const t of filtered) {
                if (!byType.has(t.type)) byType.set(t.type, []);
                byType.get(t.type)!.push(t);
            }
            for (const [type, list] of byType) {
                lines.push(`## ${type}`);
                lines.push('');
                for (const t of list) {
                    const valueParts: string[] = [];
                    if (params.mode === 'light' || params.mode === 'both') {
                        valueParts.push(`light: \`${t.lightValue}\``);
                    }
                    if (params.mode === 'dark' || params.mode === 'both') {
                        valueParts.push(
                            `dark: \`${t.darkValue ?? '(inherits light)'}\``
                        );
                    }
                    lines.push(
                        `- **${t.name}** (\`${t.cssName}\`) — ${valueParts.join(', ')}`
                    );
                }
                lines.push('');
            }
            text = lines.join('\n');
        }

        const { text: finalText } = enforceCharacterLimit(
            text,
            'Use the type parameter to filter or the mode parameter to reduce size.'
        );
        return toolResult(finalText, output);
    };
}
