import { cva, type VariantProps } from 'cva';
import { cn } from '../../utils/cn';

export const badgeVariants = cva({
    base: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
    variants: {
        variant: {
            primary: 'bg-primary/15 text-primary',
            secondary: 'bg-secondary/15 text-secondary',
            neutral: 'bg-muted text-neutral',
            accent: 'bg-accent/15 text-accent',
            'danger': 'bg-danger/15 text-danger',
            outline: 'border border-neutral/30 bg-transparent text-neutral'
        }
    },
    defaultVariants: {
        variant: 'primary'
    }
});

export interface BadgeProps
    extends
        React.HTMLAttributes<HTMLSpanElement>,
        VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <span
            className={cn(badgeVariants({ variant }), className)}
            {...props}
        />
    );
}
