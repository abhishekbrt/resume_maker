import { NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/server/supabase-server';

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
  const supabase = createSupabaseServerClient();
  const requestURL = new URL(request.url);
  const appURL = process.env.NEXT_PUBLIC_APP_URL?.trim() || requestURL.origin;
  const redirectTo = `${appURL}/api/auth/callback`;

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
