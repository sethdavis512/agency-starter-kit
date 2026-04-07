import { Link } from 'react-router';
import { cva, type VariantProps } from 'cva';
import { UserIcon, Menu } from '@repo/utils/icons';
import { cn } from '../utils/cn';
import { Container } from './Container';

export const headerVariants = cva({
    base: 'mb-2 p-4 text-white',
    variants: {
        variant: {
            admin: 'bg-neutral',
            portal: 'bg-secondary'
        }
    }
});

interface HeaderProps extends VariantProps<typeof headerVariants> {
    isAuthenticated: boolean;
    onMenuToggle?: () => void;
    children?: React.ReactNode;
    className?: string;
}

export function Header({
    className,
    variant,
    isAuthenticated,
    onMenuToggle,
    children
}: HeaderProps) {
    return (
        <header className={cn(headerVariants({ variant }), className)}>
            <Container className="flex justify-between items-center">
                <div className="flex items-center gap-6">
                    {onMenuToggle && (
                        <button
                            onClick={onMenuToggle}
                            aria-label="Open navigation menu"
                            className="rounded-md p-1 hover:bg-white/20 lg:hidden"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                    )}
                    <Link to="/">
                        <p className="text-xl font-bold">🐔 Stealthy Chicken</p>
                    </Link>
                </div>
                <div className="flex">
                    {isAuthenticated && (
                        <div className="flex items-center gap-3">
                            {children}
                            <Link
                                to="/profile"
                                className="flex items-center gap-2 rounded-md p-1 hover:bg-white/20"
                            >
                                <UserIcon className="h-5 w-5" />
                            </Link>
                        </div>
                    )}
                </div>
            </Container>
        </header>
    );
}
