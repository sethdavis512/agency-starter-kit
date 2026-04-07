import { useFetcher } from 'react-router';
import { data } from 'react-router';
import { Card } from '@repo/ui/card';
import { Heading } from '@repo/ui/heading';
import { StatusBadge } from '@repo/ui/status-badge';
import { Button } from '@repo/ui/button';
import { AppLink } from '@repo/ui/app-link';
import type { Route } from './+types/repair-detail';
import { userContext } from '@repo/auth/context';
import {
    getRepairById,
    approveRepairQuote
} from '@repo/database/models/repair.server';
import { formatDateTime, formatDate } from '@repo/utils/date';

export async function loader({ params, context }: Route.LoaderArgs) {
    const user = context.get(userContext);

    if (!user) {
        throw new Response('Unauthorized', { status: 401 });
    }

    const repair = await getRepairById(params.id);

    if (!repair) {
        throw new Response('Repair not found', { status: 404 });
    }

    // Verify ownership
    if (repair.userId !== user.id) {
        throw new Response('Not Found', { status: 404 });
    }

    return { repair };
}

export async function action({ params, request, context }: Route.ActionArgs) {
    const user = context.get(userContext);

    if (!user) {
        throw new Response('Unauthorized', { status: 401 });
    }

    const repair = await getRepairById(params.id);

    if (!repair || repair.userId !== user.id) {
        throw new Response('Not Found', { status: 404 });
    }

    const formData = await request.formData();
    const intent = formData.get('intent');

    if (intent === 'approve') {
        await approveRepairQuote(params.id);
        return data({ success: true, message: 'Quote approved successfully' });
    }

    return data({ success: false, message: 'Invalid action' }, { status: 400 });
}

export default function RepairDetail({ loaderData }: Route.ComponentProps) {
    const { repair } = loaderData;
    const fetcher = useFetcher();

    const isApproving = fetcher.state === 'submitting';
    const canApproveQuote =
        repair.status === 'QUOTED' && !repair.quoteApprovedAt;

    const formatDateLocal = (date: Date | string | null) => {
        if (!date) return '—';
        return formatDateTime(date);
    };

    const formatDateOnlyLocal = (date: Date | string | null) => {
        if (!date) return '—';
        return formatDate(date);
    };

    return (
        <>
            <title>Repair Details | Stealthy Chicken</title>
            <meta name="description" content="View repair details and status" />

            <div className="mb-6">
                <AppLink
                    to="/repairs"
                    className="text-amber-600 hover:underline mb-2 inline-block"
                >
                    ← Back to repairs
                </AppLink>
                <Heading size="xl" bold className="mb-2">
                    Repair Details
                </Heading>
            </div>

            <div className="space-y-6">
                {/* Status Section */}
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <Heading size="lg" bold>
                            Status
                        </Heading>
                        <StatusBadge status={repair.status} />
                    </div>
                    <div className="space-y-2">
                        <p className="text-zinc-600">
                            <span className="font-medium">Created:</span>{' '}
                            {formatDateLocal(repair.createdAt)}
                        </p>
                        <p className="text-zinc-600">
                            <span className="font-medium">Last Updated:</span>{' '}
                            {formatDateLocal(repair.updatedAt)}
                        </p>
                    </div>
                </Card>

                {/* Vehicle Information */}
                <Card>
                    <Heading size="lg" bold className="mb-4">
                        Vehicle Information
                    </Heading>
                    <div className="space-y-2">
                        <p className="text-zinc-600">
                            <span className="font-medium">Vehicle:</span>{' '}
                            {repair.vehicle.year} {repair.vehicle.make}{' '}
                            {repair.vehicle.model}
                        </p>
                        {repair.vehicle.color && (
                            <p className="text-zinc-600">
                                <span className="font-medium">Color:</span>{' '}
                                {repair.vehicle.color}
                            </p>
                        )}
                        {repair.vehicle.vin && (
                            <p className="text-zinc-600">
                                <span className="font-medium">VIN:</span>{' '}
                                {repair.vehicle.vin}
                            </p>
                        )}
                    </div>
                </Card>

                {/* Repair Description */}
                <Card>
                    <Heading size="lg" bold className="mb-4">
                        Repair Description
                    </Heading>
                    <p className="text-zinc-800">{repair.description}</p>
                </Card>

                {/* Scheduling Information */}
                {(repair.scheduledDropOff ||
                    repair.scheduledPickup ||
                    repair.estimatedCompletion) && (
                    <Card>
                        <Heading size="lg" bold className="mb-4">
                            Scheduling
                        </Heading>
                        <div className="space-y-2">
                            {repair.scheduledDropOff && (
                                <p className="text-zinc-600">
                                    <span className="font-medium">
                                        Drop-off:
                                    </span>{' '}
                                    {formatDateLocal(repair.scheduledDropOff)}
                                </p>
                            )}
                            {repair.estimatedCompletion && (
                                <p className="text-zinc-600">
                                    <span className="font-medium">
                                        Estimated Completion:
                                    </span>{' '}
                                    {formatDateOnlyLocal(
                                        repair.estimatedCompletion
                                    )}
                                </p>
                            )}
                            {repair.scheduledPickup && (
                                <p className="text-zinc-600">
                                    <span className="font-medium">
                                        Scheduled Pickup:
                                    </span>{' '}
                                    {formatDateLocal(repair.scheduledPickup)}
                                </p>
                            )}
                        </div>
                    </Card>
                )}

                {/* Quote Information */}
                {(repair.quoteAmount || repair.quoteDescription) && (
                    <Card>
                        <Heading size="lg" bold className="mb-4">
                            Quote
                        </Heading>
                        <div className="space-y-3">
                            {repair.quoteDescription && (
                                <p className="text-zinc-800">
                                    {repair.quoteDescription}
                                </p>
                            )}
                            {repair.quoteAmount && (
                                <p className="text-2xl font-bold text-zinc-900">
                                    ${repair.quoteAmount.toFixed(2)}
                                </p>
                            )}
                            {repair.quoteApprovedAt && (
                                <p className="text-green-600 font-medium">
                                    ✓ Approved on{' '}
                                    {formatDateOnlyLocal(
                                        repair.quoteApprovedAt
                                    )}
                                </p>
                            )}
                            {canApproveQuote && (
                                <fetcher.Form method="post">
                                    <input
                                        type="hidden"
                                        name="intent"
                                        value="approve"
                                    />
                                    <Button
                                        type="submit"
                                        disabled={isApproving}
                                        variant="primary"
                                    >
                                        {isApproving
                                            ? 'Approving...'
                                            : 'Approve Quote'}
                                    </Button>
                                </fetcher.Form>
                            )}
                        </div>
                    </Card>
                )}

                {/* Payment Information */}
                {repair.transaction && (
                    <Card>
                        <Heading size="lg" bold className="mb-4">
                            Payment
                        </Heading>
                        <div className="space-y-2">
                            <p className="text-zinc-600">
                                <span className="font-medium">Amount:</span>{' '}
                                <span className="text-2xl font-bold text-green-600">
                                    ${repair.transaction.amount.toFixed(2)}
                                </span>
                            </p>
                            <p className="text-zinc-600">
                                <span className="font-medium">Method:</span>{' '}
                                {repair.transaction.method}
                            </p>
                            <p className="text-zinc-600">
                                <span className="font-medium">Date:</span>{' '}
                                {formatDateLocal(repair.transaction.createdAt)}
                            </p>
                        </div>
                    </Card>
                )}

                {/* Shop Notes */}
                {repair.notes && (
                    <Card>
                        <Heading size="lg" bold className="mb-4">
                            Shop Notes
                        </Heading>
                        <p className="text-zinc-800 whitespace-pre-wrap">
                            {repair.notes}
                        </p>
                    </Card>
                )}
            </div>
        </>
    );
}
