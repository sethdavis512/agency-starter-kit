import { useState } from 'react';
import { Header } from '@repo/ui/header';
import { Main } from '@repo/ui/main';
import { Footer } from '@repo/ui/footer';
import { Sidebar } from '@repo/ui/sidebar';
import { Container } from '@repo/ui/container';
import { Link, Outlet } from 'react-router';
import type { Route } from './+types/site-layout';
import { auth } from '@repo/auth/server';
import { getVehiclesByUserId } from '@repo/database/models/vehicle.server';
import { getUnreadCount } from '@repo/database/models/notification.server';
import { Bell } from '@repo/utils/icons';

export async function loader({ request }: Route.LoaderArgs) {
    const session = await auth.api.getSession({ headers: request.headers });
    const user = session?.user || null;

    if (!user) {
        return { user: null, vehicles: [], unreadCount: 0 };
    }

    const vehicles = await getVehiclesByUserId(user.id);
    const unreadCount = await getUnreadCount(user.id);

    return { user, vehicles: vehicles ?? [], unreadCount };
}

export default function SiteLayoutRoute({ loaderData }: Route.ComponentProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const isAuthenticated = !!loaderData.user;

    return (
        <div className="flex min-h-screen flex-col">
            <Header
                variant="portal"
                isAuthenticated={isAuthenticated}
                onMenuToggle={function () {
                    setSidebarOpen(!sidebarOpen);
                }}
            >
                {isAuthenticated && (
                    <Link
                        to="/notifications"
                        className="relative rounded-md p-1 hover:bg-white/20"
                    >
                        <Bell className="h-5 w-5" />
                        {loaderData.unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                {loaderData.unreadCount > 9
                                    ? '9+'
                                    : loaderData.unreadCount}
                            </span>
                        )}
                    </Link>
                )}
            </Header>
            <Container className="flex flex-1 gap-4">
                {isAuthenticated && (
                    <Sidebar
                        vehicles={loaderData.vehicles}
                        isOpen={sidebarOpen}
                        onClose={function () {
                            setSidebarOpen(false);
                        }}
                    />
                )}
                <Main className="flex-1 py-4">
                    <Outlet />
                </Main>
            </Container>
            <Footer />
        </div>
    );
}
