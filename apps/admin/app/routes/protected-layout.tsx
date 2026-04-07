import { Outlet } from 'react-router';
import type { Route } from './+types/protected-layout';
import { requireAuth, requireAdmin } from '@repo/auth/middleware';

export const middleware: Route.MiddlewareFunction[] = [
    requireAuth,
    requireAdmin
];

export async function loader() {
    return null;
}

export default function ProtectedLayout() {
    return <Outlet />;
}
