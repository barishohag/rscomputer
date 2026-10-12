import { NextResponse } from 'next/server';

export async function GET(request) {
  const response = NextResponse.redirect(new URL('/login?loggedOut=1', request.url), 303);
  response.cookies.set('rscomputer_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
