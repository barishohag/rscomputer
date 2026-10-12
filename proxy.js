import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';

const cookieName = 'rscomputer_session';

function validSession(value, secret, username) {
  if (!value || !secret || !username) return false;
  const separator = value.lastIndexOf('.');
  if (separator < 1) return false;
  const payload = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  const expected = createHmac('sha256', secret).update(payload).digest();
  let actual;
  try { actual = Buffer.from(signature, 'base64url'); } catch { return false; }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data.sub === username && Number.isInteger(data.exp) && data.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function proxy(request) {
  const { pathname } = request.nextUrl;
  if (pathname === '/login' || pathname === '/api/login' || pathname === '/api/logout') return NextResponse.next();

  const authenticated = validSession(
    request.cookies.get(cookieName)?.value,
    process.env.AUTH_SECRET,
    process.env.ADMIN_USERNAME,
  );
  if (!authenticated) {
    const login = new URL('/login', request.url);
    if (pathname !== '/') login.searchParams.set('next', pathname);
    return NextResponse.redirect(login);
  }

  if (pathname === '/') {
    return NextResponse.rewrite(new URL('/dashboard.html', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
