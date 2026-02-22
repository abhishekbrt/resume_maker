import { afterEach, describe, expect, it, vi } from 'vitest';

import { AuthAPIError, getSession, logout } from '@/lib/auth-api';

describe('auth-api', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns null for 401 session response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 401 })));

    await expect(getSession()).resolves.toBeNull();
  });

  it('returns user for successful session response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ user: { id: 'user-1', email: 'ada@example.com' } }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
      ),
    );

    await expect(getSession()).resolves.toEqual({ id: 'user-1', email: 'ada@example.com' });
  });

  it('throws AuthAPIError for non-401 failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'boom' } }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }),
      ),
    );

    await expect(getSession()).rejects.toBeInstanceOf(AuthAPIError);
  });

  it('calls logout endpoint with POST', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    await logout();

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });
  });
});
