import * as React from 'react';
import { NumberField } from '@base-ui/react/number-field';
import { cn } from '../../utils/cn';

export const NumberFieldRoot = React.forwardRef<
    HTMLDivElement,
    React.ComponentPropsWithoutRef<typeof NumberField.Root>
>(({ className, ...props }, ref) => (
    <NumberField.Root
        ref={ref}
        className={cn('flex flex-col gap-1', className)}
        {...props}
    />
));
NumberFieldRoot.displayName = 'NumberFieldRoot';

export const NumberFieldGroup = React.forwardRef<
    HTMLDivElement,
    React.ComponentPropsWithoutRef<typeof NumberField.Group>
>(({ className, ...props }, ref) => (
    <NumberField.Group
        ref={ref}
        className={cn(
            'flex h-10 items-center overflow-hidden rounded-md border border-neutral/25 bg-surface focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2',
            className
        )}
        {...props}
    />
));
NumberFieldGroup.displayName = 'NumberFieldGroup';

export const NumberFieldDecrement = React.forwardRef<
    HTMLButtonElement,
    React.ComponentPropsWithoutRef<typeof NumberField.Decrement>
>(({ className, children, ...props }, ref) => (
    <NumberField.Decrement
        ref={ref}
        className={cn(
            'flex h-full w-9 shrink-0 items-center justify-center border-r border-neutral/15 text-neutral/60 transition-colors hover:bg-muted/40 hover:text-neutral focus-visible:outline-none data-disabled:cursor-not-allowed data-disabled:opacity-50',
            className
        )}
        {...props}
    >
        {children ?? (
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-3.5 w-3.5"
                aria-hidden
            >
                <path d="M5 12h14" />
            </svg>
        )}
    </NumberField.Decrement>
));
NumberFieldDecrement.displayName = 'NumberFieldDecrement';

export const NumberFieldIncrement = React.forwardRef<
    HTMLButtonElement,
    React.ComponentPropsWithoutRef<typeof NumberField.Increment>
>(({ className, children, ...props }, ref) => (
    <NumberField.Increment
        ref={ref}
        className={cn(
            'flex h-full w-9 shrink-0 items-center justify-center border-l border-neutral/15 text-neutral/60 transition-colors hover:bg-muted/40 hover:text-neutral focus-visible:outline-none data-disabled:cursor-not-allowed data-disabled:opacity-50',
            className
        )}
        {...props}
    >
        {children ?? (
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-3.5 w-3.5"
                aria-hidden
            >
                <path d="M12 5v14M5 12h14" />
            </svg>
        )}
    </NumberField.Increment>
));
NumberFieldIncrement.displayName = 'NumberFieldIncrement';

export const NumberFieldInput = React.forwardRef<
    HTMLInputElement,
    React.ComponentPropsWithoutRef<typeof NumberField.Input>
>(({ className, ...props }, ref) => (
    <NumberField.Input
        ref={ref}
        className={cn(
            'h-full min-w-0 flex-1 bg-transparent px-3 text-center text-sm text-neutral focus-visible:outline-none',
            className
        )}
        {...props}
    />
));
NumberFieldInput.displayName = 'NumberFieldInput';

export const NumberFieldScrubArea = React.forwardRef<
    HTMLSpanElement,
    React.ComponentPropsWithoutRef<typeof NumberField.ScrubArea>
>(({ className, ...props }, ref) => (
    <NumberField.ScrubArea
        ref={ref}
        className={cn('cursor-ew-resize select-none', className)}
        {...props}
    />
));
NumberFieldScrubArea.displayName = 'NumberFieldScrubArea';

export const NumberFieldScrubAreaCursor = React.forwardRef<
    HTMLSpanElement,
    React.ComponentPropsWithoutRef<typeof NumberField.ScrubAreaCursor>
>(({ className, ...props }, ref) => (
    <NumberField.ScrubAreaCursor
        ref={ref}
        className={cn('drop-shadow', className)}
        {...props}
    />
));
NumberFieldScrubAreaCursor.displayName = 'NumberFieldScrubAreaCursor';
