import { prisma } from './prisma';
import { Event, AppSettings, DEFAULT_SETTINGS } from './types';

type PrismaRow = { id: string; data: unknown };

// ─── External Events ───────────────────────────────────────────────────────────

export async function readEvents(): Promise<Event[]> {
  const rows = await prisma.externalEvent.findMany();
  return rows.map((r: PrismaRow) => r.data as unknown as Event);
}

export async function readEvent(id: string): Promise<Event | null> {
  const row = await prisma.externalEvent.findUnique({ where: { id } });
  return row ? (row.data as unknown as Event) : null;
}

export async function createEvent(event: Event): Promise<Event> {
  await prisma.externalEvent.create({
    data: { id: event.id, data: event as unknown as object },
  });
  return event;
}

export async function updateEvent(id: string, updates: Partial<Event>): Promise<Event | null> {
  const row = await prisma.externalEvent.findUnique({ where: { id } });
  if (!row) return null;
  const existing = row.data as unknown as Event;
  const updated: Event = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  await prisma.externalEvent.update({
    where: { id },
    data: { data: updated as unknown as object },
  });
  return updated;
}

export async function deleteEvent(id: string): Promise<boolean> {
  try {
    await prisma.externalEvent.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export function writeEvents(_events: Event[]): void {
  // No-op: kept for API compatibility. Use createEvent / updateEvent / deleteEvent instead.
}

// ─── Settings ──────────────────────────────────────────────────────────────────

export async function readSettings(): Promise<AppSettings> {
  const row = await prisma.appSettings.findUnique({ where: { id: 1 } });
  if (!row) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...(row.data as unknown as AppSettings) };
}

export async function writeSettings(settings: AppSettings): Promise<void> {
  await prisma.appSettings.upsert({
    where: { id: 1 },
    update: { data: settings as unknown as object },
    create: { id: 1, data: settings as unknown as object },
  });
}
