import { describe, expect, it, vi } from 'vitest';

import { GET } from '@/app/api/auth/callback/route';

vi.mock('@/server/supabase-oauth', () => ({
  createSupabaseOAuthClient: vi.fn(),
}));

import { createSupabaseOAuthClient } from '@/server/supabase-oauth';

describe('GET /api/auth/callback', () => {
  it('returns 401 when OAuth code exchange fails', async () => {
    vi.mocked(createSupabaseOAuthClient).mockResolvedValue({
      auth: {
        exchangeCodeForSession: vi.fn(async () => ({
          data: { session: null },
          error: { name: 'AuthApiError', message: 'code_verifier mismatch' },
        })),
      },
    } as unknown as Awaited<ReturnType<typeof createSupabaseOAuthClient>>);

    const response = await GET(
      new Request('https://resume.abhishekbharti.dev/api/auth/callback?code=oauth-code'),
    );
    const body = (await response.json()) as { error?: { code?: string } };

    expect(response.status).toBe(401);
    expect(body.error?.code).toBe('UNAUTHORIZED');
  });

  it('returns 400 when OAuth code is missing', async () => {
    const response = await GET(new Request('http://localhost:3000/api/auth/callback'));
    const body = (await response.json()) as { error?: { code?: string } };

    expect(response.status).toBe(400);
    expect(body.error?.code).toBe('BAD_REQUEST');
  });

  it('returns 401 when OAuth provider reports an error', async () => {
    const response = await GET(
      new Request('http://localhost:3000/api/auth/callback?error=access_denied'),
    );
    const body = (await response.json()) as { error?: { code?: string } };

    expect(response.status).toBe(401);
    expect(body.error?.code).toBe('UNAUTHORIZED');
  });

  it('exchanges auth code and stores session cookies', async () => {
    vi.mocked(createSupabaseOAuthClient).mockResolvedValue({
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
    } as unknown as Awaited<ReturnType<typeof createSupabaseOAuthClient>>);

    const response = await GET(new Request('https://resume.abhishekbharti.dev/api/auth/callback?code=oauth-code'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://resume.abhishekbharti.dev/editor');
    const setCookie = response.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('sb-access-token=access-token');
    expect(setCookie).toContain('sb-refresh-token=refresh-token');
  });
});
