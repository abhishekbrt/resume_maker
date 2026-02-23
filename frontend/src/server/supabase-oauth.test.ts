import { describe, expect, it, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
  createClient: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: mocks.cookies,
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: mocks.createClient,
}));

import { createSupabaseOAuthClient } from '@/server/supabase-oauth';

describe('createSupabaseOAuthClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'anon-key';
  });

  it('creates a PKCE client with persisted cookie-backed auth storage', async () => {
    const cookieStore = {
      get: vi.fn(() => undefined),
      set: vi.fn(),
    };

    mocks.cookies.mockResolvedValue(cookieStore);
    mocks.createClient.mockReturnValue({} as unknown);

    await createSupabaseOAuthClient();

    expect(mocks.createClient).toHaveBeenCalledOnce();
    const [, , options] = mocks.createClient.mock.calls[0];
    expect(options.auth.flowType).toBe('pkce');
    expect(options.auth.autoRefreshToken).toBe(false);
    expect(options.auth.persistSession).toBe(true);
    expect(options.auth.detectSessionInUrl).toBe(false);
    expect(typeof options.auth.storage.getItem).toBe('function');
    expect(typeof options.auth.storage.setItem).toBe('function');
    expect(typeof options.auth.storage.removeItem).toBe('function');
  });
});
