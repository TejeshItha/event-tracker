import { readEvents } from '@/lib/storage';
import { formatINR } from '@/lib/classification';
import { RecommendationBadge, BucketBadge, StageBadge } from '@/components/ui/Badge';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import EventFilters from '@/components/events/EventFilters';

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; recommendation?: string; bucket?: string; q?: string; approvalStatus?: string }>;
}) {
  const sp = await searchParams;
  let events = await readEvents();

  if (sp.stage) events = events.filter((e) => e.stage === sp.stage);
  if (sp.recommendation) events = events.filter((e) => e.recommendation === sp.recommendation);
  if (sp.bucket) events = events.filter((e) => e.bucket === sp.bucket);
  if (sp.approvalStatus) events = events.filter((e) => e.approvalStatus === sp.approvalStatus);
  if (sp.q) {
    const q = sp.q.toLowerCase();
    events = events.filter((e) => e.name.toLowerCase().includes(q) || e.city.toLowerCase().includes(q) || e.organizer.toLowerCase().includes(q));
  }

  events.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const title = sp.stage === 'approved' ? 'Upcoming Events'
    : sp.stage === 'attended' ? 'Attended Events'
    : sp.recommendation === 'no-go' ? 'No-Go Events'
    : sp.recommendation === 'go' ? 'Approved Go Events'
    : sp.recommendation === 'conditional-go' ? 'Conditional Go Events'
    : sp.approvalStatus === 'submitted' ? 'Approval Queue'
    : 'All Events';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{events.length} event{events.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/events/new" className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700">
          <Plus className="w-4 h-4" /> Add Event
        </Link>
      </div>

      <EventFilters current={sp} />

      <div className="bg-white rounded-xl border border-slate-200">
        {events.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No events found</p>
            <p className="text-sm mt-1">Try adjusting your filters or add a new event.</p>
            <Link href="/events/new" className="mt-4 inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">
              <Plus className="w-4 h-4" /> Add New Event
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Event</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Bucket</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Cost</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Score</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Decision</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Stage</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {events.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-3.5">
                      <Link href={`/events/${e.id}`} className="font-medium text-slate-800 hover:text-indigo-600 group-hover:text-indigo-600">
                        {e.name}
                      </Link>
                      <p className="text-xs text-slate-400 mt-0.5">{e.city}{e.city && e.format ? ' · ' : ''}{e.format?.replace(/-/g, ' ')}</p>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap text-xs">
                      {e.startDate ? new Date(e.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                    </td>
                    <td className="px-4 py-3.5"><BucketBadge value={e.bucket} size="sm" /></td>
                    <td className="px-4 py-3.5 font-medium text-slate-700 whitespace-nowrap">{formatINR(e.budget?.totalEstimatedCost || 0)}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-lg font-bold ${(e.scoreBreakdown?.totalScore || 0) >= 80 ? 'text-green-600' : (e.scoreBreakdown?.totalScore || 0) >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                        {e.scoreBreakdown?.totalScore ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {e.recommendation && <RecommendationBadge value={e.recommendation} size="sm" />}
                    </td>
                    <td className="px-4 py-3.5"><StageBadge value={e.stage} size="sm" /></td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">{e.eventOwner || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
