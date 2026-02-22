import { describe, expect, it, vi } from 'vitest';

import { GET } from '@/app/api/auth/session/route';

vi.mock('@/server/supabase-server', () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { createSupabaseServerClient } from '@/server/supabase-server';

describe('GET /api/auth/session', () => {
  it('returns 401 when no access token cookie is present', async () => {
    const response = await GET(new Request('http://localhost:3000/api/auth/session'));
    const body = (await response.json()) as { error?: { code?: string } };

    expect(response.status).toBe(401);
    expect(body.error?.code).toBe('UNAUTHORIZED');
  });

  it('returns user details when access token is valid', async () => {
    vi.mocked(createSupabaseServerClient).mockReturnValue({
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: { id: 'user-1', email: 'ada@example.com' } },
          error: null,
        })),
      },
    } as unknown as ReturnType<typeof createSupabaseServerClient>);

    const request = new Request('http://localhost:3000/api/auth/session', {
      headers: {
        Cookie: 'sb-access-token=test-token',
      },
    });
    const response = await GET(request);
    const body = (await response.json()) as { user?: { id?: string; email?: string } };

    expect(response.status).toBe(200);
    expect(body.user?.id).toBe('user-1');
    expect(body.user?.email).toBe('ada@example.com');
  });
});
