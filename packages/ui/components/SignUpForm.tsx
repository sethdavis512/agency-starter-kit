import { useState } from 'react';
import { authClient } from '@repo/auth/client';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { FieldRoot, FieldLabel } from './Field';
import { AppLink } from './AppLink';

interface SignUpFormProps {
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

export function SignUpForm({ onSuccess, onError }: SignUpFormProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await authClient.signUp.email(
                { name, email, password },
                {
                    onSuccess: () => {
                        onSuccess?.();
                    },
                    onError: (ctx) => {
                        const errorMsg = ctx.error.message || 'Sign up failed';
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
                    <h2 className="text-center text-3xl font-bold text-neutral">
                        Sign Up
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="text-danger text-sm text-center">
                            {error}
                        </div>
                    )}
                    <div className="space-y-4">
                        <FieldRoot>
                            <FieldLabel>Name</FieldLabel>
                            <Input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </FieldRoot>
                        <FieldRoot>
                            <FieldLabel>Email</FieldLabel>
                            <Input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </FieldRoot>
                        <FieldRoot>
                            <FieldLabel>Password</FieldLabel>
                            <Input
                                type="password"
                                required
                                minLength={8}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </FieldRoot>
                    </div>
                    <div>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full"
                            size="md"
                        >
                            {loading ? 'Signing up...' : 'Sign Up'}
                        </Button>
                    </div>
                    <div className="text-center text-sm">
                        <AppLink to="/sign-in" variant="dark">
                            Already have an account? Sign in
                        </AppLink>
                    </div>
                </form>
            </Card>
        </div>
    );
}
