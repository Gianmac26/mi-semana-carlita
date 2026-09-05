import { NextResponse } from 'next/server';

const API_KEY = process.env.JSONBIN_API_KEY ?? '';
const BIN_ID  = process.env.JSONBIN_BIN_ID  ?? '';
const BIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

function headers(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (API_KEY) h['X-Master-Key'] = API_KEY;
  return h;
}

export async function GET() {
  if (!BIN_ID) return NextResponse.json({ weeks: {}, events: [] });
  try {
    const res = await fetch(`${BIN_URL}/latest`, { headers: headers(), cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json(data.record ?? data);
  } catch {
    return NextResponse.json({ weeks: {}, events: [] }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!BIN_ID) return NextResponse.json({ ok: true });
  try {
    const body = await request.json();
    const res = await fetch(BIN_URL, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }
}
