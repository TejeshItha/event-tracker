'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { INTERNAL_STAGE_ORDER, INTERNAL_STAGE_LABELS, InternalEventStage } from '@/lib/internal-types';
import { ChevronRight, Trash2, CheckCircle2, RotateCcw } from 'lucide-react';

interface Props {
  eventId: string;
  currentStage: InternalEventStage;
  hasActualMetrics: boolean;
}

export default function InternalEventActions({ eventId, currentStage, hasActualMetrics }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const stageIdx = INTERNAL_STAGE_ORDER.indexOf(currentStage);
  const nextStage = INTERNAL_STAGE_ORDER[stageIdx + 1] as InternalEventStage | undefined;
  const prevStage = INTERNAL_STAGE_ORDER[stageIdx - 1] as InternalEventStage | undefined;

  async function advanceStage() {
    if (!nextStage) return;
    setLoading(true);
    await fetch(`/api/internal-events/${eventId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: nextStage }),
    });
    router.refresh();
    setLoading(false);
  }

  async function revertStage() {
    if (!prevStage) return;
    if (!confirm(`Revert to "${INTERNAL_STAGE_LABELS[prevStage]}"?`)) return;
    setLoading(true);
    await fetch(`/api/internal-events/${eventId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: prevStage }),
    });
    router.refresh();
    setLoading(false);
  }

  async function deleteEvent() {
    if (!confirm('Delete this event? This cannot be undone.')) return;
    setLoading(true);
    await fetch(`/api/internal-events/${eventId}`, { method: 'DELETE' });
    router.push('/internal-events');
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {nextStage && (
        <button
          onClick={advanceStage}
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
          Mark as {INTERNAL_STAGE_LABELS[nextStage]}
        </button>
      )}
      {currentStage === 'completed' && !hasActualMetrics && (
        <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
          Add actual metrics to complete post-event review
        </span>
      )}
      {prevStage && stageIdx > 0 && (
        <button
          onClick={revertStage}
          disabled={loading}
          className="flex items-center gap-2 border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-60 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Revert to {INTERNAL_STAGE_LABELS[prevStage]}
        </button>
      )}
      <button
        onClick={deleteEvent}
        disabled={loading}
        className="flex items-center gap-2 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm hover:bg-red-50 disabled:opacity-60 transition-colors ml-auto"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Delete
      </button>
    </div>
  );
}
