import type { PaymentMethod } from '@prisma/client';
import { prisma } from '../src';

export function getTransactionByRepairId(repairId: string) {
    return prisma.transaction.findUnique({
        where: { repairId }
    });
}

export function getTransactionById(id: string) {
    return prisma.transaction.findUnique({
        where: { id },
        include: { repair: { include: { vehicle: true, user: true } } }
    });
}

export async function getTransactionsPaginated(
    page: number = 1,
    pageSize: number = 10,
    search?: string
) {
    const skip = (page - 1) * pageSize;
    const where: Record<string, unknown> = {};

    if (search) {
        where.OR = [
            {
                repair: {
                    user: { name: { contains: search, mode: 'insensitive' } }
                }
            },
            {
                repair: {
                    vehicle: { make: { contains: search, mode: 'insensitive' } }
                }
            },
            {
                repair: {
                    vehicle: {
                        model: { contains: search, mode: 'insensitive' }
                    }
                }
            },
            { method: { contains: search, mode: 'insensitive' } }
        ];
    }

    const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
            where,
            skip,
            take: pageSize,
            include: { repair: { include: { vehicle: true, user: true } } },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.transaction.count({ where })
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return { transactions, total, page, pageSize, totalPages };
}

export function createTransaction(data: {
    amount: number;
    method?: PaymentMethod;
    note?: string;
    repairId: string;
}) {
    return prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.create({ data });
        await tx.repair.update({
            where: { id: data.repairId },
            data: { status: 'PAID' }
        });
        return transaction;
    });
}
