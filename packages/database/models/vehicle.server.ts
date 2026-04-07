import { prisma } from '../src';

export function getVehiclesByUserId(userId: string) {
    return prisma.vehicle.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
    });
}

export function getVehicleById(id: string) {
    return prisma.vehicle.findUnique({
        where: { id },
        include: { user: true }
    });
}

export function createVehicle(data: {
    year: number;
    make: string;
    model: string;
    vin?: string;
    color?: string;
    userId: string;
}) {
    return prisma.vehicle.create({ data });
}

export function updateVehicle(
    id: string,
    data: {
        year?: number;
        make?: string;
        model?: string;
        vin?: string | null;
        color?: string | null;
    }
) {
    return prisma.vehicle.update({ where: { id }, data });
}

export function getVehicleWithDetails(id: string) {
    return prisma.vehicle.findUnique({
        where: { id },
        include: {
            user: true,
            repairs: {
                include: { transaction: true },
                orderBy: { createdAt: 'desc' }
            },
            appointments: {
                orderBy: { scheduledFor: 'desc' }
            }
        }
    });
}

export function deleteVehicle(id: string) {
    return prisma.vehicle.delete({ where: { id } });
}

export function getVehiclesWithRepairCount(userId: string) {
    return prisma.vehicle
        .findMany({
            where: { userId },
            include: { _count: { select: { repairs: true } } },
            orderBy: { createdAt: 'desc' }
        })
        .then(function (vehicles) {
            return vehicles.map(function (v) {
                const { _count, ...rest } = v;
                return { ...rest, repairCount: _count.repairs };
            });
        });
}
