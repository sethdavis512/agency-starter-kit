import { Link, NavLink, type NavLinkRenderProps } from 'react-router';
import { LayoutDashboard, User, LogOut, X } from '@repo/utils/icons';
import { cn } from '../utils/cn';

interface SidebarProps {
    variant?: 'portal' | 'admin';
    isOpen: boolean;
    onClose: () => void;
    className?: string;
}

function NavItem({
    to,
    icon: Icon,
    children,
    end = false,
    variant = 'portal'
}: {
    to: string;
    icon: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
    end?: boolean;
    variant?: 'portal' | 'admin';
}) {
    return (
        <NavLink
            to={to}
            end={end}
            className={function ({ isActive }: NavLinkRenderProps) {
                const activeClass =
                    variant === 'admin'
                        ? 'bg-primary/15 text-primary'
                        : 'bg-secondary/15 text-secondary';
                return cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                        ? activeClass
                        : 'text-neutral hover:bg-muted'
                );
            }}
        >
            <Icon className="h-4 w-4 shrink-0" />
            {children}
        </NavLink>
    );
}

export function Sidebar({
    className,
    variant = 'portal',
    isOpen,
    onClose
}: SidebarProps) {
    const sidebarContent = (
        <div className="flex flex-col">
            {/* Logo - mobile only */}
            <div className="flex items-center justify-between px-4 py-4 lg:hidden">
                <Link to="/" onClick={onClose}>
                    <p className="text-xl font-bold">🐔 Stealthy Chicken</p>
                </Link>
                <button
                    onClick={onClose}
                    className="rounded-md p-1 text-neutral/50 hover:bg-muted"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4">
                <NavItem
                    to="/dashboard"
                    icon={LayoutDashboard}
                    end
                    variant={variant}
                >
                    Dashboard
                </NavItem>
                <NavItem to="/profile" icon={User} variant={variant}>
                    Profile
                </NavItem>
            </nav>

            <div className="border-t border-neutral/15 px-3 py-4">
                <NavLink
                    to="/sign-out"
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-neutral transition-colors hover:bg-muted"
                >
                    <LogOut className="h-4 w-4 shrink-0" />
                    Sign Out
                </NavLink>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/30 lg:hidden"
                    onClick={onClose}
                />
            )}
            {/* Mobile sidebar */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 w-64 bg-surface shadow-lg transition-transform duration-200 lg:hidden',
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                {sidebarContent}
            </aside>
            {/* Desktop sidebar */}
            <aside
                className={cn(
                    'hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col border-r border-neutral/15 bg-surface',
                    className
                )}
            >
                {sidebarContent}
            </aside>
        </>
    );
}
