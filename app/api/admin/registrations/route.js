import { NextResponse } from 'next/server';
import { cookieName, readSession } from '../../../../lib/auth-session.js';
import { getSupabaseAdmin } from '../../../../lib/supabase-admin.js';

export const runtime = 'nodejs';

function isAdmin(request) {
  return readSession(
    request.cookies.get(cookieName)?.value,
    process.env.AUTH_SECRET,
    process.env.ADMIN_USERNAME,
  )?.role === 'admin';
}

function serviceUnavailable() {
  return NextResponse.json({ error: 'Account approvals are not configured. Check Supabase settings and setup SQL.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(request) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Admin access is required.' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
  const admin = getSupabaseAdmin();
  if (!admin) return serviceUnavailable();

  const { data, error } = await admin
    .from('user_access')
    .select('user_id,email,status,requested_at')
    .eq('status', 'pending')
    .order('requested_at', { ascending: true })
    .limit(100);

  if (error) return serviceUnavailable();
  return NextResponse.json({ requests: data || [] }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Admin access is required.' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: 'Request origin was not accepted.' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
  }
  const admin = getSupabaseAdmin();
  if (!admin) return serviceUnavailable();

  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid approval request.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }
  if (typeof body?.userId !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.userId) || !['approved', 'rejected'].includes(body.status)) {
    return NextResponse.json({ error: 'Choose a valid account and decision.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }

  const { data, error } = await admin
    .from('user_access')
    .update({ status: body.status, reviewed_at: new Date().toISOString() })
    .eq('user_id', body.userId)
    .eq('status', 'pending')
    .select('user_id,status')
    .maybeSingle();

  if (error) return serviceUnavailable();
  if (!data) return NextResponse.json({ error: 'That request is no longer pending.' }, { status: 409, headers: { 'Cache-Control': 'no-store' } });
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
