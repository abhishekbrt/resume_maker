import { NextResponse } from 'next/server';

import { jsonError } from '@/server/json-error';
import { createSupabaseOAuthClient } from '@/server/supabase-oauth';

function buildCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };
}

export async function GET(request: Request): Promise<Response> {
  const requestURL = new URL(request.url);
  const oauthError = requestURL.searchParams.get('error');
  if (oauthError) {
    return jsonError(401, 'UNAUTHORIZED', 'OAuth sign-in failed');
  }

  const code = requestURL.searchParams.get('code');
  if (!code) {
    return jsonError(400, 'BAD_REQUEST', 'Missing OAuth code');
  }

  const supabase = await createSupabaseOAuthClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.session?.access_token || !data.session.refresh_token) {
    if (error) {
      console.error('OAuth exchange failed in callback', {
        name: error.name,
        message: error.message,
        status: 'status' in error ? error.status : undefined,
      });
    } else {
      console.error('OAuth exchange failed in callback', {
        message: 'Missing session access/refresh token in exchange response',
      });
    }
    return jsonError(401, 'UNAUTHORIZED', 'OAuth exchange failed');
  }

  const response = NextResponse.redirect(`${requestURL.origin}/editor`);
  const cookieOptions = buildCookieOptions();

  response.cookies.set('sb-access-token', data.session.access_token, cookieOptions);
  response.cookies.set('sb-refresh-token', data.session.refresh_token, cookieOptions);

  return response;
}
