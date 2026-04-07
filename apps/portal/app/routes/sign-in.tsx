import { SignInForm } from '@repo/ui/sign-in-form';
import { redirect, useNavigate } from 'react-router';
import type { Route } from './+types/sign-in';
import { auth } from '@repo/auth/server';

export async function loader({ request }: Route.LoaderArgs) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (session?.user) {
        throw redirect('/dashboard');
    }
    return null;
}

export default function SignIn() {
    const navigate = useNavigate();

    return <SignInForm onSuccess={() => navigate('/dashboard')} />;
}
