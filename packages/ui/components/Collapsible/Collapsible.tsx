import * as React from 'react';
import { Collapsible } from '@base-ui/react/collapsible';
import { cn } from '../../utils/cn';

export const CollapsibleRoot = React.forwardRef<
    HTMLDivElement,
    React.ComponentPropsWithoutRef<typeof Collapsible.Root>
>(({ className, ...props }, ref) => (
    <Collapsible.Root ref={ref} className={cn('', className)} {...props} />
));
CollapsibleRoot.displayName = 'CollapsibleRoot';

export const CollapsibleTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ComponentPropsWithoutRef<typeof Collapsible.Trigger>
>(({ className, ...props }, ref) => (
    <Collapsible.Trigger
        ref={ref}
        className={cn(
            'inline-flex items-center justify-center rounded-md border border-neutral/25 bg-surface px-4 py-2 text-sm font-medium text-neutral transition-colors select-none hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 data-disabled:pointer-events-none data-disabled:opacity-40',
            className
        )}
        {...props}
    />
));
CollapsibleTrigger.displayName = 'CollapsibleTrigger';

export const CollapsiblePanel = React.forwardRef<
    HTMLDivElement,
    React.ComponentPropsWithoutRef<typeof Collapsible.Panel>
>(({ className, ...props }, ref) => (
    <Collapsible.Panel
        ref={ref}
        className={cn(
            '[&[hidden]:not([hidden=until-found])]:hidden h-[var(--collapsible-panel-height)] overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0',
            className
        )}
        {...props}
    />
));
CollapsiblePanel.displayName = 'CollapsiblePanel';
