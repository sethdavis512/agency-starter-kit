import { cva, cx } from '../utils/cva.config';
import type { VariantProps } from 'cva';

export const statusBadgeVariants = cva({
    base: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
    variants: {
        status: {
            PENDING: 'bg-zinc-100 text-zinc-800',
            QUOTED: 'bg-amber-100 text-amber-800',
            APPROVED: 'bg-indigo-100 text-indigo-800',
            IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
            COMPLETED: 'bg-green-100 text-green-800',
            PAID: 'bg-emerald-100 text-emerald-800',
            CANCELLED: 'bg-red-100 text-red-800',
            SCHEDULED: 'bg-purple-100 text-purple-800',
            CONFIRMED: 'bg-sky-100 text-sky-800',
            NO_SHOW: 'bg-orange-100 text-orange-800'
        }
    }
});

const labels: Record<string, string> = {
    PENDING: 'Pending',
    QUOTED: 'Quoted',
    APPROVED: 'Approved',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    PAID: 'Paid',
    CANCELLED: 'Cancelled',
    SCHEDULED: 'Scheduled',
    CONFIRMED: 'Confirmed',
    NO_SHOW: 'No Show'
};

interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
    className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    if (!status) return null;
    return (
        <span className={cx(statusBadgeVariants({ status }), className)}>
            {labels[status] ?? status}
        </span>
    );
}
