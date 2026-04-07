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
import type { Route } from './+types/vehicle-new';
import { userContext } from '@repo/auth/context';
import { createVehicle } from '@repo/database/models/vehicle.server';
import { createVehicleSchema } from '@repo/validation/vehicle';

export async function action({ request, context }: Route.ActionArgs) {
    const user = context.get(userContext);

    if (!user) {
        throw new Response('Unauthorized', { status: 401 });
    }

    const formData = await request.formData();
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
            {
                error: firstError,
                values: { ...raw, year: String(raw.year) }
            },
            { status: 400 }
        );
    }

    const vehicle = await createVehicle({
        year: result.data.year,
        make: result.data.make,
        model: result.data.model,
        vin: result.data.vin || undefined,
        color: result.data.color || undefined,
        userId: user.id
    });

    return redirect(`/vehicles/${vehicle.id}`);
}

export default function VehicleNew({ actionData }: Route.ComponentProps) {
    return (
        <>
            <title>Add Vehicle | Stealthy Chicken</title>
            <meta name="description" content="Add a new vehicle" />

            <div className="mb-6">
                <Heading size="xl" bold>
                    Add Vehicle
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
                            defaultValue={actionData?.values?.year}
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
                            defaultValue={actionData?.values?.make}
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
                            defaultValue={actionData?.values?.model}
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
                            defaultValue={actionData?.values?.color}
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
                            defaultValue={actionData?.values?.vin}
                            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                    </div>

                    <Button type="submit" variant="primary">
                        Add Vehicle
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
