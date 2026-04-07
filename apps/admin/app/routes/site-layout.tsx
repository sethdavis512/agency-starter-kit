import { useState } from 'react';
import { Header } from '@repo/ui/header';
import { Main } from '@repo/ui/main';
import { Footer } from '@repo/ui/footer';
import { Sidebar } from '@repo/ui/sidebar';
import { Container } from '@repo/ui/container';
import { Outlet } from 'react-router';
import type { Route } from './+types/site-layout';
import { auth } from '@repo/auth/server';

export async function loader({ request }: Route.LoaderArgs) {
    const session = await auth.api.getSession({ headers: request.headers });
    return { user: session?.user || null };
}

export default function SiteLayoutRoute({ loaderData }: Route.ComponentProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const isAuthenticated = !!loaderData.user;

    return (
        <div className="min-h-screen flex flex-col">
            <Header
                variant="admin"
                isAuthenticated={isAuthenticated}
                onMenuToggle={function () {
                    setSidebarOpen(!sidebarOpen);
                }}
            />
            <Container className="flex flex-1 gap-4">
                {isAuthenticated && (
                    <Sidebar
                        variant="admin"
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
