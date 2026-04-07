import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '@repo/database';

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:5510',
    trustedOrigins: [
        'http://localhost:5510',
        'http://localhost:5520'
    ],
    database: prismaAdapter(prisma, {
        provider: 'postgresql'
    }),
    emailAndPassword: {
        enabled: true
    },
    user: {
        additionalFields: {
            role: {
                type: 'string',
                required: false,
                defaultValue: 'user',
                input: false
            },
            phone: {
                type: 'string',
                required: false,
                input: false
            }
        }
    }
});
