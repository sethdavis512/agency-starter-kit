import type { PropsWithChildren } from 'react';
import { cx } from '../utils/cva.config';

interface ContainerProps {
    className?: string;
}

export function Container({
    className,
    children
}: PropsWithChildren<ContainerProps>) {
    return (
        <div
            className={cx('container mx-auto px-4 sm:px-6 lg:px-8', className)}
        >
            {children}
        </div>
    );
}
