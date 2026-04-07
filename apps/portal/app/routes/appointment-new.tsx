import {
    Form,
    redirect,
    data,
    useNavigation,
    isRouteErrorResponse,
    useRouteError
} from 'react-router';
import { Card } from '@repo/ui/card';
import { Heading } from '@repo/ui/heading';
import { AppLink } from '@repo/ui/app-link';
import { Button } from '@repo/ui/button';
import { parseDateTimeLocal } from '@repo/utils/date';
import type { Route } from './+types/appointment-new';
import { userContext } from '@repo/auth/context';
import { getVehiclesByUserId } from '@repo/database/models/vehicle.server';
import { getVehicleById } from '@repo/database/models/vehicle.server';
import { createAppointment } from '@repo/database/models/appointment.server';
import { createAppointmentSchema } from '@repo/validation/appointment';

export async function loader({ context }: Route.LoaderArgs) {
    const user = context.get(userContext);

    if (!user) {
        throw new Response('Unauthorized', { status: 401 });
    }

    const vehicles = await getVehiclesByUserId(user.id);

    return { vehicles };
}

export async function action({ request, context }: Route.ActionArgs) {
    const user = context.get(userContext);

    if (!user) {
        throw new Response('Unauthorized', { status: 401 });
    }

    const formData = await request.formData();
    const vehicleId = formData.get('vehicleId') as string;

    if (!vehicleId) {
        return data({ error: 'Please select a vehicle.' }, { status: 400 });
    }

    const vehicle = await getVehicleById(vehicleId);

    if (!vehicle || vehicle.userId !== user.id) {
        return data({ error: 'Invalid vehicle selected.' }, { status: 400 });
    }

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
        vehicleId
    });

    return redirect(`/vehicles/${vehicleId}`);
}

export default function AppointmentNew({
    loaderData,
    actionData
}: Route.ComponentProps) {
    const { vehicles } = loaderData;
    const navigation = useNavigation();
    const isSubmitting = navigation.state === 'submitting';

    return (
        <>
            <title>Schedule Appointment | Stealthy Chicken</title>
            <meta
                name="description"
                content="Schedule a new appointment for your vehicle"
            />

            <div className="mb-6">
                <Heading size="xl" bold>
                    Schedule Appointment
                </Heading>
                <p className="text-zinc-600 mt-1">
                    Pick a vehicle and choose a date and time
                </p>
            </div>

            {actionData?.error && (
                <div
                    role="alert"
                    aria-live="assertive"
                    className="mb-4 rounded-md bg-red-50 border border-red-200 p-4 text-red-700"
                >
                    {actionData.error}
                </div>
            )}

            {vehicles.length === 0 ? (
                <Card>
                    <p className="text-zinc-500 text-center py-8">
                        You need to add a vehicle before scheduling an
                        appointment.
                    </p>
                    <div className="text-center mt-2">
                        <AppLink to="/vehicles/new">Add a Vehicle</AppLink>
                    </div>
                </Card>
            ) : (
                <Card>
                    <Form method="post" className="space-y-4">
                        <div>
                            <label
                                htmlFor="vehicleId"
                                className="block text-sm font-medium text-zinc-700 mb-1"
                            >
                                Vehicle
                            </label>
                            <select
                                id="vehicleId"
                                name="vehicleId"
                                required
                                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            >
                                <option value="">Select a vehicle...</option>
                                {vehicles.map(function (vehicle) {
                                    return (
                                        <option
                                            key={vehicle.id}
                                            value={vehicle.id}
                                        >
                                            {vehicle.year} {vehicle.make}{' '}
                                            {vehicle.model}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

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

                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isSubmitting}
                        >
                            {isSubmitting
                                ? 'Scheduling...'
                                : 'Schedule Appointment'}
                        </Button>
                    </Form>
                </Card>
            )}
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
