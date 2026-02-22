import { getCookieValue } from '@/server/http-cookies';
import { createSupabaseServerClient } from '@/server/supabase-server';

export interface AuthenticatedUser {
  id: string;
  email: string;
}

export async function getAuthenticatedUser(request: Request): Promise<AuthenticatedUser | null> {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const accessToken = getCookieValue(cookieHeader, 'sb-access-token');
  if (!accessToken) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) {
    return null;
  }

  return {
    id: data.user.id,
    email: data.user.email ?? '',
  };
}
