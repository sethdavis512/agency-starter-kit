/**
 * Create a mock session object matching Better Auth's session shape.
 */
export function mockSession(
  overrides: Partial<{
    userId: string
    email: string
    name: string
    role: string
  }> = {},
) {
  const userId = overrides.userId ?? 'test-user-id'
  return {
    user: {
      id: userId,
      email: overrides.email ?? 'test@example.com',
      name: overrides.name ?? 'Test User',
      role: overrides.role ?? 'user',
    },
    session: {
      id: 'test-session-id',
      token: 'test-token',
      userId,
      expiresAt: new Date(Date.now() + 86400000),
    },
  }
}

/**
 * Create the user context value matching the shape in @repo/auth/context.
 */
export function mockUserContext(
  overrides: Partial<{
    id: string
    email: string
    name: string
    role: string
  }> = {},
) {
  return {
    id: overrides.id ?? 'test-user-id',
    email: overrides.email ?? 'test@example.com',
    name: overrides.name ?? 'Test User',
    role: overrides.role ?? 'user',
  }
}

/**
 * Create a mock Request for testing loaders/actions.
 */
export function createMockRequest(
  url: string,
  options?: RequestInit,
) {
  return new Request(url, options)
}
