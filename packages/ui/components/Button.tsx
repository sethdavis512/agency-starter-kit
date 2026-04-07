import type { PropsWithChildren, ButtonHTMLAttributes } from 'react';
import { cva, cx } from '../utils/cva.config';
import type { VariantProps } from 'cva';

export const buttonVariants = cva({
    base: 'p-4 rounded-md font-medium transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    variants: {
        variant: {
            primary:
                'bg-amber-500 text-white hover:bg-amber-600 disabled:bg-amber-300 disabled:text-amber-500',
            secondary:
                'bg-slate-800 text-white hover:bg-slate-900 disabled:bg-slate-600 disabled:text-slate-500',
            destructive:
                'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300 disabled:text-red-500',
            default:
                'bg-zinc-100 text-zinc-800 hover:bg-zinc-300 disabled:bg-zinc-100 disabled:text-zinc-400'
        },
        size: {
            sm: 'text-sm px-3 py-2',
            md: 'text-base px-4 py-2',
            lg: 'text-lg px-5 py-3',
            xl: 'text-xl px-6 py-4'
        },
        fullWidth: {
            true: 'w-full flex justify-center',
            false: ''
        }
    },
    defaultVariants: {
        variant: 'default',
        size: 'md',
        fullWidth: false
    },
    compoundVariants: []
});

interface ButtonProps
    extends
        ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {}

export function Button({
    children,
    variant,
    size,
    fullWidth,
    className,
    ...props
}: PropsWithChildren<ButtonProps>) {
    return (
        <button
            className={cx(
                buttonVariants({ variant, size, fullWidth }),
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}
