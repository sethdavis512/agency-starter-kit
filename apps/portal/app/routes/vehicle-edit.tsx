import type { Route } from './+types/vehicle-edit';
import { userContext } from '@repo/auth/context';
import {
    getVehicleById,
    updateVehicle,
    deleteVehicle
} from '@repo/database/models/vehicle.server';
import { Form, redirect, data, useFetcher } from 'react-router';
import { Card } from '@repo/ui/card';
import { Heading } from '@repo/ui/heading';
import { AppLink } from '@repo/ui/app-link';
import { Button } from '@repo/ui/button';
import { createVehicleSchema } from '@repo/validation/vehicle';

export async function loader({ params, context }: Route.LoaderArgs) {
    const user = context.get(userContext);

    if (!user) {
        throw new Response('Unauthorized', { status: 401 });
    }

    const vehicle = await getVehicleById(params.id);

    if (!vehicle || vehicle.userId !== user.id) {
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
    const intent = formData.get('intent');

    if (intent === 'delete') {
        await deleteVehicle(params.id);
        return redirect('/vehicles');
    }

    const raw = {
        year: Number(formData.get('year')),
        make: formData.get('make') as string,
        model: formData.get('model') as string,
        vin: (formData.get('vin') as string) || undefined,
        color: (formData.get('color') as string) || undefined
    };

    const result = createVehicleSchema.safeParse(raw);

    if (!result.success) {
        const firstError = result.error.issues[0]?.message ?? 'Invalid input';
        return data(
            { error: firstError, values: { ...raw, year: String(raw.year) } },
            { status: 400 }
        );
    }

    await updateVehicle(params.id, {
        year: result.data.year,
        make: result.data.make,
        model: result.data.model,
        vin: result.data.vin || null,
        color: result.data.color || null
    });

    return redirect(`/vehicles/${params.id}`);
}

export default function VehicleEdit({
    loaderData,
    actionData
}: Route.ComponentProps) {
    const { vehicle } = loaderData;
    const deleteFetcher = useFetcher();

    return (
        <>
            <title>Edit Vehicle | Stealthy Chicken</title>
            <meta name="description" content="Edit vehicle details" />

            <div className="mb-6">
                <AppLink
                    to={`/vehicles/${vehicle.id}`}
                    className="text-amber-600 hover:underline mb-2 inline-block"
                >
                    ← Back to vehicle
                </AppLink>
                <Heading size="xl" bold>
                    Edit Vehicle
                </Heading>
            </div>

            {actionData?.error && (
                <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-4 text-red-700">
                    {actionData.error}
                </div>
            )}

            <Card className="mb-4">
                <Form method="post" className="space-y-4">
                    <div>
                        <label
                            htmlFor="year"
                            className="block text-sm font-medium text-zinc-700 mb-1"
                        >
                            Year
                        </label>
                        <input
                            type="number"
                            id="year"
                            name="year"
                            required
                            min={1900}
                            defaultValue={
                                actionData?.values?.year ?? vehicle.year
                            }
                            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="make"
                            className="block text-sm font-medium text-zinc-700 mb-1"
                        >
                            Make
                        </label>
                        <input
                            type="text"
                            id="make"
                            name="make"
                            required
                            defaultValue={
                                actionData?.values?.make ?? vehicle.make
                            }
                            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="model"
                            className="block text-sm font-medium text-zinc-700 mb-1"
                        >
                            Model
                        </label>
                        <input
                            type="text"
                            id="model"
                            name="model"
                            required
                            defaultValue={
                                actionData?.values?.model ?? vehicle.model
                            }
                            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="color"
                            className="block text-sm font-medium text-zinc-700 mb-1"
                        >
                            Color (optional)
                        </label>
                        <input
                            type="text"
                            id="color"
                            name="color"
                            defaultValue={
                                actionData?.values?.color ?? vehicle.color ?? ''
                            }
                            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="vin"
                            className="block text-sm font-medium text-zinc-700 mb-1"
                        >
                            VIN (optional)
                        </label>
                        <input
                            type="text"
                            id="vin"
                            name="vin"
                            maxLength={17}
                            defaultValue={
                                actionData?.values?.vin ?? vehicle.vin ?? ''
                            }
                            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                    </div>

                    <Button type="submit" variant="primary">
                        Save Changes
                    </Button>
                </Form>
            </Card>

            <Card>
                <h3 className="text-sm font-semibold text-red-600 mb-2">
                    Danger Zone
                </h3>
                <p className="text-sm text-zinc-600 mb-3">
                    Deleting a vehicle will remove it permanently. This cannot
                    be undone.
                </p>
                <deleteFetcher.Form method="post">
                    <input type="hidden" name="intent" value="delete" />
                    <Button
                        type="submit"
                        variant="secondary"
                        size="sm"
                        onClick={function (e) {
                            if (
                                !confirm(
                                    'Are you sure you want to delete this vehicle?'
                                )
                            ) {
                                e.preventDefault();
                            }
                        }}
                    >
                        Delete Vehicle
                    </Button>
                </deleteFetcher.Form>
            </Card>
        </>
    );
}
