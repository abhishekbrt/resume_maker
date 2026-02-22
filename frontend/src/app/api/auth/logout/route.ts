import { NextResponse } from 'next/server';

function clearCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  };
}

export async function POST(): Promise<Response> {
  const response = new NextResponse(null, { status: 204 });
  const cookieOptions = clearCookieOptions();

  response.cookies.set('sb-access-token', '', cookieOptions);
  response.cookies.set('sb-refresh-token', '', cookieOptions);

  return response;
}
