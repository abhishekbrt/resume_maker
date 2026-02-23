import { cookies } from 'next/headers';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`${name} is required`);
  }
  return value;
}

function buildCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };
}

export async function createSupabaseOAuthClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  const cookieOptions = buildCookieOptions();

  const storage = {
    getItem: (key: string): string | null => cookieStore.get(key)?.value ?? null,
    setItem: (key: string, value: string): void => {
      cookieStore.set(key, value, cookieOptions);
    },
    removeItem: (key: string): void => {
      cookieStore.set(key, '', { ...cookieOptions, maxAge: 0 });
    },
  };

  return createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_ANON_KEY'), {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: false,
      persistSession: true,
      detectSessionInUrl: false,
      storage,
    },
  });
}
