import type { PropsWithChildren } from 'react';
import { Link } from 'react-router';
import { cva, type VariantProps } from 'cva';
import { cn } from '../utils/cn';

export const appLinkVariants = cva({
    base: 'hover:underline',
    variants: {
        variant: {
            primary: 'text-primary',
            secondary: 'text-neutral/60',
            light: 'text-white underline',
            dark: 'text-neutral underline'
        }
    },
    defaultVariants: {
        variant: 'primary'
    }
});

interface AppLinkProps extends VariantProps<typeof appLinkVariants> {
    to: string;
    external?: boolean;
    className?: string;
}

export function AppLink({
    children,
    to,
    external = false,
    variant = 'primary',
    className
}: PropsWithChildren<AppLinkProps>) {
    const linkClassName = cn(appLinkVariants({ variant }), className);

    if (external) {
        return (
            <a
                href={to}
                className={linkClassName}
                target="_blank"
                rel="noopener noreferrer"
            >
                {children}
            </a>
        );
    }

    return (
        <Link to={to} className={linkClassName}>
            {children}
        </Link>
    );
}
