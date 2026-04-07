import type { PropsWithChildren } from 'react';
import { cva, cx } from '../utils/cva.config';
import type { VariantProps } from 'cva';

export const cardVariants = cva({
    base: 'rounded-lg shadow-md border border-zinc-200 p-4 sm:p-6 md:p-8',
    variants: {
        variant: {
            primary: '',
            secondary: ''
        }
    },
    defaultVariants: {
        variant: 'primary'
    },
    compoundVariants: []
});

interface CardProps extends VariantProps<typeof cardVariants> {
    className?: string;
}

export function Card({
    children,
    variant,
    className
}: PropsWithChildren<CardProps>) {
    return (
        <div className={cx(cardVariants({ variant }), className)}>
            {children}
        </div>
    );
}
