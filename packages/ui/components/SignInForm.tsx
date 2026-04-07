import { useState } from 'react';
import { authClient } from '@repo/auth/client';
import { Card } from './Card';
import { Button } from './Button';
import { AppLink } from './AppLink';

interface SignInFormProps {
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

export function SignInForm({ onSuccess, onError }: SignInFormProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await authClient.signIn.email(
                { email, password },
                {
                    onSuccess: () => {
                        onSuccess?.();
                    },
                    onError: (ctx) => {
                        const errorMsg = ctx.error.message || 'Sign in failed';
                        setError(errorMsg);
                        onError?.(errorMsg);
                    }
                }
            );
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex-1 flex items-center justify-center my-8">
            <Card className="max-w-md w-full space-y-8 p-8">
                <div>
                    <h2 className="text-center text-3xl font-bold">Sign In</h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="text-red-600 text-sm text-center">
                            {error}
                        </div>
                    )}
                    <div className="space-y-4">
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium"
                            >
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium"
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md"
                            />
                        </div>
                    </div>
                    <div>
                        <Button
                            type="submit"
                            disabled={loading}
                            fullWidth
                            size="md"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </div>
                    <div className="text-center text-sm">
                        <AppLink to="/signup" variant="dark">
                            Don't have an account? Sign up
                        </AppLink>
                    </div>
                </form>
            </Card>
        </div>
    );
}
