import { describe, expect, it, vi } from 'vitest';

import { GET } from '@/app/api/auth/callback/route';

vi.mock('@/server/supabase-server', () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { createSupabaseServerClient } from '@/server/supabase-server';

describe('GET /api/auth/callback', () => {
  it('exchanges auth code and stores session cookies', async () => {
    vi.mocked(createSupabaseServerClient).mockReturnValue({
      auth: {
        exchangeCodeForSession: vi.fn(async () => ({
          data: {
            session: {
              access_token: 'access-token',
              refresh_token: 'refresh-token',
            },
          },
          error: null,
        })),
      },
    } as unknown as ReturnType<typeof createSupabaseServerClient>);

    const response = await GET(
      new Request('http://localhost:3000/api/auth/callback?code=oauth-code'),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/editor');
    const setCookie = response.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('sb-access-token=access-token');
    expect(setCookie).toContain('sb-refresh-token=refresh-token');
  });
});
