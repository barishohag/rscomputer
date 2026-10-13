import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { setSessionCookie } from '../../../../lib/auth-session.js';
import { getSupabaseAdmin } from '../../../../lib/supabase-admin.js';

export const runtime = 'nodejs';

export async function POST(request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: 'Request origin was not accepted.' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secret = process.env.AUTH_SECRET;
  if (!url || !publishableKey || !secret || Buffer.byteLength(secret) < 32) {
    return NextResponse.json({ error: 'Account sign in is not configured yet.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Account approvals are not configured yet.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }

  let accessToken;
  try {
    if (Number(request.headers.get('content-length') || 0) > 12000) throw new Error('too large');
    const body = await request.json();
    accessToken = typeof body?.accessToken === 'string' ? body.accessToken : '';
  } catch {
    return NextResponse.json({ error: 'Sign in again to continue.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }
  if (!accessToken || accessToken.length > 10000) {
    return NextResponse.json({ error: 'Sign in again to continue.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }

  const auth = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data: userResult, error: userError } = await auth.auth.getUser(accessToken);
  if (userError || !userResult.user?.email) {
    return NextResponse.json({ error: 'Your sign-in could not be verified. Please try again.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  }

  const user = userResult.user;
  let { data: access, error: accessError } = await admin
    .from('user_access')
    .select('status')
    .eq('user_id', user.id)
    .maybeSingle();

  if (accessError) {
    return NextResponse.json({ error: 'Account approvals are not ready. The site administrator must run the setup SQL.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }

  if (!access) {
    const { data: created, error: insertError } = await admin
      .from('user_access')
      .insert({ user_id: user.id, email: user.email, status: 'pending' })
      .select('status')
      .single();
    if (insertError) {
      return NextResponse.json({ error: 'Could not submit your access request. Please try again.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
    access = created;
  }

  if (access.status === 'pending') {
    return NextResponse.json({ error: 'Your account is waiting for admin approval.' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
  }
  if (access.status !== 'approved') {
    return NextResponse.json({ error: 'This account was not approved for shop access.' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
  }

  const response = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  setSessionCookie(response, {
    sub: user.id,
    role: 'member',
    exp: Math.floor(Date.now() / 1000) + 8 * 60 * 60,
  }, secret);
  return response;
}
