/**
 * Centralized date/time formatting utilities.
 * All functions accept Date objects or ISO strings and format consistently.
 * Uses 'America/Chicago' as default timezone to ensure SSR/client consistency.
 */

const DEFAULT_TIMEZONE = 'America/Chicago';
const DEFAULT_LOCALE = 'en-US';

type DateInput = Date | string;

function toDate(input: DateInput): Date {
    return typeof input === 'string' ? new Date(input) : input;
}

/**
 * Parse a datetime-local input value (e.g., "2026-02-11T10:00") as America/Chicago time.
 * Returns a Date object with the correct UTC timestamp for storage.
 *
 * This is needed because datetime-local inputs don't include timezone info,
 * and the server (running in UTC) would otherwise interpret the time incorrectly.
 */
export function parseDateTimeLocal(
    datetimeLocalValue: string,
    options?: { timeZone?: string }
): Date {
    const timeZone = options?.timeZone ?? DEFAULT_TIMEZONE;

    // Parse the datetime-local format: "2026-02-11T10:00"
    const [datePart, timePart] = datetimeLocalValue.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);

    // Create a date string that explicitly includes the timezone offset
    // We use Intl.DateTimeFormat to get the offset for that timezone at that date
    const tempDate = new Date(year, month - 1, day, hours, minutes);

    // Get the offset in the target timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        timeZoneName: 'longOffset'
    });
    const parts = formatter.formatToParts(tempDate);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    const offsetMatch = tzPart?.value.match(/GMT([+-]\d{1,2}):?(\d{2})?/);

    let offsetMinutes = 0;
    if (offsetMatch) {
        const hourOffset = parseInt(offsetMatch[1], 10);
        const minOffset = offsetMatch[2] ? parseInt(offsetMatch[2], 10) : 0;
        offsetMinutes =
            hourOffset * 60 + (hourOffset < 0 ? -minOffset : minOffset);
    }

    // Create the date in UTC by subtracting the timezone offset
    const utcDate = new Date(
        Date.UTC(year, month - 1, day, hours, minutes) -
            offsetMinutes * 60 * 1000
    );

    return utcDate;
}

/**
 * Format as full date with time: "February 11, 2026 at 10:00 AM"
 */
export function formatDateTime(
    input: DateInput,
    options?: { timeZone?: string }
): string {
    const date = toDate(input);
    const timeZone = options?.timeZone ?? DEFAULT_TIMEZONE;

    return date.toLocaleString(DEFAULT_LOCALE, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone
    });
}

/**
 * Format as short date with time: "Feb 11, 2026, 10:00 AM"
 */
export function formatDateTimeShort(
    input: DateInput,
    options?: { timeZone?: string }
): string {
    const date = toDate(input);
    const timeZone = options?.timeZone ?? DEFAULT_TIMEZONE;

    return date.toLocaleString(DEFAULT_LOCALE, {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone
    });
}

/**
 * Format as date only: "February 11, 2026"
 */
export function formatDate(
    input: DateInput,
    options?: { timeZone?: string }
): string {
    const date = toDate(input);
    const timeZone = options?.timeZone ?? DEFAULT_TIMEZONE;

    return date.toLocaleDateString(DEFAULT_LOCALE, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone
    });
}

/**
 * Format as short date: "Feb 11, 2026"
 */
export function formatDateShort(
    input: DateInput,
    options?: { timeZone?: string }
): string {
    const date = toDate(input);
    const timeZone = options?.timeZone ?? DEFAULT_TIMEZONE;

    return date.toLocaleDateString(DEFAULT_LOCALE, {
        dateStyle: 'medium',
        timeZone
    });
}

/**
 * Format as numeric date: "2/11/2026"
 */
export function formatDateNumeric(
    input: DateInput,
    options?: { timeZone?: string }
): string {
    const date = toDate(input);
    const timeZone = options?.timeZone ?? DEFAULT_TIMEZONE;

    return date.toLocaleDateString(DEFAULT_LOCALE, {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
        timeZone
    });
}

/**
 * Format as time only: "10:00 AM"
 */
export function formatTime(
    input: DateInput,
    options?: { timeZone?: string }
): string {
    const date = toDate(input);
    const timeZone = options?.timeZone ?? DEFAULT_TIMEZONE;

    return date.toLocaleTimeString(DEFAULT_LOCALE, {
        hour: 'numeric',
        minute: '2-digit',
        timeZone
    });
}
