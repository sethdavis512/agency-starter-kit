import { prisma } from '../src';

const TIMEZONE = 'America/Chicago';

function getStartOfDayInTimezone(timezone: string): Date {
    const now = new Date();
    // Format current time in target timezone to get the date components
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    const dateStr = formatter.format(now); // "2026-02-10"

    // Parse as midnight in that timezone by getting the offset
    const midnight = new Date(`${dateStr}T00:00:00`);
    const offsetFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'longOffset'
    });
    const parts = offsetFormatter.formatToParts(midnight);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    const offsetMatch = tzPart?.value.match(/GMT([+-]\d{1,2}):?(\d{2})?/);

    let offsetMinutes = 0;
    if (offsetMatch) {
        const hourOffset = parseInt(offsetMatch[1], 10);
        const minOffset = offsetMatch[2] ? parseInt(offsetMatch[2], 10) : 0;
        offsetMinutes =
            hourOffset * 60 + (hourOffset < 0 ? -minOffset : minOffset);
    }

    // Create the UTC date for midnight in target timezone
    return new Date(
        Date.UTC(
            parseInt(dateStr.slice(0, 4)),
            parseInt(dateStr.slice(5, 7)) - 1,
            parseInt(dateStr.slice(8, 10)),
            0,
            0
        ) -
            offsetMinutes * 60 * 1000
    );
}

function getStartOfYearInTimezone(timezone: string): Date {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric'
    });
    const year = formatter.format(now);

    const offsetFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'longOffset'
    });
    const jan1 = new Date(`${year}-01-01T00:00:00`);
    const parts = offsetFormatter.formatToParts(jan1);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    const offsetMatch = tzPart?.value.match(/GMT([+-]\d{1,2}):?(\d{2})?/);

    let offsetMinutes = 0;
    if (offsetMatch) {
        const hourOffset = parseInt(offsetMatch[1], 10);
        const minOffset = offsetMatch[2] ? parseInt(offsetMatch[2], 10) : 0;
        offsetMinutes =
            hourOffset * 60 + (hourOffset < 0 ? -minOffset : minOffset);
    }

    return new Date(
        Date.UTC(parseInt(year), 0, 1, 0, 0) - offsetMinutes * 60 * 1000
    );
}

export async function getDashboardStats() {
    const startOfToday = getStartOfDayInTimezone(TIMEZONE);
    const startOfYear = getStartOfYearInTimezone(TIMEZONE);

    const [todayRevenue, completedThisYear, activeRepairs] = await Promise.all([
        prisma.transaction.aggregate({
            _sum: { amount: true },
            where: {
                repair: {
                    status: 'PAID',
                    updatedAt: { gte: startOfToday }
                }
            }
        }),
        prisma.repair.count({
            where: {
                status: { in: ['COMPLETED', 'PAID'] },
                updatedAt: { gte: startOfYear }
            }
        }),
        prisma.repair.count({
            where: { status: 'IN_PROGRESS' }
        })
    ]);

    return {
        todayRevenue: todayRevenue._sum.amount ?? 0,
        completedThisYear,
        activeRepairs
    };
}
