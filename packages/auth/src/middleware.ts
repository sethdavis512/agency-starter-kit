import { redirect } from 'react-router';
import { auth } from './auth.server';
import { userContext } from './context';

/**
 * Middleware to check if user is authenticated.
 * If not authenticated, redirects to /signin.
 * If authenticated, sets user in context for downstream loaders/actions.
 */
export async function requireAuth({ request, context }: any) {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
        throw redirect('/signin');
    }

    context.set(userContext, session.user);
}

/**
 * Middleware to check if user has admin role.
 * Must be used after requireAuth middleware.
 * Throws 403 if user is not an admin.
 */
export async function requireAdmin({ context }: any) {
    const user = context.get(userContext);

    if (!user || user.role !== 'admin') {
        throw redirect('/no-access');
    }
}
