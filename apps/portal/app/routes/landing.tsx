import { Button } from '@repo/ui/button';
import { AppLink } from '@repo/ui/app-link';
import { redirect } from 'react-router';
import type { Route } from './+types/landing';
import { auth } from '@repo/auth/server';

export async function loader({ request }: Route.LoaderArgs) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (session?.user) {
        throw redirect('/dashboard');
    }
    return null;
}

export default function Landing() {
    return (
        <>
            <title>Stealthy Chicken</title>
            <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
                <h1 className="text-5xl font-bold tracking-tight">
                    🐔 Stealthy Chicken
                </h1>
                <p className="mt-4 max-w-md text-lg text-zinc-600">
                    Your portal for all things poultry-adjacent. Sign in to get
                    started.
                </p>
                <div className="mt-8 flex gap-4">
                    <AppLink to="/sign-in">
                        <Button size="lg" variant="primary">Sign In</Button>
                    </AppLink>
                    <AppLink to="/sign-up">
                        <Button size="lg" variant="secondary">
                            Sign Up
                        </Button>
                    </AppLink>
                </div>
            </div>
        </>
    );
}
