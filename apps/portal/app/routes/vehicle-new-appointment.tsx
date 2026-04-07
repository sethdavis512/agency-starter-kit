import {
    Form,
    redirect,
    data,
    isRouteErrorResponse,
    useRouteError
} from 'react-router';
import { Card } from '@repo/ui/card';
import { Heading } from '@repo/ui/heading';
import { AppLink } from '@repo/ui/app-link';
import { Button } from '@repo/ui/button';
import { parseDateTimeLocal } from '@repo/utils/date';
import type { Route } from './+types/vehicle-new-appointment';
import { userContext } from '@repo/auth/context';
import { getVehicleById } from '@repo/database/models/vehicle.server';
import { createAppointment } from '@repo/database/models/appointment.server';
import { createAppointmentSchema } from '@repo/validation/appointment';

export async function loader({ params, context }: Route.LoaderArgs) {
    const user = context.get(userContext);

    if (!user) {
        throw new Response('Unauthorized', { status: 401 });
    }

    const vehicle = await getVehicleById(params.id);

    if (!vehicle) {
        throw new Response('Not Found', { status: 404 });
    }

    if (vehicle.userId !== user.id) {
        throw new Response('Not Found', { status: 404 });
    }

    return { vehicle };
}

export async function action({ params, request, context }: Route.ActionArgs) {
    const user = context.get(userContext);

    if (!user) {
        throw new Response('Unauthorized', { status: 401 });
    }

    const vehicle = await getVehicleById(params.id);

    if (!vehicle || vehicle.userId !== user.id) {
        throw new Response('Not Found', { status: 404 });
    }

    const formData = await request.formData();
    const raw = {
        scheduledFor: formData.get('scheduledFor') as string,
        type: (formData.get('type') as string) || 'DROP_OFF',
        notes: (formData.get('notes') as string) || undefined
    };

    const result = createAppointmentSchema.safeParse(raw);

    if (!result.success) {
        const firstError = result.error.issues[0]?.message ?? 'Invalid input';
        return data({ error: firstError }, { status: 400 });
    }

    await createAppointment({
        scheduledFor: parseDateTimeLocal(result.data.scheduledFor),
        type: result.data.type,
        notes: result.data.notes || undefined,
        userId: user.id,
        vehicleId: params.id
    });

    return redirect(`/vehicles/${params.id}`);
}

export default function VehicleNewAppointment({
    loaderData,
    actionData
}: Route.ComponentProps) {
    const { vehicle } = loaderData;

    return (
        <>
            <title>Schedule Appointment | Stealthy Chicken</title>
            <meta
                name="description"
                content={`Schedule an appointment for ${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            />

            <div className="mb-6">
                <AppLink
                    to={`/vehicles/${vehicle.id}`}
                    className="text-amber-600 hover:underline mb-2 inline-block"
                >
                    ← Back to vehicle
                </AppLink>
                <Heading size="xl" bold>
                    Schedule Appointment for {vehicle.year} {vehicle.make}{' '}
                    {vehicle.model}
                </Heading>
            </div>

            {actionData?.error && (
                <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-4 text-red-700">
                    {actionData.error}
                </div>
            )}

            <Card>
                <Form method="post" className="space-y-4">
                    <div>
                        <label
                            htmlFor="scheduledFor"
                            className="block text-sm font-medium text-zinc-700 mb-1"
                        >
                            Date & Time
                        </label>
                        <input
                            type="datetime-local"
                            id="scheduledFor"
                            name="scheduledFor"
                            required
                            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="type"
                            className="block text-sm font-medium text-zinc-700 mb-1"
                        >
                            Appointment Type
                        </label>
                        <select
                            id="type"
                            name="type"
                            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        >
                            <option value="DROP_OFF">Drop Off</option>
                            <option value="PICKUP">Pickup</option>
                            <option value="INSPECTION">Inspection</option>
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="notes"
                            className="block text-sm font-medium text-zinc-700 mb-1"
                        >
                            Notes (optional)
                        </label>
                        <textarea
                            id="notes"
                            name="notes"
                            rows={3}
                            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                    </div>

                    <Button type="submit" variant="primary">
                        Schedule Appointment
                    </Button>
                </Form>
            </Card>
        </>
    );
}

export function ErrorBoundary() {
    const error = useRouteError();

    if (isRouteErrorResponse(error)) {
        return (
            <div className="p-6">
                <h1 className="text-xl font-bold text-red-600 mb-2">
                    {error.status} {error.statusText}
                </h1>
                <p className="text-zinc-600">{error.data}</p>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-xl font-bold text-red-600 mb-2">Error</h1>
            <p className="text-zinc-600">
                {error instanceof Error
                    ? error.message
                    : 'An unexpected error occurred'}
            </p>
        </div>
    );
}
