import { Button as BaseButton } from '@base-ui/react/button';
import { cva, type VariantProps } from 'cva';
import { cn } from '../../utils/cn';

export const buttonVariants = cva({
    base: 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 data-disabled:pointer-events-none data-disabled:opacity-50',
    variants: {
        variant: {
            primary:
                'bg-accent text-white hover:not-data-disabled:bg-accent/85 focus-visible:ring-accent',
            secondary:
                'bg-muted text-neutral hover:not-data-disabled:bg-muted/60 focus-visible:ring-neutral',
            destructive:
                'bg-danger text-white hover:not-data-disabled:bg-danger/85 focus-visible:ring-danger',
            outline:
                'border border-neutral/30 bg-transparent text-neutral hover:not-data-disabled:bg-muted focus-visible:ring-neutral',
            ghost: 'text-neutral hover:not-data-disabled:bg-muted focus-visible:ring-neutral'
        },
        size: {
            sm: 'h-8 px-3 text-sm',
            md: 'h-10 px-4 text-sm',
            lg: 'h-12 px-6 text-base'
        }
    },
    defaultVariants: {
        variant: 'primary',
        size: 'md'
    }
});

export interface ButtonProps
    extends React.ComponentPropsWithoutRef<typeof BaseButton>,
        VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
    return (
        <BaseButton
            className={cn(buttonVariants({ variant, size }), className)}
            {...props}
        />
    );
}
