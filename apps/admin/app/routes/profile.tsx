import type { Route } from './+types/profile';
import { userContext } from '@repo/auth/context';
import { prisma } from '@repo/database';
import { Card } from '@repo/ui/card';
import { PageHeader } from '@repo/ui/page-header';
import { User, Mail, Calendar, Shield } from '@repo/utils/icons';
import { formatDate } from '@repo/utils/date';

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
            role: true,
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
            <title>Profile | Stealthy Chicken Admin</title>
            <PageHeader title="My Profile" className="mb-6" />

            <Card className="max-w-md">
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
                        <User className="h-8 w-8 text-slate-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold">{user.name}</h2>
                        <div className="flex items-center gap-1 text-sm">
                            <Shield className="h-4 w-4 text-slate-500" />
                            <span className="text-slate-500 capitalize">
                                {user.role}
                            </span>
                        </div>
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
