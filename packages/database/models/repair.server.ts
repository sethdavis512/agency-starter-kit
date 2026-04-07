import type { RepairStatus } from '@prisma/client';
import { prisma } from '../src';

export function getRepairsByUserId(userId: string) {
    return prisma.repair.findMany({
        where: { userId },
        include: { vehicle: true, transaction: true },
        orderBy: { createdAt: 'desc' }
    });
}

export function getRepairsByVehicleId(vehicleId: string) {
    return prisma.repair.findMany({
        where: { vehicleId },
        include: { transaction: true },
        orderBy: { createdAt: 'desc' }
    });
}

export function getRepairById(id: string) {
    return prisma.repair.findUnique({
        where: { id },
        include: { vehicle: true, user: true, transaction: true }
    });
}

export function getAllRepairs() {
    return prisma.repair.findMany({
        include: { vehicle: true, user: true, transaction: true },
        orderBy: { createdAt: 'desc' }
    });
}

export function getRepairsByStatus(status: RepairStatus) {
    return prisma.repair.findMany({
        where: { status },
        include: { vehicle: true, user: true, transaction: true },
        orderBy: { createdAt: 'desc' }
    });
}

export function createRepair(data: {
    description: string;
    userId: string;
    vehicleId: string;
    notes?: string;
    appointmentId?: string;
}) {
    const { appointmentId, ...repairData } = data;

    return prisma.$transaction(async (tx) => {
        const repair = await tx.repair.create({
            data: repairData,
            include: { vehicle: true, user: true }
        });

        // Link appointment to this repair if specified
        if (appointmentId) {
            await tx.appointment.update({
                where: { id: appointmentId },
                data: { repairId: repair.id }
            });
        }

        return repair;
    });
}

export function updateRepairStatus(id: string, status: RepairStatus) {
    return prisma.repair.update({
        where: { id },
        data: { status }
    });
}

export function setRepairQuote(
    id: string,
    data: { quoteAmount: number; quoteDescription: string }
) {
    return prisma.repair.update({
        where: { id },
        data: { ...data, status: 'QUOTED' }
    });
}

export function approveRepairQuote(id: string) {
    return prisma.repair.update({
        where: { id },
        data: { quoteApprovedAt: new Date(), status: 'APPROVED' }
    });
}

export function updateRepairNotes(id: string, notes: string) {
    return prisma.repair.update({
        where: { id },
        data: { notes }
    });
}

export function updateRepair(
    id: string,
    data: {
        description?: string;
        notes?: string;
        status?: RepairStatus;
        scheduledDropOff?: Date | null;
        scheduledPickup?: Date | null;
        estimatedCompletion?: Date | null;
    }
) {
    return prisma.repair.update({
        where: { id },
        data,
        include: { vehicle: true, user: true, transaction: true }
    });
}

export function searchRepairsPaginated(
    page: number = 1,
    pageSize: number = 10,
    options?: { status?: RepairStatus; search?: string }
) {
    const skip = (page - 1) * pageSize;
    const where: Record<string, unknown> = {};

    if (options?.status) {
        where.status = options.status;
    }

    if (options?.search) {
        where.OR = [
            { description: { contains: options.search, mode: 'insensitive' } },
            {
                user: {
                    name: { contains: options.search, mode: 'insensitive' }
                }
            },
            {
                user: {
                    email: { contains: options.search, mode: 'insensitive' }
                }
            },
            {
                vehicle: {
                    make: { contains: options.search, mode: 'insensitive' }
                }
            },
            {
                vehicle: {
                    model: { contains: options.search, mode: 'insensitive' }
                }
            }
        ];
    }

    return Promise.all([
        prisma.repair.findMany({
            where,
            skip,
            take: pageSize,
            include: { vehicle: true, user: true, transaction: true },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.repair.count({ where })
    ]).then(function ([repairs, total]) {
        return {
            repairs,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize)
        };
    });
}

export function getRecentRepairs(limit: number = 10) {
    return prisma.repair.findMany({
        take: limit,
        include: { vehicle: true, user: true, transaction: true },
        orderBy: { createdAt: 'desc' }
    });
}

export async function getRepairsPaginated(
    page: number = 1,
    pageSize: number = 10,
    status?: RepairStatus,
    search?: string
) {
    const skip = (page - 1) * pageSize;
    const where: Record<string, unknown> = {};

    if (status) {
        where.status = status;
    }

    if (search) {
        where.OR = [
            { description: { contains: search, mode: 'insensitive' } },
            { user: { name: { contains: search, mode: 'insensitive' } } },
            { user: { email: { contains: search, mode: 'insensitive' } } },
            { vehicle: { make: { contains: search, mode: 'insensitive' } } },
            { vehicle: { model: { contains: search, mode: 'insensitive' } } }
        ];
    }

    const [repairs, total] = await Promise.all([
        prisma.repair.findMany({
            where,
            skip,
            take: pageSize,
            include: { vehicle: true, user: true, transaction: true },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.repair.count({ where })
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return { repairs, total, page, pageSize, totalPages };
}

export function deleteRepair(id: string) {
    return prisma.repair.delete({ where: { id } });
}

export function getActiveRepairsByUserId(userId: string) {
    return prisma.repair.findMany({
        where: { userId, status: 'IN_PROGRESS' },
        include: { vehicle: true, transaction: true },
        orderBy: { createdAt: 'desc' }
    });
}

export function getPendingPaymentsByUserId(userId: string) {
    return prisma.repair.findMany({
        where: { userId, status: 'COMPLETED', transaction: null },
        include: { vehicle: true },
        orderBy: { createdAt: 'desc' }
    });
}
