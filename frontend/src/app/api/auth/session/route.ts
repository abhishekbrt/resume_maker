import { getAccessTokenFromRequest } from '@/server/auth-user';
import { jsonError } from '@/server/json-error';
import { createSupabaseServerClient } from '@/server/supabase-server';

export async function GET(request: Request): Promise<Response> {
  const accessToken = getAccessTokenFromRequest(request);

  if (!accessToken) {
    return jsonError(401, 'UNAUTHORIZED', 'Authentication required');
  }

  const supabase = createSupabaseServerClient(accessToken);
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) {
    return jsonError(401, 'UNAUTHORIZED', 'Invalid or expired session');
  }

  return Response.json(
    {
      user: {
        id: data.user.id,
        email: data.user.email ?? '',
      },
    },
    { status: 200 },
  );
}
