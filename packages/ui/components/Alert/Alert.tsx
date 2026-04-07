import { cva, type VariantProps } from 'cva';
import { cn } from '../../utils/cn';

export const alertVariants = cva({
    base: 'relative w-full rounded-lg border-l-4 p-4',
    variants: {
        variant: {
            info: 'border-l-primary bg-primary/8 text-neutral dark:bg-primary/15 dark:text-primary',
            warning: 'border-l-secondary bg-secondary/8 text-neutral dark:bg-secondary/15 dark:text-secondary',
            error: 'border-l-danger bg-danger/8 text-neutral dark:bg-danger/15 dark:text-danger',
            default: 'border-l-neutral bg-muted text-neutral'
        }
    },
    defaultVariants: {
        variant: 'default'
    }
});

export interface AlertProps
    extends
        React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof alertVariants> {}

export function Alert({ className, variant, ...props }: AlertProps) {
    return (
        <div
            role="alert"
            className={cn(alertVariants({ variant }), className)}
            {...props}
        />
    );
}

export function AlertTitle({
    className,
    ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h5
            className={cn(
                'mb-1 font-semibold leading-none tracking-tight',
                className
            )}
            {...props}
        />
    );
}

export function AlertDescription({
    className,
    ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
    return <p className={cn('text-sm opacity-90', className)} {...props} />;
}
