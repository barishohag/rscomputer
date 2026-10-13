import { NextResponse } from 'next/server';
import { cookieName, readSession } from '../../../lib/auth-session.js';
import { getSupabaseAdmin } from '../../../lib/supabase-admin.js';

export const runtime = 'nodejs';

const MAX_DATA_BYTES = 1_000_000;
const NO_STORE = { 'Cache-Control': 'no-store' };

function hasSession(request) {
  return Boolean(readSession(
    request.cookies.get(cookieName)?.value,
    process.env.AUTH_SECRET,
    process.env.ADMIN_USERNAME,
  ));
}

function unavailable() {
  return NextResponse.json(
    { error: 'Cloud backup is not configured. Connect the Supabase store to this Vercel project.' },
    { status: 503, headers: NO_STORE },
  );
}

function validPayload(data) {
  return data
    && typeof data === 'object'
    && !Array.isArray(data)
    && data.settings && typeof data.settings === 'object' && !Array.isArray(data.settings)
    && Array.isArray(data.sales)
    && Array.isArray(data.collections)
    && Array.isArray(data.orders)
    && data.cashCounts && typeof data.cashCounts === 'object' && !Array.isArray(data.cashCounts);
}

export async function GET(request) {
  if (!hasSession(request)) {
    return NextResponse.json({ error: 'Sign-in is required.' }, { status: 401, headers: NO_STORE });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return unavailable();

  const { data, error } = await supabase
    .from('pos_store')
    .select('payload,updated_at')
    .eq('store_id', 'main')
    .maybeSingle();

  if (error) return unavailable();
  return NextResponse.json(
    { data: data?.payload ?? null, updatedAt: data?.updated_at ?? null },
    { headers: NO_STORE },
  );
}

export async function PUT(request) {
  if (!hasSession(request)) {
    return NextResponse.json({ error: 'Sign-in is required.' }, { status: 401, headers: NO_STORE });
  }

  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: 'Request origin was not accepted.' }, { status: 403, headers: NO_STORE });
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_DATA_BYTES) {
    return NextResponse.json({ error: 'Backup is too large.' }, { status: 413, headers: NO_STORE });
  }

  let body;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_DATA_BYTES) {
      return NextResponse.json({ error: 'Backup is too large.' }, { status: 413, headers: NO_STORE });
    }
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid backup data.' }, { status: 400, headers: NO_STORE });
  }

  if (!validPayload(body?.data)) {
    return NextResponse.json({ error: 'Backup data is missing required sections.' }, { status: 400, headers: NO_STORE });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return unavailable();

  const { error } = await supabase
    .from('pos_store')
    .upsert({
      store_id: 'main',
      payload: body.data,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'store_id' });

  if (error) return unavailable();
  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}
