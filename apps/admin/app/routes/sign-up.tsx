import { SignUpForm } from '@repo/ui/sign-up-form';
import { redirect, useNavigate } from 'react-router';
import type { Route } from './+types/sign-up';
import { auth } from '@repo/auth/server';

export async function loader({ request }: Route.LoaderArgs) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (session?.user) {
        throw redirect('/dashboard');
    }
    return null;
}

export default function SignUp() {
    const navigate = useNavigate();

    return <SignUpForm onSuccess={() => navigate('/dashboard')} />;
}
