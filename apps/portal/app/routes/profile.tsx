import type { Route } from './+types/profile';
import { userContext } from '@repo/auth/context';
import { prisma } from '@repo/database';
import { Card } from '@repo/ui/card';
import { Heading } from '@repo/ui/heading';
import { formatDate } from '@repo/utils/date';
import { User, Mail, Calendar } from '@repo/utils/icons';

export async function loader({ context }: Route.LoaderArgs) {
    const sessionUser = context.get(userContext);
    if (!sessionUser) {
        throw new Response('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true
        }
    });

    if (!user) {
        throw new Response('User not found', { status: 404 });
    }

    return { user };
}

export default function ProfileRoute({ loaderData }: Route.ComponentProps) {
    const { user } = loaderData;

    return (
        <>
            <title>Profile | Stealthy Chicken</title>
            <Heading size="xl" bold className="mb-6">
                My Profile
            </Heading>

            <Card className="max-w-md">
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
                        <User className="h-8 w-8 text-amber-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold">{user.name}</h2>
                        <p className="text-zinc-500 text-sm">Customer</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg">
                        <Mail className="h-5 w-5 text-zinc-400" />
                        <div>
                            <p className="text-xs text-zinc-500 uppercase tracking-wider">
                                Email
                            </p>
                            <p className="text-sm font-medium">{user.email}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg">
                        <Calendar className="h-5 w-5 text-zinc-400" />
                        <div>
                            <p className="text-xs text-zinc-500 uppercase tracking-wider">
                                Member Since
                            </p>
                            <p className="text-sm font-medium">
                                {formatDate(user.createdAt)}
                            </p>
                        </div>
                    </div>
                </div>
            </Card>
        </>
    );
}
