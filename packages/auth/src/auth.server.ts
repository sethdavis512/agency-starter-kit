import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '@repo/database';

const trustedOriginsFromEnv =
    process.env.TRUSTED_ORIGINS?.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean) ?? [];

if (!process.env.BETTER_AUTH_URL) {
    throw new Error(
        "BETTER_AUTH_URL is required — @repo/auth is shared by both portal and admin, so it " +
            "cannot default to either app's port. Set it in the app's .env (see .env.example)."
    );
}

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL,
    trustedOrigins: [
        'http://localhost:5510',
        'http://localhost:5520',
        ...trustedOriginsFromEnv
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
