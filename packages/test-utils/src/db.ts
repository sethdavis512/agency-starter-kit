import { prisma } from '@repo/database'

/**
 * Truncate all tables in FK-safe order.
 * Call in beforeEach for test isolation.
 */
export async function cleanDatabase() {
  await prisma.$transaction([
    prisma.verification.deleteMany(),
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
    prisma.user.deleteMany(),
  ])
}

/**
 * Create a user with sensible defaults. Override any field.
 */
export async function createTestUser(
  overrides: Partial<{
    name: string
    email: string
    role: string
    emailVerified: boolean
  }> = {},
) {
  return prisma.user.create({
    data: {
      name: overrides.name ?? 'Test User',
      email: overrides.email ?? `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      role: overrides.role ?? 'user',
      emailVerified: overrides.emailVerified ?? true,
    },
  })
}
