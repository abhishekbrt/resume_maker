import { describe, expect, it, vi } from 'vitest';

import { GET } from '@/app/api/auth/google/start/route';

vi.mock('@/server/supabase-oauth', () => ({
  createSupabaseOAuthClient: vi.fn(),
}));

import { createSupabaseOAuthClient } from '@/server/supabase-oauth';

describe('GET /api/auth/google/start', () => {
  it('redirects to Supabase Google OAuth URL', async () => {
    const signInWithOAuth = vi.fn(async () => ({
      data: { url: 'https://accounts.google.com/o/oauth2/v2/auth?state=abc' },
      error: null,
    }));

    vi.mocked(createSupabaseOAuthClient).mockResolvedValue({
      auth: {
        signInWithOAuth,
      },
    } as unknown as Awaited<ReturnType<typeof createSupabaseOAuthClient>>);

    const response = await GET(new Request('https://resume.abhishekbharti.dev/api/auth/google/start'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://accounts.google.com/o/oauth2/v2/auth?state=abc',
    );
    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'https://resume.abhishekbharti.dev/api/auth/callback',
      },
    });
  });
});
