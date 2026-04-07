import { Outlet } from 'react-router';
import type { Route } from './+types/protected-layout';
import { requireAuth } from '@repo/auth/middleware';

export const middleware: Route.MiddlewareFunction[] = [requireAuth];

export async function loader() {
    return null;
}

export default function ProtectedLayout() {
    return <Outlet />;
}
