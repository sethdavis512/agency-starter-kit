import { prisma } from '../src';

export function getNotificationsByUserId(userId: string, limit: number = 20) {
    return prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit
    });
}

export function getUnreadCount(userId: string) {
    return prisma.notification.count({
        where: { userId, read: false }
    });
}

export function markNotificationRead(id: string) {
    return prisma.notification.update({
        where: { id },
        data: { read: true }
    });
}

export function markAllNotificationsRead(userId: string) {
    return prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true }
    });
}

export function createNotification(data: {
    title: string;
    message: string;
    userId: string;
    repairId?: string;
}) {
    return prisma.notification.create({ data });
}

export function deleteNotification(id: string) {
    return prisma.notification.delete({
        where: { id }
    });
}

export function deleteAllNotifications(userId: string) {
    return prisma.notification.deleteMany({
        where: { userId }
    });
}
