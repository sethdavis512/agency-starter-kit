import type { PropsWithChildren } from 'react';
import { cn } from '../utils/cn';

interface MainProps {
    className?: string;
}

export function Main({ children, className }: PropsWithChildren<MainProps>) {
    return <main className={cn('', className)}>{children}</main>;
}
