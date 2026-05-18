'use client';
import { useState } from 'react';
import { InternalEventChecklistItem } from '@/lib/internal-types';
import { CheckCircle2, Circle } from 'lucide-react';

interface Props {
  eventId: string;
  checklist: InternalEventChecklistItem[];
}

const PHASE_LABELS: Record<string, string> = {
  'pre-event': 'Pre-Event',
  'during-event': 'During Event',
  'post-event': 'Post-Event',
};

const PHASE_COLORS: Record<string, string> = {
  'pre-event': 'bg-blue-500',
  'during-event': 'bg-amber-500',
  'post-event': 'bg-green-500',
};

export default function InternalChecklistClient({ eventId, checklist: initial }: Props) {
  const [items, setItems] = useState(initial);
  const [saving, setSaving] = useState<string | null>(null);

  async function toggle(item: InternalEventChecklistItem) {
    setSaving(item.id);
    const updated = items.map((i) =>
      i.id === item.id
        ? { ...i, completed: !i.completed, completedDate: !i.completed ? new Date().toISOString() : undefined }
        : i,
    );
    setItems(updated);
    await fetch(`/api/internal-events/${eventId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checklist: updated }),
    });
    setSaving(null);
  }

  const phases = ['pre-event', 'during-event', 'post-event'] as const;

  return (
    <div className="space-y-6">
      {phases.map((phase) => {
        const phaseItems = items.filter((i) => i.phase === phase);
        if (phaseItems.length === 0) return null;
        const done = phaseItems.filter((i) => i.completed).length;
        return (
          <div key={phase}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-2 h-2 rounded-full ${PHASE_COLORS[phase]}`} />
              <h3 className="text-sm font-semibold text-slate-700">{PHASE_LABELS[phase]}</h3>
              <span className="text-xs text-slate-400 ml-auto">{done}/{phaseItems.length}</span>
              <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${PHASE_COLORS[phase]} rounded-full transition-all`}
                  style={{ width: `${phaseItems.length > 0 ? (done / phaseItems.length) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="space-y-1">
              {phaseItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggle(item)}
                  disabled={saving === item.id}
                  className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left disabled:opacity-60 group"
                >
                  {item.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-300 mt-0.5 flex-shrink-0 group-hover:text-slate-400" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${item.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                      {item.task}
                    </p>
                    {item.completed && item.completedDate && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Completed {new Date(item.completedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
