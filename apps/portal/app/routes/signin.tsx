import { SignInForm } from '@repo/ui/signin-form';
import { redirect } from 'react-router';
import type { Route } from './+types/signin';
import { auth } from '@repo/auth/server';

export async function loader({ request }: Route.LoaderArgs) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (session?.user) {
        throw redirect('/');
    }
    return null;
}

export default function SignIn() {
    function handleSuccess() {
        window.location.href = '/';
    }

    return <SignInForm onSuccess={handleSuccess} />;
}
