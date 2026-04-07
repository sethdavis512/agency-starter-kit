import type { PropsWithChildren } from 'react';
import { cx } from '../utils/cva.config';

interface MainProps {
    className?: string;
}

export function Main({ children, className }: PropsWithChildren<MainProps>) {
    return <main className={cx('', className)}>{children}</main>;
}
