import { Card } from '@repo/ui/card';
import { Heading } from '@repo/ui/heading';
import { AppLink } from '@repo/ui/app-link';
import type { Route } from './+types/vehicles';
import { userContext } from '@repo/auth/context';
import { getVehiclesWithRepairCount } from '@repo/database/models/vehicle.server';

export async function loader({ context }: Route.LoaderArgs) {
    const user = context.get(userContext);

    if (!user) {
        throw new Response('Unauthorized', { status: 401 });
    }

    const vehicles = await getVehiclesWithRepairCount(user.id);

    return { vehicles };
}

export default function Vehicles({ loaderData }: Route.ComponentProps) {
    const { vehicles } = loaderData;

    return (
        <>
            <title>My Vehicles | Stealthy Chicken</title>
            <meta
                name="description"
                content="View your vehicles and service history"
            />
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <Heading size="xl" bold className="mb-2">
                        My Vehicles
                    </Heading>
                    <p className="text-zinc-600">
                        View your vehicles and their repair history
                    </p>
                </div>
                <AppLink
                    to="/vehicles/new"
                    className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 transition-colors"
                >
                    Add Vehicle
                </AppLink>
            </div>

            {vehicles.length === 0 ? (
                <Card>
                    <p className="text-zinc-500 text-center py-8">
                        No vehicles found.
                    </p>
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {vehicles.map(function (vehicle) {
                        return (
                            <Card key={vehicle.id}>
                                <Heading size="lg" bold className="mb-2">
                                    {vehicle.year} {vehicle.make}{' '}
                                    {vehicle.model}
                                </Heading>
                                <div className="space-y-1 text-sm text-zinc-600 mb-4">
                                    {vehicle.color && (
                                        <p>
                                            <span className="font-medium">
                                                Color:
                                            </span>{' '}
                                            {vehicle.color}
                                        </p>
                                    )}
                                    {vehicle.vin && (
                                        <p>
                                            <span className="font-medium">
                                                VIN:
                                            </span>{' '}
                                            {vehicle.vin}
                                        </p>
                                    )}
                                    <p>
                                        <span className="font-medium">
                                            Repairs:
                                        </span>{' '}
                                        {vehicle.repairCount}
                                    </p>
                                </div>
                                <AppLink
                                    to={`/vehicles/${vehicle.id}`}
                                    className="text-amber-600 hover:underline text-sm"
                                >
                                    View Details →
                                </AppLink>
                            </Card>
                        );
                    })}
                </div>
            )}
        </>
    );
}
