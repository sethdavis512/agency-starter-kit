import type { PropsWithChildren } from 'react';
import { Link, type LinkProps } from 'react-router';
import { cva, cx } from '../utils/cva.config';
import type { VariantProps } from 'cva';

export const appLinkVariants = cva({
    base: 'hover:underline',
    variants: {
        variant: {
            primary: 'text-amber-500',
            secondary: 'text-slate-500',
            light: 'text-white underline',
            dark: 'text-zinc-800 underline'
        }
    },
    defaultVariants: {
        variant: 'primary'
    },
    compoundVariants: []
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
    className,
    ...props
}: PropsWithChildren<AppLinkProps>) {
    const linkClassName = cx(appLinkVariants({ variant }), className);

    if (external) {
        return (
            <a
                href={to}
                className={linkClassName}
                target="_blank"
                rel="noopener noreferrer"
                {...props}
            >
                {children}
            </a>
        );
    }

    return (
        <Link to={to} className={linkClassName} {...(props as LinkProps)}>
            {children}
        </Link>
    );
}
