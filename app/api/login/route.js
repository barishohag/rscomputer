import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const cookieName = 'rscomputer_session';
const sessionSeconds = 8 * 60 * 60;

function equalText(left, right) {
  const a = createHash('sha256').update(String(left)).digest();
  const b = createHash('sha256').update(String(right)).digest();
  return timingSafeEqual(a, b);
}

function sign(payload, secret) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export async function POST(request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: 'Request origin was not accepted.' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
  }

  const { ADMIN_USERNAME, ADMIN_PASSWORD, AUTH_SECRET } = process.env;
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !AUTH_SECRET || Buffer.byteLength(AUTH_SECRET) < 32) {
    return NextResponse.json({ error: 'Sign-in is not configured yet. Ask the site administrator to finish setup.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }

  let credentials;
  try {
    if (Number(request.headers.get('content-length') || 0) > 4096) throw new Error('too large');
    credentials = await request.json();
  } catch {
    return NextResponse.json({ error: 'Enter a username and password.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }

  const username = typeof credentials?.username === 'string' ? credentials.username : '';
  const password = typeof credentials?.password === 'string' ? credentials.password : '';
  const usernameMatches = equalText(username, ADMIN_USERNAME);
  const passwordMatches = equalText(password, ADMIN_PASSWORD);
  if (!usernameMatches || !passwordMatches) {
    return NextResponse.json({ error: 'Username or password is incorrect.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  }

  const payload = Buffer.from(JSON.stringify({ sub: ADMIN_USERNAME, exp: Math.floor(Date.now() / 1000) + sessionSeconds })).toString('base64url');
  const session = `${payload}.${sign(payload, AUTH_SECRET)}`;
  const response = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  response.cookies.set(cookieName, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: sessionSeconds,
  });
  return response;
}
