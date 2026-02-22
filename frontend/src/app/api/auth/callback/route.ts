import { NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/server/supabase-server';

function buildCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };
}

function jsonError(status: number, code: string, message: string): Response {
  return Response.json(
    {
      error: {
        code,
        message,
      },
    },
    { status },
  );
}

export async function GET(request: Request): Promise<Response> {
  const requestURL = new URL(request.url);
  const code = requestURL.searchParams.get('code');
  if (!code) {
    return jsonError(400, 'BAD_REQUEST', 'Missing OAuth code');
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.session?.access_token || !data.session.refresh_token) {
    return jsonError(401, 'UNAUTHORIZED', 'OAuth exchange failed');
  }

  const appURL = process.env.NEXT_PUBLIC_APP_URL?.trim() || requestURL.origin;
  const response = NextResponse.redirect(`${appURL}/editor`);
  const cookieOptions = buildCookieOptions();

  response.cookies.set('sb-access-token', data.session.access_token, cookieOptions);
  response.cookies.set('sb-refresh-token', data.session.refresh_token, cookieOptions);

  return response;
}
