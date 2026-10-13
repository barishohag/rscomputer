import { NextResponse } from 'next/server';
import { cookieName, readSession } from './lib/auth-session.js';

export function proxy(request) {
  const { pathname } = request.nextUrl;
  if (pathname === '/login' || pathname === '/api/login' || pathname === '/api/login/provider' || pathname === '/api/logout') {
    return NextResponse.next();
  }

  const session = readSession(
    request.cookies.get(cookieName)?.value,
    process.env.AUTH_SECRET,
    process.env.ADMIN_USERNAME,
  );

  if (!session) {
    const login = new URL('/login', request.url);
    if (pathname !== '/') login.searchParams.set('next', pathname);
    return NextResponse.redirect(login);
  }

  const adminOnly = pathname === '/admin/access' || pathname.startsWith('/api/admin/registrations');
  if (adminOnly && session.role !== 'admin') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Admin access is required.' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (pathname === '/') {
    return NextResponse.rewrite(new URL('/dashboard.html', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
