import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loader } from './sign-in'

vi.mock('@repo/auth/server', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}))

import { auth } from '@repo/auth/server'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('sign-in loader', () => {
  it('returns null when no session exists', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null)

    const request = new Request('http://localhost:5520/sign-in')
    const result = await loader({ request, params: {}, context: {} } as any)

    expect(result).toBeNull()
  })

  it('redirects to /dashboard when session exists', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: '1', email: 'test@test.com', name: 'Test' },
      session: { id: 's1', token: 't1' },
    } as any)

    const request = new Request('http://localhost:5520/sign-in')

    try {
      await loader({ request, params: {}, context: {} } as any)
      expect.unreachable('should have thrown a redirect')
    } catch (response) {
      expect(response).toBeInstanceOf(Response)
      expect((response as Response).status).toBe(302)
      expect((response as Response).headers.get('Location')).toBe('/dashboard')
    }
  })

  it('passes request headers to getSession', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null)

    const request = new Request('http://localhost:5520/sign-in', {
      headers: { Cookie: 'session=abc' },
    })
    await loader({ request, params: {}, context: {} } as any)

    expect(auth.api.getSession).toHaveBeenCalledWith({
      headers: request.headers,
    })
  })
})
