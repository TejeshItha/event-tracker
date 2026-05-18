'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Event } from '@/lib/types';
import { Trash2, Edit, CheckCircle2, RotateCcw } from 'lucide-react';

export default function EventActions({ event }: { event: Event }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const updateStage = async (stage: string, extraData?: Partial<Event>) => {
    setLoading(true);
    try {
      await fetch(`/api/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage, ...extraData }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async () => {
    if (!confirm('Delete this event? This cannot be undone.')) return;
    setLoading(true);
    try {
      await fetch(`/api/events/${event.id}`, { method: 'DELETE' });
      router.push('/events');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      {event.stage === 'scored' && event.recommendation !== 'no-go' && (
        <button
          onClick={() => updateStage('awaiting-approval', { approvalStatus: 'submitted' })}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Submit for Approval
        </button>
      )}
      {event.stage === 'awaiting-approval' && (
        <button
          onClick={() => updateStage('approved', { approvalStatus: 'approved' })}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
        </button>
      )}
      {event.stage === 'approved' && (
        <button
          onClick={() => updateStage('attended')}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Mark as Attended
        </button>
      )}
      <button
        onClick={deleteEvent}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
      >
        <Trash2 className="w-3.5 h-3.5" /> Delete
      </button>
    </div>
  );
}
