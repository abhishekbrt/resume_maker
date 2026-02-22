import { describe, expect, it, vi } from 'vitest';

import { GET } from '@/app/api/auth/google/start/route';

vi.mock('@/server/supabase-server', () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { createSupabaseServerClient } from '@/server/supabase-server';

describe('GET /api/auth/google/start', () => {
  it('redirects to Supabase Google OAuth URL', async () => {
    vi.mocked(createSupabaseServerClient).mockReturnValue({
      auth: {
        signInWithOAuth: vi.fn(async () => ({
          data: { url: 'https://accounts.google.com/o/oauth2/v2/auth?state=abc' },
          error: null,
        })),
      },
    } as unknown as ReturnType<typeof createSupabaseServerClient>);

    const response = await GET(new Request('http://localhost:3000/api/auth/google/start'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://accounts.google.com/o/oauth2/v2/auth?state=abc',
    );
  });
});
