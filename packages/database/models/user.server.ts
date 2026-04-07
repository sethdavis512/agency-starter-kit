import { prisma } from '../src';

export function getAllUsers() {
    return prisma.user.findMany();
}

export function getUserById(id: string) {
    return prisma.user.findUnique({
        where: { id },
        include: {
            vehicles: true,
            repairs: {
                include: { vehicle: true, transaction: true },
                orderBy: { createdAt: 'desc' }
            },
            appointments: {
                include: { vehicle: true },
                orderBy: { scheduledFor: 'desc' }
            }
        }
    });
}

export function updateUserRole(id: string, role: string) {
    return prisma.user.update({
        where: { id },
        data: { role }
    });
}

export async function getUsersPaginated(
    page: number = 1,
    pageSize: number = 10,
    search?: string
) {
    const skip = (page - 1) * pageSize;
    const where = search
        ? {
              OR: [
                  { name: { contains: search, mode: 'insensitive' as const } },
                  { email: { contains: search, mode: 'insensitive' as const } },
                  { phone: { contains: search, mode: 'insensitive' as const } }
              ]
          }
        : {};

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            skip,
            take: pageSize,
            include: {
                _count: {
                    select: {
                        vehicles: true,
                        repairs: true,
                        appointments: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ where })
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return {
        users,
        total,
        page,
        pageSize,
        totalPages
    };
}
