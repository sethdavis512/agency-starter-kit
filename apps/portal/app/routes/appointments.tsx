import type { Route } from './+types/appointments';
import { userContext } from '@repo/auth/context';
import { getAppointmentsByUserId } from '@repo/database/models/appointment.server';
import { Card } from '@repo/ui/card';
import { Heading } from '@repo/ui/heading';
import { AppLink } from '@repo/ui/app-link';
import { StatusBadge } from '@repo/ui/status-badge';
import { formatDateTime } from '@repo/utils/date';
import { useFetcher, data } from 'react-router';
import { Button } from '@repo/ui/button';
import {
    updateAppointmentStatus,
    deleteAppointment
} from '@repo/database/models/appointment.server';

export async function loader({ context }: Route.LoaderArgs) {
    const user = context.get(userContext);

    if (!user) {
        throw new Response('Unauthorized', { status: 401 });
    }

    const appointments = await getAppointmentsByUserId(user.id);

    const upcoming = appointments.filter(function (a) {
        return (
            a.status !== 'COMPLETED' &&
            a.status !== 'CANCELLED' &&
            a.status !== 'NO_SHOW' &&
            new Date(a.scheduledFor) >= new Date()
        );
    });

    const past = appointments.filter(function (a) {
        return (
            a.status === 'COMPLETED' ||
            a.status === 'CANCELLED' ||
            a.status === 'NO_SHOW' ||
            new Date(a.scheduledFor) < new Date()
        );
    });

    return { upcoming, past };
}

export async function action({ request, context }: Route.ActionArgs) {
    const user = context.get(userContext);

    if (!user) {
        throw new Response('Unauthorized', { status: 401 });
    }

    const formData = await request.formData();
    const intent = formData.get('intent');
    const appointmentId = formData.get('appointmentId') as string;

    if (intent === 'cancel') {
        await updateAppointmentStatus(appointmentId, 'CANCELLED');
        return data({ success: true });
    }

    if (intent === 'delete') {
        await deleteAppointment(appointmentId);
        return data({ success: true });
    }

    return data({ error: 'Invalid action' }, { status: 400 });
}

function AppointmentCard({
    appointment,
    showCancel
}: {
    appointment: {
        id: string;
        scheduledFor: string | Date;
        type: string;
        status: string;
        notes: string | null;
        vehicle: { year: number; make: string; model: string };
        repair: { id: string; description: string } | null;
    };
    showCancel?: boolean;
}) {
    const fetcher = useFetcher();
    const isCancelled =
        fetcher.formData?.get('intent') === 'cancel' ||
        appointment.status === 'CANCELLED';

    return (
        <Card key={appointment.id}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium">
                            {formatDateTime(appointment.scheduledFor)}
                        </p>
                        <StatusBadge
                            status={
                                isCancelled ? 'CANCELLED' : appointment.status
                            }
                        />
                    </div>
                    <p className="text-sm text-zinc-600">
                        {appointment.type.replace(/_/g, ' ')} —{' '}
                        {appointment.vehicle.year} {appointment.vehicle.make}{' '}
                        {appointment.vehicle.model}
                    </p>
                    {appointment.notes && (
                        <p className="text-sm text-zinc-500 mt-1">
                            {appointment.notes}
                        </p>
                    )}
                    {appointment.repair && (
                        <p className="text-sm text-zinc-500 mt-1">
                            Repair: {appointment.repair.description}
                        </p>
                    )}
                </div>
                {showCancel &&
                    !isCancelled &&
                    appointment.status !== 'COMPLETED' && (
                        <fetcher.Form method="post">
                            <input type="hidden" name="intent" value="cancel" />
                            <input
                                type="hidden"
                                name="appointmentId"
                                value={appointment.id}
                            />
                            <Button type="submit" variant="secondary" size="sm">
                                {fetcher.state === 'submitting'
                                    ? 'Cancelling...'
                                    : 'Cancel'}
                            </Button>
                        </fetcher.Form>
                    )}
            </div>
        </Card>
    );
}

export default function Appointments({ loaderData }: Route.ComponentProps) {
    const { upcoming, past } = loaderData;

    return (
        <>
            <title>My Appointments | Stealthy Chicken</title>
            <meta
                name="description"
                content="View and manage your appointments"
            />

            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <Heading size="xl" bold className="mb-2">
                        My Appointments
                    </Heading>
                    <p className="text-zinc-600">
                        View and manage your scheduled appointments
                    </p>
                </div>
                <AppLink
                    to="/appointments/new"
                    className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 transition-colors"
                >
                    New Appointment
                </AppLink>
            </div>

            <Heading size="lg" bold className="mb-4">
                Upcoming
            </Heading>
            {upcoming.length === 0 ? (
                <Card className="mb-6">
                    <p className="text-zinc-500 text-center py-4">
                        No upcoming appointments.
                    </p>
                </Card>
            ) : (
                <div className="space-y-3 mb-6">
                    {upcoming.map(function (appointment) {
                        return (
                            <AppointmentCard
                                key={appointment.id}
                                appointment={appointment}
                                showCancel
                            />
                        );
                    })}
                </div>
            )}

            <Heading size="lg" bold className="mb-4">
                Past
            </Heading>
            {past.length === 0 ? (
                <Card>
                    <p className="text-zinc-500 text-center py-4">
                        No past appointments.
                    </p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {past.map(function (appointment) {
                        return (
                            <AppointmentCard
                                key={appointment.id}
                                appointment={appointment}
                            />
                        );
                    })}
                </div>
            )}
        </>
    );
}
