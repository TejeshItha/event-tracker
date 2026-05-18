import { readInternalEvents } from '@/lib/internal-storage';
import { INTERNAL_FORMAT_LABELS, INTERNAL_STAGE_LABELS, InternalEventStage } from '@/lib/internal-types';
import { formatINR } from '@/lib/classification';
import InternalEventFilters from '@/components/internal-events/InternalEventFilters';
import Link from 'next/link';
import { Plus, Search, Mic } from 'lucide-react';

// ─── Stage badge ───────────────────────────────────────────────────────────────

function StagePill({ stage }: { stage: InternalEventStage }) {
  const map: Record<InternalEventStage, string> = {
    ideation: 'bg-slate-100 text-slate-600',
    planning: 'bg-blue-100 text-blue-700',
    confirmed: 'bg-cyan-100 text-cyan-700',
    'invites-sent': 'bg-violet-100 text-violet-700',
    'registrations-open': 'bg-indigo-100 text-indigo-700',
    live: 'bg-green-100 text-green-700',
    completed: 'bg-emerald-100 text-emerald-700',
    'post-follow-up': 'bg-amber-100 text-amber-700',
    archived: 'bg-slate-100 text-slate-400',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[stage]}`}>
      {INTERNAL_STAGE_LABELS[stage]}
    </span>
  );
}

// ─── Checklist progress bar ────────────────────────────────────────────────────

function ChecklistProgress({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${pct === 100 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-400' : 'bg-blue-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-slate-400">{done}/{total}</span>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function InternalEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; format?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const all = await readInternalEvents();
  let events = [...all];

  if (sp.stage) events = events.filter((e) => e.stage === sp.stage);
  if (sp.format) events = events.filter((e) => e.format === sp.format);
  if (sp.q) {
    const q = sp.q.toLowerCase();
    events = events.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.city?.toLowerCase().includes(q) ||
        e.eventOwner?.toLowerCase().includes(q),
    );
  }

  events.sort((a, b) => {
    const da = a.startDate ? new Date(a.startDate).getTime() : 0;
    const db = b.startDate ? new Date(b.startDate).getTime() : 0;
    return da - db;
  });

  const title = sp.stage === 'completed'
    ? 'Completed Hosted Events'
    : sp.stage === 'live'
    ? 'Live Now'
    : sp.stage === 'planning' || sp.stage === 'confirmed'
    ? 'In Planning'
    : 'All Hosted Events';

  // Stats for header (uses `all` — no second DB call needed)
  const upcoming = all.filter((e) => {
    const d = e.startDate ? new Date(e.startDate) : null;
    return d && d >= new Date() && !['completed', 'post-follow-up', 'archived'].includes(e.stage);
  }).length;
  const liveNow = all.filter((e) => e.stage === 'live').length;
  const totalBudget = all
    .filter((e) => !['archived'].includes(e.stage))
    .reduce((s, e) => s + (e.budget?.totalEstimatedCost || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{events.length} event{events.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/internal-events/new"
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Host an Event
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Upcoming / In Progress', value: upcoming, color: 'text-indigo-600' },
          { label: 'Live Right Now', value: liveNow, color: liveNow > 0 ? 'text-green-600' : 'text-slate-600' },
          { label: 'Total Budget (Active)', value: formatINR(totalBudget), color: 'text-slate-700' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <InternalEventFilters current={sp as Record<string, string | undefined>} />

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200">
        {events.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Mic className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No hosted events found</p>
            <p className="text-sm mt-1">Create your first fireside chat, webinar, or roundtable.</p>
            <Link
              href="/internal-events/new"
              className="mt-4 inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" /> Host an Event
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Event</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Format</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Mode</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Budget</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Stage</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Checklist</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {events.map((e) => {
                  const done = e.checklist?.filter((c) => c.completed).length ?? 0;
                  const total = e.checklist?.length ?? 0;
                  const regPct = e.targetMetrics.targetRegistrations > 0
                    ? Math.round(((e.actualMetrics?.registrations ?? 0) / e.targetMetrics.targetRegistrations) * 100)
                    : null;
                  return (
                    <tr key={e.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/internal-events/${e.id}`}
                          className="font-medium text-slate-800 hover:text-indigo-600 group-hover:text-indigo-600"
                        >
                          {e.name}
                        </Link>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {e.city ? `${e.city} · ` : ''}
                          {e.theme || e.primaryObjective || '—'}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap text-xs">
                        {e.startDate
                          ? new Date(e.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
                          : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        {INTERNAL_FORMAT_LABELS[e.format] ?? e.format}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${e.mode === 'online' ? 'bg-blue-50 text-blue-600' : e.mode === 'offline' ? 'bg-slate-100 text-slate-600' : 'bg-violet-50 text-violet-600'}`}>
                          {e.mode.charAt(0).toUpperCase() + e.mode.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-slate-700 whitespace-nowrap">
                        {e.budget?.totalEstimatedCost ? formatINR(e.budget.totalEstimatedCost) : '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <StagePill stage={e.stage} />
                      </td>
                      <td className="px-4 py-3.5">
                        {total > 0 ? <ChecklistProgress done={done} total={total} /> : <span className="text-xs text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500">{e.eventOwner || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
