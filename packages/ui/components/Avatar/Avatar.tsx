import { Avatar as BaseAvatar } from '@base-ui/react/avatar';
import { cva, type VariantProps } from 'cva';
import { cn } from '../../utils/cn';
import React from 'react';

export const avatarVariants = cva({
    base: 'inline-flex items-center justify-center rounded-full font-semibold shrink-0 overflow-hidden select-none align-middle',
    variants: {
        color: {
            primary: 'bg-primary text-white',
            secondary: 'bg-secondary text-white',
            neutral: 'bg-neutral text-white',
            accent: 'bg-accent text-white',
            'danger': 'bg-danger text-white',
            muted: 'bg-muted text-neutral'
        },
        size: {
            sm: 'h-8 w-8 text-xs',
            md: 'h-10 w-10 text-sm',
            lg: 'h-14 w-14 text-base'
        }
    },
    defaultVariants: {
        color: 'primary',
        size: 'md'
    }
});

export interface AvatarProps
    extends Omit<
            React.ComponentPropsWithoutRef<typeof BaseAvatar.Root>,
            'color'
        >,
        VariantProps<typeof avatarVariants> {
    src?: string;
    alt?: string;
    initials?: string;
}

export function Avatar({
    className,
    color,
    size,
    src,
    alt,
    initials,
    ...props
}: AvatarProps) {
    return (
        <BaseAvatar.Root
            className={cn(avatarVariants({ color, size }), className)}
            {...props}
        >
            {src && (
                <BaseAvatar.Image
                    src={src}
                    alt={alt ?? ''}
                    className="h-full w-full object-cover"
                />
            )}
            <BaseAvatar.Fallback
                className="flex h-full w-full items-center justify-center"
                aria-label={!src ? alt : undefined}
            >
                {initials}
            </BaseAvatar.Fallback>
        </BaseAvatar.Root>
    );
}
