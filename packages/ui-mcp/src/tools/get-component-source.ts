import { z } from 'zod';
import {
    readComponentSource,
    type ComponentRecord
} from '../loaders/components.js';
import {
    enforceCharacterLimit,
    toolResult
} from '../formatters.js';

export const getComponentSourceInputShape = {
    name: z
        .string()
        .min(1)
        .describe(
            "Component subpath as declared in @repo/ui/package.json exports (e.g. 'button', 'alert-dialog')"
        ),
    start_line: z
        .number()
        .int()
        .min(1)
        .optional()
        .describe('Optional 1-indexed starting line for partial reads'),
    end_line: z
        .number()
        .int()
        .min(1)
        .optional()
        .describe('Optional 1-indexed inclusive ending line for partial reads')
};

type GetComponentSourceInput = {
    name: string;
    start_line?: number;
    end_line?: number;
};

export function createGetComponentSourceHandler(
    catalog: ComponentRecord[]
) {
    return async (params: GetComponentSourceInput) => {
        const normalized = params.name.replace(/^\.?\//, '').toLowerCase();
        const source = await readComponentSource(catalog, normalized);
        if (source === null) {
            return toolResult(
                `Error: No component source found for '${params.name}'. Use ui_list_components to see available subpaths.`
            );
        }

        const lines = source.split('\n');
        const start = Math.max(1, params.start_line ?? 1);
        const end = Math.min(lines.length, params.end_line ?? lines.length);
        const slice = lines.slice(start - 1, end);

        const header = `// packages/ui/${catalog.find((c) => c.subpath === normalized)?.relativePath ?? ''}  (lines ${start}-${end} of ${lines.length})\n`;
        const body = slice
            .map((line, idx) => `${String(start + idx).padStart(4, ' ')}  ${line}`)
            .join('\n');

        const { text: finalText } = enforceCharacterLimit(
            header + body,
            'Use start_line and end_line to read the file in smaller chunks.'
        );
        return toolResult(finalText, {
            subpath: normalized,
            start_line: start,
            end_line: end,
            total_lines: lines.length,
            source: slice.join('\n')
        });
    };
}
