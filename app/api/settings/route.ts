import { NextRequest, NextResponse } from 'next/server';
import { readSettings, writeSettings } from '@/lib/storage';

export async function GET() {
  const settings = await readSettings();
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const current = await readSettings();
    const updated = { ...current, ...body };
    await writeSettings(updated);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
