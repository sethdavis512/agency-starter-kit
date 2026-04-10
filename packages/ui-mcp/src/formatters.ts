import { CHARACTER_LIMIT } from './constants.js';

export const ResponseFormatValues = ['markdown', 'json'] as const;
export type ResponseFormat = (typeof ResponseFormatValues)[number];

/**
 * Serialize structured data as pretty JSON.
 */
export function formatJson(value: unknown): string {
    return JSON.stringify(value, null, 2);
}

/**
 * Enforce the global CHARACTER_LIMIT on tool responses. If the text
 * exceeds the limit, truncate and append a clear message explaining
 * how to retrieve the rest.
 */
export function enforceCharacterLimit(
    text: string,
    hint: string
): { text: string; truncated: boolean } {
    if (text.length <= CHARACTER_LIMIT) {
        return { text, truncated: false };
    }
    const truncated =
        text.slice(0, CHARACTER_LIMIT - 200) +
        `\n\n...\n[Response truncated at ${CHARACTER_LIMIT} characters. ${hint}]`;
    return { text: truncated, truncated: true };
}

/**
 * Return both the text representation and a structured payload in the
 * shape expected by `McpServer.registerTool` handlers.
 */
export function toolResult(
    text: string,
    structured?: Record<string, unknown>
) {
    return {
        content: [{ type: 'text' as const, text }],
        ...(structured ? { structuredContent: structured } : {})
    };
}
