import { notFound } from 'next/navigation';
import { readEvent } from '@/lib/storage';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ChecklistClient from '@/components/events/ChecklistClient';

export default async function ChecklistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await readEvent(id);
  if (!event) notFound();

  const preItems = event.checklist?.filter((c) => c.phase === 'pre-event') || [];
  const duringItems = event.checklist?.filter((c) => c.phase === 'during-event') || [];
  const postItems = event.checklist?.filter((c) => c.phase === 'post-event') || [];

  const total = event.checklist?.length || 0;
  const done = event.checklist?.filter((c) => c.completed).length || 0;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <Link href={`/events/${event.id}`} className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Event
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">{event.name}</h1>
        <p className="text-slate-500 text-sm">Operational Checklist · {done}/{total} tasks completed</p>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }} />
      </div>
      <ChecklistClient eventId={event.id} preItems={preItems} duringItems={duringItems} postItems={postItems} />
    </div>
  );
}
