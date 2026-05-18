import { NextRequest, NextResponse } from 'next/server';
import { readInternalEvents, createInternalEvent } from '@/lib/internal-storage';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let events = await readInternalEvents();

  const stage = searchParams.get('stage');
  const format = searchParams.get('format');
  const q = searchParams.get('q');

  if (stage) events = events.filter((e) => e.stage === stage);
  if (format) events = events.filter((e) => e.format === format);
  if (q) {
    const lq = q.toLowerCase();
    events = events.filter(
      (e) =>
        e.name.toLowerCase().includes(lq) ||
        e.city?.toLowerCase().includes(lq) ||
        e.eventOwner?.toLowerCase().includes(lq),
    );
  }

  events.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = await createInternalEvent(body);
    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}
