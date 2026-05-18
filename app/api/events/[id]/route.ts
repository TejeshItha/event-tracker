import { NextRequest, NextResponse } from 'next/server';
import { readEvent, updateEvent, deleteEvent } from '@/lib/storage';
import { calculateScore, getRecommendation } from '@/lib/scoring';
import { classifyEventBucket, calculateTotalCost } from '@/lib/classification';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await readEvent(id);
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  return NextResponse.json(event);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();

    // Recalculate cost and bucket if budget changed
    let updates = { ...body };
    if (body.budget) {
      const totalCost = calculateTotalCost(body.budget);
      const bucket = classifyEventBucket(totalCost);
      updates.budget = { ...body.budget, totalEstimatedCost: totalCost };
      updates.bucket = bucket;
    }

    // Recalculate score if relevant fields changed
    const existing = await readEvent(id);
    if (existing) {
      const merged = { ...existing, ...updates };
      const scoreBreakdown = calculateScore(merged);
      const { recommendation, reasons, conditionalRequirements } = getRecommendation(
        scoreBreakdown.totalScore,
        merged
      );
      updates.scoreBreakdown = scoreBreakdown;
      updates.recommendation = recommendation;
      updates.recommendationReasons = reasons;
      updates.conditionalGoRequirements = conditionalRequirements;
    }

    const updated = await updateEvent(id, updates);
    if (!updated) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const success = await deleteEvent(id);
  if (!success) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
