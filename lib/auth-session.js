import { createHmac, timingSafeEqual } from 'node:crypto';

export const cookieName = 'rscomputer_session';
export const sessionSeconds = 8 * 60 * 60;

export function signSession(payload, secret) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', secret).update(encoded).digest('base64url');
  return encoded + '.' + signature;
}

export function readSession(value, secret, adminUsername) {
  if (!value || !secret) return null;
  const separator = value.lastIndexOf('.');
  if (separator < 1) return null;
  const encoded = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  const expected = createHmac('sha256', secret).update(encoded).digest();
  const actual = Buffer.from(signature, 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!Number.isInteger(data.exp) || data.exp <= Math.floor(Date.now() / 1000)) return null;
    if (adminUsername && data.sub === adminUsername) return { ...data, role: 'admin' };
    if (data.role === 'member' && typeof data.sub === 'string' && data.sub.length > 0) return data;
    return null;
  } catch {
    return null;
  }
}

export function setSessionCookie(response, payload, secret) {
  response.cookies.set(cookieName, signSession(payload, secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: sessionSeconds,
  });
}
