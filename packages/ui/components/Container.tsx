import type { PropsWithChildren } from 'react';
import { cn } from '../utils/cn';

interface ContainerProps {
    className?: string;
}

export function Container({
    className,
    children
}: PropsWithChildren<ContainerProps>) {
    return (
        <div
            className={cn('container mx-auto px-4 sm:px-6 lg:px-8', className)}
        >
            {children}
        </div>
    );
}
