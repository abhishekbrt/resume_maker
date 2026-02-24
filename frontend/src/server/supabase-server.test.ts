import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ auth: {} })),
}));

import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/server/supabase-server';

describe('createSupabaseServerClient', () => {
  beforeEach(() => {
    process.env.SUPABASE_URL = 'https://project.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'anon-key';
    vi.clearAllMocks();
  });

  it('creates a default server client when no access token is provided', () => {
    createSupabaseServerClient();

    expect(createClient).toHaveBeenCalledWith(
      'https://project.supabase.co',
      'anon-key',
      expect.objectContaining({
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }),
    );
  });

  it('adds Authorization header when access token is provided', () => {
    createSupabaseServerClient('test-token');

    expect(createClient).toHaveBeenCalledWith(
      'https://project.supabase.co',
      'anon-key',
      expect.objectContaining({
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          headers: {
            Authorization: 'Bearer test-token',
          },
        },
      }),
    );
  });
});
