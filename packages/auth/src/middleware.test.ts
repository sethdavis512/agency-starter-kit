import { describe, it, expect, vi, beforeEach } from 'vitest'
import { requireAuth, requireAdmin } from './middleware'

vi.mock('./auth.server', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}))

import { auth } from './auth.server'

// Mock context that mimics React Router's context API
function createContext(entries = new Map()) {
  return {
    get: (key: unknown) => entries.get(key),
    set: (key: unknown, value: unknown) => entries.set(key, value),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('requireAuth', () => {
  it('redirects to /sign-in when no session exists', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null)

    const request = new Request('http://localhost/dashboard')
    const context = createContext()

    try {
      await requireAuth({ request, context })
      expect.unreachable('should have thrown')
    } catch (response) {
      expect(response).toBeInstanceOf(Response)
      expect((response as Response).status).toBe(302)
      expect((response as Response).headers.get('Location')).toBe('/sign-in')
    }
  })

  it('sets user in context when session exists', async () => {
    const user = { id: '1', email: 'a@b.com', name: 'Alice', role: 'user' }
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user,
      session: { id: 's1', token: 't1' },
    } as any)

    const entries = new Map()
    const context = createContext(entries)
    const request = new Request('http://localhost/dashboard')

    await requireAuth({ request, context })

    // The middleware should have set the user in context
    // We can't check the exact key (it's the userContext symbol), but we can verify set was called
    expect(entries.size).toBe(1)
    const storedUser = [...entries.values()][0]
    expect(storedUser).toEqual(user)
  })
})

describe('requireAdmin', () => {
  it('redirects to /no-access when user is not an admin', async () => {
    const entries = new Map()
    // We need to use the actual userContext key, but since it's imported internally,
    // we set up a context where .get() returns a non-admin user for any key
    const context = {
      get: () => ({ id: '1', email: 'a@b.com', name: 'Alice', role: 'user' }),
      set: vi.fn(),
    }

    try {
      await requireAdmin({ context })
      expect.unreachable('should have thrown')
    } catch (response) {
      expect(response).toBeInstanceOf(Response)
      expect((response as Response).status).toBe(302)
      expect((response as Response).headers.get('Location')).toBe('/no-access')
    }
  })

  it('passes through when user is admin', async () => {
    const context = {
      get: () => ({ id: '1', email: 'admin@b.com', name: 'Admin', role: 'admin' }),
      set: vi.fn(),
    }

    // Should not throw
    await requireAdmin({ context })
  })

  it('redirects when no user in context', async () => {
    const context = {
      get: () => null,
      set: vi.fn(),
    }

    try {
      await requireAdmin({ context })
      expect.unreachable('should have thrown')
    } catch (response) {
      expect(response).toBeInstanceOf(Response)
      expect((response as Response).status).toBe(302)
    }
  })
})
