import { redirect } from 'react-router';
import { auth } from './auth.server';
import { userContext } from './context';

/**
 * Middleware to check if user is authenticated.
 * If not authenticated, redirects to /sign-in.
 * If authenticated, sets user in context for downstream loaders/actions.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- tracked by TEC-272
export async function requireAuth({ request, context }: any) {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
        throw redirect('/sign-in');
    }

    context.set(userContext, session.user);
}

/**
 * Middleware to check if user has admin role.
 * Must be used after requireAuth middleware.
 * Throws 403 if user is not an admin.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- tracked by TEC-272
export async function requireAdmin({ context }: any) {
    const user = context.get(userContext);

    if (!user || user.role !== 'admin') {
        throw redirect('/no-access');
    }
}
