import type { AppointmentStatus, AppointmentType } from '@prisma/client';
import { prisma } from '../src';

export function getAppointmentById(id: string) {
    return prisma.appointment.findUnique({
        where: { id },
        include: { user: true, vehicle: true, repair: true }
    });
}

export function getAppointmentsByUserId(userId: string) {
    return prisma.appointment.findMany({
        where: { userId },
        include: { vehicle: true, repair: true },
        orderBy: { scheduledFor: 'desc' }
    });
}

export function getAppointmentsByStatus(status: AppointmentStatus) {
    return prisma.appointment.findMany({
        where: { status },
        include: { user: true, vehicle: true, repair: true },
        orderBy: { scheduledFor: 'desc' }
    });
}

export async function getAppointmentsPaginated(
    page: number = 1,
    pageSize: number = 10,
    status?: AppointmentStatus,
    search?: string
) {
    const skip = (page - 1) * pageSize;
    const where: Record<string, unknown> = {};

    if (status) {
        where.status = status;
    }

    if (search) {
        where.OR = [
            { user: { name: { contains: search, mode: 'insensitive' } } },
            { vehicle: { make: { contains: search, mode: 'insensitive' } } },
            { vehicle: { model: { contains: search, mode: 'insensitive' } } },
            { notes: { contains: search, mode: 'insensitive' } }
        ];
    }

    const [appointments, total] = await Promise.all([
        prisma.appointment.findMany({
            where,
            skip,
            take: pageSize,
            include: { user: true, vehicle: true, repair: true },
            orderBy: { scheduledFor: 'desc' }
        }),
        prisma.appointment.count({ where })
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return { appointments, total, page, pageSize, totalPages };
}

export function createAppointment(data: {
    scheduledFor: Date;
    type?: AppointmentType;
    status?: AppointmentStatus;
    notes?: string;
    userId: string;
    vehicleId: string;
    repairId?: string;
}) {
    return prisma.appointment.create({
        data,
        include: { user: true, vehicle: true, repair: true }
    });
}

export function updateAppointmentStatus(id: string, status: AppointmentStatus) {
    return prisma.appointment.update({
        where: { id },
        data: { status }
    });
}

export function deleteAppointment(id: string) {
    return prisma.appointment.delete({ where: { id } });
}

export function getUpcomingAppointments(limit: number = 5) {
    return prisma.appointment.findMany({
        where: {
            scheduledFor: { gte: new Date() },
            status: { notIn: ['COMPLETED', 'CANCELLED', 'NO_SHOW'] }
        },
        include: { user: true, vehicle: true, repair: true },
        orderBy: { scheduledFor: 'asc' },
        take: limit
    });
}
