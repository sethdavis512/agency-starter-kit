import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { auth } from '@repo/auth/server';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEFAULT_PASSWORD = 'asdfasdf';

const users = [
    { email: 'seth@mail.com', name: 'Seth Davis', role: 'admin' },
    {
        email: 'diana.martinez@example.com',
        name: 'Diana Martinez',
        role: 'admin'
    },
    { email: 'ethan.brown@example.com', name: 'Ethan Brown', role: 'user' },
    { email: 'fiona.wilson@example.com', name: 'Fiona Wilson', role: 'user' },
    { email: 'george.taylor@example.com', name: 'George Taylor', role: 'user' }
];

async function seed() {
    console.log(`Seeding ${users.length} users...`);

    let created = 0;
    let skipped = 0;

    for (const user of users) {
        const existingUser = await prisma.user.findUnique({
            where: { email: user.email }
        });

        if (existingUser) {
            skipped++;
            continue;
        }

        const result = await auth.api.signUpEmail({
            body: {
                name: user.name,
                email: user.email,
                password: DEFAULT_PASSWORD
            }
        });

        if (result.user) {
            await prisma.user.update({
                where: { id: result.user.id },
                data: { role: user.role }
            });
            created++;
        }
    }

    console.log(`Done: ${created} created, ${skipped} already existed.`);
}

seed()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(() => {
        prisma.$disconnect();
    });
