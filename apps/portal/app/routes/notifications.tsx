import type { Route } from './+types/notifications';
import { userContext } from '@repo/auth/context';
import {
    getNotificationsByUserId,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    deleteAllNotifications
} from '@repo/database/models/notification.server';
import { Card } from '@repo/ui/card';
import { Heading } from '@repo/ui/heading';
import { Button } from '@repo/ui/button';
import { formatDateTimeShort } from '@repo/utils/date';
import { Trash2 } from '@repo/utils/icons';
import { Link, useFetcher, data } from 'react-router';
import { invariant } from '@repo/utils';

export async function loader({ context }: Route.LoaderArgs) {
    const user = context.get(userContext);
    invariant(user, 'User must be authenticated to view notifications');

    const notifications = await getNotificationsByUserId(user.id, 50);

    return { notifications };
}

export async function action({ request, context }: Route.ActionArgs) {
    const user = context.get(userContext);
    invariant(user, 'User must be authenticated to manage notifications');

    const formData = await request.formData();
    const intent = formData.get('intent');

    switch (intent) {
        case 'mark-read': {
            const id = formData.get('id') as string;
            if (id) {
                await markNotificationRead(id);
            }
            return data({ success: true });
        }
        case 'mark-all-read': {
            await markAllNotificationsRead(user.id);
            return data({ success: true });
        }
        case 'delete': {
            const id = formData.get('id') as string;
            if (id) {
                await deleteNotification(id);
            }
            return data({ success: true });
        }
        case 'delete-all': {
            await deleteAllNotifications(user.id);
            return data({ success: true });
        }
        default:
            return data({ error: 'Invalid action' }, { status: 400 });
    }
}

export default function NotificationsRoute({
    loaderData
}: Route.ComponentProps) {
    const { notifications } = loaderData;
    const fetcher = useFetcher();

    const unread = notifications.filter((n) => !n.read);
    const read = notifications.filter((n) => n.read);

    return (
        <>
            <title>Notifications | Stealthy Chicken</title>
            <div className="flex items-center justify-between mb-6">
                <Heading size="xl" bold>
                    Notifications
                </Heading>
                <div className="flex items-center gap-2">
                    {unread.length > 0 && (
                        <fetcher.Form method="post">
                            <input
                                type="hidden"
                                name="intent"
                                value="mark-all-read"
                            />
                            <Button type="submit" size="sm">
                                Mark All as Read
                            </Button>
                        </fetcher.Form>
                    )}
                    {notifications.length > 0 && (
                        <fetcher.Form method="post">
                            <input
                                type="hidden"
                                name="intent"
                                value="delete-all"
                            />
                            <Button
                                type="submit"
                                size="sm"
                                variant="destructive"
                                className="flex gap-2"
                            >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete all
                            </Button>
                        </fetcher.Form>
                    )}
                </div>
            </div>

            {notifications.length === 0 ? (
                <Card>
                    <p className="text-center text-zinc-500 py-8">
                        No notifications yet.
                    </p>
                </Card>
            ) : (
                <div className="space-y-2">
                    {unread.length > 0 && (
                        <>
                            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">
                                Unread
                            </h2>
                            {unread.map(function (notification) {
                                return (
                                    <NotificationCard
                                        key={notification.id}
                                        notification={notification}
                                    />
                                );
                            })}
                        </>
                    )}

                    {read.length > 0 && (
                        <>
                            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mt-6">
                                Read
                            </h2>
                            {read.map(function (notification) {
                                return (
                                    <NotificationCard
                                        key={notification.id}
                                        notification={notification}
                                    />
                                );
                            })}
                        </>
                    )}
                </div>
            )}
        </>
    );
}

function NotificationCard({
    notification
}: {
    notification: {
        id: string;
        title: string;
        message: string;
        read: boolean;
        repairId: string | null;
        createdAt: Date;
    };
}) {
    const fetcher = useFetcher();
    const deleteFetcher = useFetcher();
    const isDeleting = deleteFetcher.state !== 'idle';

    if (isDeleting) {
        return null;
    }

    return (
        <Card
            className={
                notification.read
                    ? 'opacity-60'
                    : 'border-amber-200 bg-amber-50/30'
            }
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-sm text-zinc-600 mt-1">
                        {notification.message}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-zinc-400">
                            {formatDateTimeShort(notification.createdAt)}
                        </span>
                        {notification.repairId && (
                            <Link
                                to={`/repairs/${notification.repairId}`}
                                className="text-xs text-amber-600 hover:text-amber-700 underline"
                            >
                                View Repair
                            </Link>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {!notification.read && (
                        <fetcher.Form method="post">
                            <input
                                type="hidden"
                                name="intent"
                                value="mark-read"
                            />
                            <input
                                type="hidden"
                                name="id"
                                value={notification.id}
                            />
                            <button
                                type="submit"
                                className="text-xs text-zinc-400 hover:text-zinc-600"
                            >
                                Mark read
                            </button>
                        </fetcher.Form>
                    )}
                    <deleteFetcher.Form method="post">
                        <input type="hidden" name="intent" value="delete" />
                        <input
                            type="hidden"
                            name="id"
                            value={notification.id}
                        />
                        <button
                            type="submit"
                            className="text-zinc-400 hover:text-red-600 p-1"
                            title="Delete notification"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </deleteFetcher.Form>
                </div>
            </div>
        </Card>
    );
}
