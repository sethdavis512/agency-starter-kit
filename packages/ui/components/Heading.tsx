import type { PropsWithChildren } from 'react';
import { cva, cx } from '../utils/cva.config';
import type { VariantProps } from 'cva';

export const headingVariants = cva({
    base: '',
    variants: {
        size: {
            sm: 'text-lg',
            md: 'text-xl',
            lg: 'text-2xl',
            xl: 'text-3xl'
        },
        bold: {
            true: 'font-bold'
        }
    }
    // defaultVariants: {},
    // compoundVariants: []
});

interface HeadingProps extends VariantProps<typeof headingVariants> {
    as?: React.ElementType;
    className?: string;
}

export function Heading({
    as: Component = 'h2',
    children,
    className,
    size,
    bold
}: PropsWithChildren<HeadingProps>) {
    return (
        <Component className={cx(headingVariants({ size, bold }), className)}>
            {children}
        </Component>
    );
}
