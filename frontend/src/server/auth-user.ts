import { getCookieValue } from '@/server/http-cookies';
import { createSupabaseServerClient } from '@/server/supabase-server';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface AuthenticatedUser {
  id: string;
  email: string;
}

export interface AuthenticatedRequestContext {
  user: AuthenticatedUser;
  supabase: SupabaseClient;
}

export function getAccessTokenFromRequest(request: Request): string {
  const cookieHeader = request.headers.get('cookie') ?? '';
  return getCookieValue(cookieHeader, 'sb-access-token');
}

export async function getAuthenticatedRequestContext(request: Request): Promise<AuthenticatedRequestContext | null> {
  const accessToken = getAccessTokenFromRequest(request);
  if (!accessToken) {
    return null;
  }

  const supabase = createSupabaseServerClient(accessToken);
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) {
    return null;
  }

  return {
    supabase,
    user: {
      id: data.user.id,
      email: data.user.email ?? '',
    },
  };
}

export async function getAuthenticatedUser(request: Request): Promise<AuthenticatedUser | null> {
  const context = await getAuthenticatedRequestContext(request);
  return context?.user ?? null;
}
