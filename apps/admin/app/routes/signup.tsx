import { SignUpForm } from '@repo/ui/signup-form';
import { redirect } from 'react-router';
import type { Route } from './+types/signup';
import { auth } from '@repo/auth/server';

export async function loader({ request }: Route.LoaderArgs) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (session?.user) {
        throw redirect('/');
    }
    return null;
}

export default function SignUp() {
    function handleSuccess() {
        window.location.href = '/';
    }

    return <SignUpForm onSuccess={handleSuccess} />;
}
