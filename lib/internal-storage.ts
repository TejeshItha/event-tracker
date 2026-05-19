import { prisma } from './prisma';
import type { InternalEvent as PrismaInternalEvent } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import {
  InternalEvent,
  InternalEventFormat,
  InternalEventMode,
  generateInternalChecklist,
  calculateInternalTotalCost,
} from './internal-types';

// ─── Internal Events ───────────────────────────────────────────────────────────

export async function readInternalEvents(): Promise<InternalEvent[]> {
  const rows = await prisma.internalEvent.findMany();
  return rows.map((r: PrismaInternalEvent) => r.data as unknown as InternalEvent);
}

export async function readInternalEvent(id: string): Promise<InternalEvent | null> {
  const row = await prisma.internalEvent.findUnique({ where: { id } });
  return row ? (row.data as unknown as InternalEvent) : null;
}

export async function createInternalEvent(data: Partial<InternalEvent>): Promise<InternalEvent> {
  const now = new Date().toISOString();

  // Auto-calc total cost
  const budget = data.budget ?? {
    venueCost: 0, avEquipmentCost: 0, cateringCost: 0, speakerFeeCost: 0,
    travelCost: 0, decorCost: 0, photographyCost: 0, marketingPromoCost: 0,
    giftsSwagCost: 0, platformToolsCost: 0, miscCost: 0,
    totalEstimatedCost: 0, budgetOwner: '',
  };
  budget.totalEstimatedCost = calculateInternalTotalCost(budget);

  // Auto-generate checklist
  const checklist = data.checklist?.length
    ? data.checklist
    : generateInternalChecklist(
        (data.format ?? 'webinar') as InternalEventFormat,
        (data.mode ?? 'online') as InternalEventMode,
      );

  const event: InternalEvent = {
    id: uuidv4(),
    name: '',
    format: 'webinar',
    theme: '',
    description: '',
    mode: 'online',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    venue: '',
    city: '',
    platformLink: '',
    registrationLink: '',
    isInviteOnly: false,
    eventOwner: '',
    marketingOwner: '',
    salesOwner: '',
    primaryObjective: '',
    secondaryObjective: '',
    targetAudience: '',
    targetPersonas: [],
    targetIndustries: [],
    estimatedAudienceSize: 0,
    stage: 'ideation',
    budget,
    speakers: [],
    targetMetrics: {
      targetInvites: 0, targetRegistrations: 0, targetAttendees: 0,
      targetIcpAttendees: 0, targetMeetings: 0, targetPipeline: 0,
      targetContentAssets: 0, targetSocialPosts: 0,
    },
    checklist,
    createdAt: now,
    updatedAt: now,
    notes: '',
    ...data,
    budget,
    checklist,
  };

  await prisma.internalEvent.create({
    data: { id: event.id, data: event as unknown as object },
  });
  return event;
}

export async function updateInternalEvent(
  id: string,
  data: Partial<InternalEvent>,
): Promise<InternalEvent | null> {
  const row = await prisma.internalEvent.findUnique({ where: { id } });
  if (!row) return null;
  const existing = row.data as unknown as InternalEvent;

  // Recalculate cost if budget changed
  if (data.budget) {
    data.budget.totalEstimatedCost = calculateInternalTotalCost(data.budget);
  }

  const updated: InternalEvent = {
    ...existing,
    ...data,
    id,
    updatedAt: new Date().toISOString(),
  };

  await prisma.internalEvent.update({
    where: { id },
    data: { data: updated as unknown as object },
  });
  return updated;
}

export async function deleteInternalEvent(id: string): Promise<boolean> {
  try {
    await prisma.internalEvent.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
