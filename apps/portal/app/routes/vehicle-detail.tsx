import type { ColumnDef } from '@tanstack/react-table';
import { Card } from '@repo/ui/card';
import { Heading } from '@repo/ui/heading';
import { AppLink } from '@repo/ui/app-link';
import { StatusBadge } from '@repo/ui/status-badge';
import { Table } from '@repo/ui/table';
import type { Route } from './+types/vehicle-detail';
import { userContext } from '@repo/auth/context';
import { getVehicleWithDetails } from '@repo/database/models/vehicle.server';
import { formatDateShort, formatDateTime } from '@repo/utils/date';

export async function loader({ params, context }: Route.LoaderArgs) {
    const user = context.get(userContext);

    if (!user) {
        throw new Response('Unauthorized', { status: 401 });
    }

    const vehicle = await getVehicleWithDetails(params.id);

    if (!vehicle) {
        throw new Response('Not Found', { status: 404 });
    }

    if (vehicle.userId !== user.id) {
        throw new Response('Not Found', { status: 404 });
    }

    const totalRepairs = vehicle.repairs.length;
    const activeRepairs = vehicle.repairs.filter(function (r) {
        return r.status !== 'COMPLETED' && r.status !== 'CANCELLED';
    }).length;
    const completedRepairs = vehicle.repairs.filter(function (r) {
        return r.status === 'COMPLETED';
    }).length;

    return {
        vehicle,
        stats: { totalRepairs, activeRepairs, completedRepairs }
    };
}

type RepairRow = {
    id: string;
    description: string;
    status: string;
    createdAt: string;
    amount: number | null;
};

const repairColumns: ColumnDef<RepairRow, unknown>[] = [
    {
        accessorKey: 'description',
        header: 'Description'
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: function ({ getValue }) {
            return <StatusBadge status={getValue() as string} />;
        }
    },
    {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: function ({ getValue }) {
            return formatDateShort(getValue() as string);
        }
    },
    {
        accessorKey: 'amount',
        header: 'Amount',
        cell: function ({ getValue }) {
            const amount = getValue() as number | null;
            return amount != null ? `$${amount.toFixed(2)}` : '—';
        }
    },
    {
        accessorKey: 'id',
        header: '',
        enableSorting: false,
        cell: function ({ getValue }) {
            return (
                <AppLink
                    to={`/repairs/${getValue()}`}
                    className="text-amber-600 hover:underline"
                >
                    View
                </AppLink>
            );
        }
    }
];

export default function VehicleDetail({ loaderData }: Route.ComponentProps) {
    const { vehicle, stats } = loaderData;

    const repairRows: RepairRow[] = vehicle.repairs.map(function (repair) {
        return {
            id: repair.id,
            description: repair.description,
            status: repair.status,
            createdAt: repair.createdAt,
            amount: repair.transaction?.amount ?? null
        };
    });

    const upcomingAppointments = vehicle.appointments.filter(function (a) {
        return (
            a.status !== 'COMPLETED' &&
            a.status !== 'CANCELLED' &&
            new Date(a.scheduledFor) >= new Date()
        );
    });

    return (
        <>
            <title>{`${vehicle.year} ${vehicle.make} ${vehicle.model} | Stealthy Chicken`}</title>
            <meta
                name="description"
                content={`Details for ${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            />

            <div className="mb-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <Heading size="xl" bold>
                        {vehicle.year} {vehicle.make} {vehicle.model}
                    </Heading>
                    <AppLink
                        to={`/vehicles/${vehicle.id}/edit`}
                        className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 transition-colors"
                    >
                        Edit Vehicle
                    </AppLink>
                </div>
            </div>

            <div className="space-y-6">
                {/* Vehicle Info */}
                <Card>
                    <Heading size="lg" bold className="mb-4">
                        Vehicle Information
                    </Heading>
                    <div className="space-y-2">
                        <p className="text-zinc-600">
                            <span className="font-medium">
                                Year/Make/Model:
                            </span>{' '}
                            {vehicle.year} {vehicle.make} {vehicle.model}
                        </p>
                        {vehicle.color && (
                            <p className="text-zinc-600">
                                <span className="font-medium">Color:</span>{' '}
                                {vehicle.color}
                            </p>
                        )}
                        {vehicle.vin && (
                            <p className="text-zinc-600">
                                <span className="font-medium">VIN:</span>{' '}
                                {vehicle.vin}
                            </p>
                        )}
                    </div>
                </Card>

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <Card>
                        <p className="text-sm text-zinc-500">Total Repairs</p>
                        <p className="text-2xl font-bold">
                            {stats.totalRepairs}
                        </p>
                    </Card>
                    <Card>
                        <p className="text-sm text-zinc-500">Active</p>
                        <p className="text-2xl font-bold text-yellow-600">
                            {stats.activeRepairs}
                        </p>
                    </Card>
                    <Card>
                        <p className="text-sm text-zinc-500">Completed</p>
                        <p className="text-2xl font-bold text-green-600">
                            {stats.completedRepairs}
                        </p>
                    </Card>
                </div>

                {/* Repair History */}
                <Card>
                    <Heading size="lg" bold className="mb-4">
                        Repair History
                    </Heading>
                    {repairRows.length === 0 ? (
                        <p className="text-zinc-500 text-center py-4">
                            No repairs on record.
                        </p>
                    ) : (
                        <Table data={repairRows} columns={repairColumns} />
                    )}
                </Card>

                {/* Appointments */}
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <Heading size="lg" bold>
                            Upcoming Appointments
                        </Heading>
                        <AppLink
                            to={`/vehicles/${vehicle.id}/appointments/new`}
                        >
                            Schedule Appointment
                        </AppLink>
                    </div>
                    {upcomingAppointments.length === 0 ? (
                        <p className="text-zinc-500 text-center py-4">
                            No upcoming appointments.
                        </p>
                    ) : (
                        <ul className="divide-y divide-zinc-200">
                            {upcomingAppointments.map(function (appointment) {
                                return (
                                    <li
                                        key={appointment.id}
                                        className="py-3 flex items-center justify-between"
                                    >
                                        <div>
                                            <p className="font-medium">
                                                {appointment.type}
                                            </p>
                                            <p className="text-sm text-zinc-500">
                                                {formatDateTime(
                                                    appointment.scheduledFor
                                                )}
                                            </p>
                                            {appointment.notes && (
                                                <p className="text-sm text-zinc-400">
                                                    {appointment.notes}
                                                </p>
                                            )}
                                        </div>
                                        <StatusBadge
                                            status={appointment.status}
                                        />
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </Card>
            </div>
        </>
    );
}
