import { useState } from 'react';
import { Link, NavLink, NavLinkRenderProps, useLocation } from 'react-router';
import {
    Wrench,
    Car,
    CalendarPlus,
    CalendarDays,
    Bell,
    Plus,
    ChevronDown,
    ChevronRight,
    LogOut,
    X,
    LayoutDashboard,
    Receipt,
    Users
} from '@repo/utils/icons';
import { cx } from '../utils/cva.config';

interface SidebarVehicle {
    id: string;
    year: number;
    make: string;
    model: string;
}

interface SidebarProps {
    variant?: 'portal' | 'admin';
    vehicles?: SidebarVehicle[];
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
                        ? 'bg-sky-100 text-sky-900'
                        : 'bg-amber-100 text-amber-900';
                return cx(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? activeClass : 'text-zinc-700 hover:bg-zinc-100'
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
    vehicles = [],
    isOpen,
    onClose
}: SidebarProps) {
    const [vehiclesExpanded, setVehiclesExpanded] = useState(true);
    const location = useLocation();

    const isVehiclesActive =
        location.pathname === '/vehicles' ||
        location.pathname.startsWith('/vehicles/');

    const adminNav = (
        <nav className="flex-1 space-y-1 px-3 py-4">
            <NavItem to="/" icon={LayoutDashboard} end variant="admin">
                Dashboard
            </NavItem>
            <NavItem to="/appointments" icon={CalendarDays} variant="admin">
                Appointments
            </NavItem>
            <NavItem to="/repairs" icon={Wrench} variant="admin">
                Repairs
            </NavItem>
            <NavItem to="/customers" icon={Users} variant="admin">
                Customers
            </NavItem>
            <NavItem to="/transactions" icon={Receipt} variant="admin">
                Transactions
            </NavItem>
        </nav>
    );

    const portalNav = (
        <nav className="flex-1 space-y-1 px-3 py-4">
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Quick Actions
            </p>
            <NavItem to="/appointments/new" icon={CalendarPlus}>
                Schedule Appointment
            </NavItem>
            <NavItem to="/vehicles/new" icon={Plus}>
                Add Vehicle
            </NavItem>
            <hr className="my-3 border-zinc-200" />
            <NavItem to="/" icon={Wrench} end>
                Repairs
            </NavItem>
            <NavItem to="/appointments" icon={CalendarDays} end>
                My Appointments
            </NavItem>
            <NavItem to="/notifications" icon={Bell}>
                Notifications
            </NavItem>
            {/* Vehicles section with expandable sub-items */}
            <div>
                <button
                    onClick={function () {
                        setVehiclesExpanded(!vehiclesExpanded);
                    }}
                    aria-expanded={vehiclesExpanded}
                    aria-controls="vehicles-menu"
                    className={cx(
                        'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isVehiclesActive
                            ? 'bg-amber-100 text-amber-900'
                            : 'text-zinc-700 hover:bg-zinc-100'
                    )}
                >
                    <Car className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-left">Vehicles</span>
                    {vehiclesExpanded ? (
                        <ChevronDown className="h-3 w-3" />
                    ) : (
                        <ChevronRight className="h-3 w-3" />
                    )}
                </button>
                {vehiclesExpanded && (
                    <div
                        id="vehicles-menu"
                        className="ml-7 mt-1 space-y-1 border-l border-zinc-200 pl-3"
                    >
                        <NavLink
                            to="/vehicles"
                            end
                            className={function ({
                                isActive
                            }: NavLinkRenderProps) {
                                return cx(
                                    'block rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                                    isActive
                                        ? 'bg-amber-50 text-amber-800'
                                        : 'text-zinc-600 hover:bg-zinc-50'
                                );
                            }}
                        >
                            All Vehicles
                        </NavLink>
                        {vehicles.map(function (vehicle) {
                            return (
                                <NavLink
                                    key={vehicle.id}
                                    to={`/vehicles/${vehicle.id}`}
                                    className={function ({
                                        isActive
                                    }: NavLinkRenderProps) {
                                        return cx(
                                            'block truncate rounded-md px-3 py-1.5 text-xs transition-colors',
                                            isActive
                                                ? 'bg-amber-50 text-amber-800 font-medium'
                                                : 'text-zinc-600 hover:bg-zinc-50'
                                        );
                                    }}
                                >
                                    {vehicle.year} {vehicle.make}{' '}
                                    {vehicle.model}
                                </NavLink>
                            );
                        })}
                    </div>
                )}
            </div>
        </nav>
    );

    const sidebarContent = (
        <div className="flex flex-col">
            {/* Logo - mobile only */}
            <div className="flex items-center justify-between px-4 py-4 lg:hidden">
                <Link to="/" onClick={onClose}>
                    <p className="text-xl font-bold">🐔 Stealthy Chicken</p>
                </Link>
                <button
                    onClick={onClose}
                    className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            {variant === 'admin' ? adminNav : portalNav}

            <div className="border-t border-zinc-200 px-3 py-4">
                <NavLink
                    to="/signout"
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
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
                className={cx(
                    'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform duration-200 lg:hidden',
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                {sidebarContent}
            </aside>
            {/* Desktop sidebar */}
            <aside
                className={cx(
                    'hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col border-r border-zinc-200 bg-white',
                    className
                )}
            >
                {sidebarContent}
            </aside>
        </>
    );
}
