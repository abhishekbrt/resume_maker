import { NextResponse } from 'next/server';

import { jsonError } from '@/server/json-error';
import { createSupabaseOAuthClient } from '@/server/supabase-oauth';

export async function GET(request: Request): Promise<Response> {
  const supabase = await createSupabaseOAuthClient();
  const requestURL = new URL(request.url);
  const redirectTo = `${requestURL.origin}/api/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
    },
  });

  if (error || !data.url) {
    return jsonError(500, 'INTERNAL_ERROR', 'Failed to start Google OAuth flow');
  }

  return NextResponse.redirect(data.url);
}
