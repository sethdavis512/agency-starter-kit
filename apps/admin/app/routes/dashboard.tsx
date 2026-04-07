import type { Route } from './+types/dashboard';
import { getDashboardStats } from '@repo/database/models/stats.server';
import { getRecentRepairs } from '@repo/database/models/repair.server';
import { getUpcomingAppointments } from '@repo/database/models/appointment.server';
import { Card } from '@repo/ui/card';
import { Heading } from '@repo/ui/heading';
import { StatusBadge } from '@repo/ui/status-badge';
import { Table } from '@repo/ui/table';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { DollarSign, Wrench, Activity, CalendarDays } from '@repo/utils/icons';
import { AppLink } from '@repo/ui/app-link';
import { formatDateTimeShort } from '@repo/utils/date';

export async function loader() {
    const [stats, recentRepairs, upcomingAppointments] = await Promise.all([
        getDashboardStats(),
        getRecentRepairs(5),
        getUpcomingAppointments(5)
    ]);

    return { stats, recentRepairs, upcomingAppointments };
}

type RepairRow = Awaited<ReturnType<typeof getRecentRepairs>>[number];
type AppointmentRow = Awaited<
    ReturnType<typeof getUpcomingAppointments>
>[number];

export default function Dashboard({ loaderData }: Route.ComponentProps) {
    const columns = useMemo<ColumnDef<RepairRow>[]>(
        () => [
            {
                accessorKey: 'createdAt',
                header: 'Date',
                cell: function (info) {
                    const date = info.getValue() as string;
                    return formatDateTimeShort(date);
                }
            },
            {
                accessorKey: 'user',
                header: 'Customer',
                cell: function (info) {
                    const user = info.getValue() as RepairRow['user'];
                    const repairId = info.row.original.id;
                    return (
                        <AppLink to={`/repairs/${repairId}`} variant="dark">
                            {user.name}
                        </AppLink>
                    );
                },
                enableSorting: false
            },
            {
                accessorKey: 'vehicle',
                header: 'Vehicle',
                cell: function (info) {
                    const v = info.getValue() as RepairRow['vehicle'];
                    return `${v.year} ${v.make} ${v.model}`;
                },
                enableSorting: false
            },
            {
                accessorKey: 'status',
                header: 'Status',
                cell: function (info) {
                    const status = info.getValue() as string;
                    return <StatusBadge status={status as any} />;
                }
            },
            {
                accessorKey: 'description',
                header: 'Description',
                cell: function (info) {
                    const desc = info.getValue() as string;
                    return (
                        <span className="block max-w-xs truncate">{desc}</span>
                    );
                },
                enableSorting: false
            },
            {
                id: 'actions',
                header: '',
                cell: function (info) {
                    const repairId = info.row.original.id;
                    return (
                        <AppLink to={`/repairs/${repairId}`} variant="dark">
                            View →
                        </AppLink>
                    );
                },
                enableSorting: false
            }
        ],
        []
    );

    const appointmentColumns = useMemo<ColumnDef<AppointmentRow>[]>(
        () => [
            {
                accessorKey: 'scheduledFor',
                header: 'Date',
                cell: function (info) {
                    const date = info.getValue() as string;
                    const appointmentId = info.row.original.id;
                    return (
                        <AppLink
                            to={`/appointments/${appointmentId}`}
                            variant="dark"
                        >
                            {formatDateTimeShort(date)}
                        </AppLink>
                    );
                }
            },
            {
                accessorKey: 'user',
                header: 'Customer',
                cell: function (info) {
                    const user = info.getValue() as AppointmentRow['user'];
                    const appointmentId = info.row.original.id;
                    return (
                        <AppLink
                            to={`/appointments/${appointmentId}`}
                            variant="dark"
                        >
                            {user.name}
                        </AppLink>
                    );
                },
                enableSorting: false
            },
            {
                accessorKey: 'vehicle',
                header: 'Vehicle',
                cell: function (info) {
                    const v = info.getValue() as AppointmentRow['vehicle'];
                    return `${v.year} ${v.make} ${v.model}`;
                },
                enableSorting: false
            },
            {
                accessorKey: 'type',
                header: 'Type',
                cell: function (info) {
                    const type = info.getValue() as string;
                    return type.replace('_', ' ');
                }
            },
            {
                id: 'status',
                header: 'Status',
                cell: function (info) {
                    const appointment = info.row.original;
                    const status = appointment.repair
                        ? appointment.repair.status
                        : appointment.status;
                    return <StatusBadge status={status as any} />;
                }
            },
            {
                id: 'actions',
                header: '',
                cell: function (info) {
                    const appointment = info.row.original;
                    if (appointment.repair) {
                        return (
                            <AppLink
                                to={`/repairs/${appointment.repair.id}`}
                                variant="dark"
                            >
                                View Repair
                            </AppLink>
                        );
                    }
                    return (
                        <AppLink
                            to={`/repairs/new?appointmentId=${appointment.id}`}
                            variant="dark"
                        >
                            Start Repair
                        </AppLink>
                    );
                },
                enableSorting: false
            }
        ],
        []
    );

    return (
        <>
            <title>Dashboard | Stealthy Chicken</title>
            <Heading size="xl" bold className="mb-4">
                Dashboard
            </Heading>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card>
                    <div className="flex items-center gap-3">
                        <DollarSign className="h-8 w-8 text-slate-600" />
                        <div>
                            <p className="text-sm text-zinc-500">
                                Today's Revenue
                            </p>
                            <p className="text-2xl font-bold">
                                ${loaderData.stats.todayRevenue.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <Wrench className="h-8 w-8 text-slate-600" />
                        <div>
                            <p className="text-sm text-zinc-500">
                                Repairs This Year
                            </p>
                            <p className="text-2xl font-bold">
                                {loaderData.stats.completedThisYear}
                            </p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <Activity className="h-8 w-8 text-slate-600" />
                        <div>
                            <p className="text-sm text-zinc-500">
                                Active Repairs
                            </p>
                            <p className="text-2xl font-bold">
                                {loaderData.stats.activeRepairs}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
            <Heading size="lg" bold className="mt-8 mb-4">
                <span className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    Upcoming Appointments
                </span>
            </Heading>
            {loaderData.upcomingAppointments.length === 0 ? (
                <p className="text-zinc-500">No upcoming appointments.</p>
            ) : (
                <Table
                    columns={appointmentColumns}
                    data={loaderData.upcomingAppointments}
                />
            )}
            <hr className="my-8 border-slate-300" />
            <Heading size="lg" bold className="mb-4">
                <span className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    Recent Repairs
                </span>
            </Heading>
            {loaderData.recentRepairs.length === 0 ? (
                <p className="text-zinc-500">No repairs found.</p>
            ) : (
                <Table columns={columns} data={loaderData.recentRepairs} />
            )}
            <hr className="my-8 border-slate-300" />
        </>
    );
}
