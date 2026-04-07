import { useState, useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Card } from '@repo/ui/card';
import { Heading } from '@repo/ui/heading';
import { Table } from '@repo/ui/table';
import { StatusBadge } from '@repo/ui/status-badge';
import { AppLink } from '@repo/ui/app-link';
import { Button } from '@repo/ui/button';
import { formatDateShort } from '@repo/utils/date';
import type { Route } from './+types/repairs';
import { userContext } from '@repo/auth/context';
import { getRepairsByUserId } from '@repo/database/models/repair.server';
import type { RepairStatus } from '@prisma/client';

export async function loader({ context }: Route.LoaderArgs) {
    const user = context.get(userContext);

    if (!user) {
        throw new Response('Unauthorized', { status: 401 });
    }

    const repairs = await getRepairsByUserId(user.id);

    return { repairs };
}

type RepairRow = Awaited<ReturnType<typeof getRepairsByUserId>>[number];
type FilterTab = 'all' | 'active' | 'pending-payment';

export default function Repairs({ loaderData }: Route.ComponentProps) {
    const [filterTab, setFilterTab] = useState<FilterTab>('all');
    const { repairs } = loaderData;

    const filteredRepairs = repairs.filter((repair: RepairRow) => {
        if (filterTab === 'active') {
            return repair.status === 'IN_PROGRESS';
        }
        if (filterTab === 'pending-payment') {
            return repair.status === 'COMPLETED' && !repair.transaction;
        }
        return true;
    });

    const columns = useMemo<ColumnDef<RepairRow>[]>(
        () => [
            {
                header: 'Vehicle',
                accessorKey: 'vehicle',
                cell: function (info) {
                    const vehicle = info.getValue() as RepairRow['vehicle'];
                    return `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
                },
                enableSorting: false
            },
            {
                header: 'Description',
                accessorKey: 'description',
                cell: function (info) {
                    const desc = info.getValue() as string;
                    return (
                        <span className="block max-w-xs truncate">{desc}</span>
                    );
                },
                enableSorting: false
            },
            {
                header: 'Status',
                accessorKey: 'status',
                cell: function (info) {
                    const status = info.getValue() as RepairStatus;
                    return <StatusBadge status={status} />;
                }
            },
            {
                header: 'Created',
                accessorKey: 'createdAt',
                cell: function (info) {
                    const date = info.getValue() as string;
                    return formatDateShort(date);
                }
            },
            {
                header: 'Est. Completion',
                accessorKey: 'estimatedCompletion',
                cell: function (info) {
                    const date = info.getValue() as string | null;
                    return date ? formatDateShort(date) : '—';
                },
                enableSorting: false
            },
            {
                header: 'Amount',
                accessorKey: 'quoteAmount',
                cell: function (info) {
                    const amount = info.getValue() as number | null;
                    return amount ? `$${amount.toFixed(2)}` : '—';
                }
            },
            {
                header: '',
                accessorKey: 'id',
                cell: function (info) {
                    const id = info.getValue() as string;
                    return <AppLink to={`/repairs/${id}`}>View →</AppLink>;
                },
                enableSorting: false
            }
        ],
        []
    );

    return (
        <>
            <title>My Repairs | Stealthy Chicken</title>
            <meta
                name="description"
                content="View your repair history and status"
            />
            <div className="mb-6">
                <Heading size="xl" bold className="mb-2">
                    My Repairs
                </Heading>
                <p className="text-zinc-600">
                    Track your vehicle repairs and service history
                </p>
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
                <Button
                    onClick={function () {
                        setFilterTab('all');
                    }}
                    variant={filterTab === 'all' ? 'primary' : 'default'}
                    size="sm"
                >
                    All ({repairs.length})
                </Button>
                <Button
                    onClick={function () {
                        setFilterTab('active');
                    }}
                    variant={filterTab === 'active' ? 'primary' : 'default'}
                    size="sm"
                >
                    Active (
                    {
                        repairs.filter(
                            (r: RepairRow) => r.status === 'IN_PROGRESS'
                        ).length
                    }
                    )
                </Button>
                <Button
                    onClick={function () {
                        setFilterTab('pending-payment');
                    }}
                    variant={
                        filterTab === 'pending-payment' ? 'primary' : 'default'
                    }
                    size="sm"
                >
                    Pending Payment (
                    {
                        repairs.filter(
                            (r: RepairRow) =>
                                r.status === 'COMPLETED' && !r.transaction
                        ).length
                    }
                    )
                </Button>
            </div>

            {filteredRepairs.length === 0 ? (
                <Card>
                    <p className="text-zinc-500 text-center py-8">
                        {filterTab === 'all'
                            ? 'No repairs found.'
                            : filterTab === 'active'
                              ? 'No active repairs.'
                              : 'No pending payments.'}
                    </p>
                </Card>
            ) : (
                <Card>
                    <Table data={filteredRepairs} columns={columns} />
                </Card>
            )}
        </>
    );
}
