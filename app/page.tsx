import { readEvents, readSettings } from '@/lib/storage';
import { readInternalEvents } from '@/lib/internal-storage';
import { formatINR } from '@/lib/classification';
import { INTERNAL_FORMAT_LABELS } from '@/lib/internal-types';
import Link from 'next/link';
import { RecommendationBadge, BucketBadge, StageBadge } from '@/components/ui/Badge';
import {
  TrendingUp, TrendingDown, Calendar, Target, IndianRupee,
  CheckCircle2, XCircle, Clock, AlertTriangle, Plus, ArrowRight, Mic,
} from 'lucide-react';

function StatCard({ label, value, sub, icon: Icon, color = 'indigo' }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; color?: string;
}) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-lg ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-500 mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const [events, settings, internalEvents] = await Promise.all([
    readEvents(),
    readSettings(),
    readInternalEvents(),
  ]);

  const quarterBudget = { Q1: settings.q1Budget, Q2: settings.q2Budget, Q3: settings.q3Budget, Q4: settings.q4Budget }[settings.currentQuarter] || 0;

  const reservedBudget = events
    .filter((e) => ['approved', 'planning', 'live'].includes(e.stage))
    .reduce((sum, e) => sum + (e.budget?.totalEstimatedCost || 0), 0);
  const spentBudget = events
    .filter((e) => ['attended', 'roi-review', 'archived'].includes(e.stage))
    .reduce((sum, e) => sum + (e.actualMetrics?.actualCost || e.budget?.totalEstimatedCost || 0), 0);
  const availableBudget = Math.max(0, quarterBudget - reservedBudget - spentBudget);
  const utilizationPct = quarterBudget > 0 ? ((reservedBudget + spentBudget) / quarterBudget) * 100 : 0;

  const counts = {
    total: events.length,
    evaluation: events.filter((e) => ['under-evaluation', 'scored'].includes(e.stage)).length,
    approved: events.filter((e) => ['approved', 'planning'].includes(e.stage)).length,
    conditionalGo: events.filter((e) => e.recommendation === 'conditional-go').length,
    noGo: events.filter((e) => e.recommendation === 'no-go').length,
    attended: events.filter((e) => ['attended', 'roi-review'].includes(e.stage)).length,
    pendingReview: events.filter((e) => e.stage === 'roi-review').length,
    awaitingApproval: events.filter((e) => e.approvalStatus === 'submitted').length,
  };

  const pipeline = events.reduce(
    (acc, e) => ({
      expectedLeads: acc.expectedLeads + (e.expectedMetrics?.leads || 0),
      actualLeads: acc.actualLeads + (e.actualMetrics?.leads || 0),
      expectedICP: acc.expectedICP + (e.expectedMetrics?.icpLeads || 0),
      actualICP: acc.actualICP + (e.actualMetrics?.icpLeads || 0),
      expectedSQLs: acc.expectedSQLs + (e.expectedMetrics?.sqls || 0),
      actualSQLs: acc.actualSQLs + (e.actualMetrics?.sqls || 0),
      expectedPipeline: acc.expectedPipeline + (e.expectedMetrics?.pipeline || 0),
      actualPipeline: acc.actualPipeline + (e.actualMetrics?.pipeline || 0),
      expectedMeetings: acc.expectedMeetings + (e.expectedMetrics?.meetings || 0),
      actualMeetings: acc.actualMeetings + (e.actualMetrics?.meetings || 0),
    }),
    { expectedLeads: 0, actualLeads: 0, expectedICP: 0, actualICP: 0, expectedSQLs: 0, actualSQLs: 0, expectedPipeline: 0, actualPipeline: 0, expectedMeetings: 0, actualMeetings: 0 }
  );

  const now = new Date();
  const in90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const upcomingEvents = events
    .filter((e) => { const s = new Date(e.startDate); return s >= now && s <= in90 && ['approved', 'planning', 'live'].includes(e.stage); })
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 5);

  const recentEvents = [...events]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8);

  const bucketCounts = events.reduce((acc, e) => { acc[e.bucket] = (acc[e.bucket] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Event Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">{settings.currentQuarter} {settings.currentYear} · {settings.companyName}</p>
        </div>
        <Link href="/events/new" className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" /> Add New Event
        </Link>
      </div>

      {/* Budget Overview */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-indigo-500" />
            Budget Overview — {settings.currentQuarter} {settings.currentYear}
          </h2>
          <Link href="/budget" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
            View Details <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-5">
          {[
            { label: 'Quarter Budget', value: formatINR(quarterBudget), bg: 'bg-slate-50', text: 'text-slate-800' },
            { label: 'Available', value: formatINR(availableBudget), bg: 'bg-green-50', text: 'text-green-700' },
            { label: 'Reserved', value: formatINR(reservedBudget), bg: 'bg-amber-50', text: 'text-amber-700' },
            { label: 'Spent', value: formatINR(spentBudget), bg: 'bg-blue-50', text: 'text-blue-700' },
          ].map((b) => (
            <div key={b.label} className={`text-center p-4 ${b.bg} rounded-lg`}>
              <p className="text-xs text-slate-500 mb-1">{b.label}</p>
              <p className={`text-xl font-bold ${b.text}`}>{b.value}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Budget Utilization</span>
            <span className={`font-semibold ${utilizationPct > 90 ? 'text-red-600' : utilizationPct > 70 ? 'text-amber-600' : 'text-green-600'}`}>
              {utilizationPct.toFixed(1)}%
            </span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex">
            <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (spentBudget / quarterBudget) * 100)}%` }} />
            <div className="h-full bg-amber-400" style={{ width: `${Math.min(100, (reservedBudget / quarterBudget) * 100)}%` }} />
          </div>
          <div className="flex gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />Spent</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Reserved</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-200 inline-block" />Available</span>
          </div>
          {utilizationPct > 75 && (
            <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs mt-2">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              Budget utilization above 75% — review before committing new events.
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Events" value={counts.total} icon={Calendar} color="indigo" />
        <StatCard label="Under Evaluation" value={counts.evaluation} icon={Clock} color="blue" />
        <StatCard label="Approved / Upcoming" value={counts.approved} icon={CheckCircle2} color="green" />
        <StatCard label="Awaiting Approval" value={counts.awaitingApproval} icon={AlertTriangle} color="amber" />
        <StatCard label="Conditional Go" value={counts.conditionalGo} icon={Target} color="amber" />
        <StatCard label="No-Go" value={counts.noGo} icon={XCircle} color="red" />
        <StatCard label="Attended" value={counts.attended} icon={CheckCircle2} color="blue" />
        <StatCard label="Pending ROI Review" value={counts.pendingReview} icon={TrendingUp} color="purple" />
      </div>

      {/* Pipeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-5">
          <TrendingUp className="w-4 h-4 text-indigo-500" />
          Pipeline Overview
        </h2>
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: 'Total Leads', exp: pipeline.expectedLeads, act: pipeline.actualLeads },
            { label: 'ICP Leads', exp: pipeline.expectedICP, act: pipeline.actualICP },
            { label: 'SQLs', exp: pipeline.expectedSQLs, act: pipeline.actualSQLs },
            { label: 'Meetings', exp: pipeline.expectedMeetings, act: pipeline.actualMeetings },
            { label: 'Pipeline', exp: pipeline.expectedPipeline, act: pipeline.actualPipeline, isCurrency: true },
          ].map((m) => (
            <div key={m.label} className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 mb-2">{m.label}</p>
              <p className="text-lg font-bold text-slate-800">{m.isCurrency ? formatINR(m.exp) : m.exp}</p>
              <p className="text-xs text-slate-400">Expected</p>
              {m.act > 0 && (
                <>
                  <p className={`text-base font-semibold mt-1.5 ${m.act >= m.exp ? 'text-green-600' : 'text-amber-600'}`}>
                    {m.isCurrency ? formatINR(m.act) : m.act}
                  </p>
                  <p className="text-xs text-slate-400">Actual</p>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bucket Distribution + Upcoming */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Events by Bucket</h2>
          <div className="space-y-3">
            {([
              { key: 'low-cost', label: 'Low-cost', color: 'bg-slate-400' },
              { key: 'micro', label: 'Micro', color: 'bg-blue-400' },
              { key: 'mini', label: 'Mini', color: 'bg-cyan-400' },
              { key: 'major', label: 'Major', color: 'bg-orange-400' },
              { key: 'strategic', label: 'Strategic', color: 'bg-purple-400' },
            ] as const).map((b) => {
              const count = bucketCounts[b.key] || 0;
              const pct = events.length > 0 ? (count / events.length) * 100 : 0;
              return (
                <div key={b.key} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-20">{b.label}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${b.color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 w-5 text-right">{count}</span>
                </div>
              );
            })}
          </div>
          {events.length === 0 && <p className="text-sm text-slate-400 text-center mt-6">No events yet</p>}
        </div>

        <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Upcoming Events (Next 90 Days)</h2>
            <Link href="/events" className="text-xs text-indigo-600 hover:underline">View all</Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No upcoming events in the next 90 days</p>
              <Link href="/events/new" className="text-indigo-600 text-sm hover:underline mt-1 inline-block">Add an event</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.map((e) => (
                <Link key={e.id} href={`/events/${e.id}`} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors group">
                  <div className="text-center bg-indigo-50 rounded-lg px-3 py-2 min-w-14">
                    <p className="text-xs text-indigo-400 font-medium">{new Date(e.startDate).toLocaleDateString('en-IN', { month: 'short' })}</p>
                    <p className="text-lg font-bold text-indigo-700">{new Date(e.startDate).getDate()}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate group-hover:text-indigo-600">{e.name}</p>
                    <p className="text-xs text-slate-500">{e.city} · {e.mode}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <BucketBadge value={e.bucket} size="sm" />
                    <p className="text-xs text-slate-500">{formatINR(e.budget?.totalEstimatedCost || 0)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hosted Events (Internal) Summary */}
      {(() => {
        const now = new Date();
        const upcomingHosted = internalEvents
          .filter((e) => {
            const d = e.startDate ? new Date(e.startDate) : null;
            return d && d >= now && !['completed', 'post-follow-up', 'archived'].includes(e.stage);
          })
          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
          .slice(0, 3);
        const liveNow = internalEvents.filter((e) => e.stage === 'live');
        const inPlanning = internalEvents.filter((e) => ['ideation', 'planning', 'confirmed'].includes(e.stage)).length;
        return (
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <Mic className="w-4 h-4 text-indigo-500" />
                Hosted Events
              </h2>
              <div className="flex items-center gap-3">
                <Link href="/internal-events/new" className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg hover:bg-indigo-100 transition-colors">
                  + Host Event
                </Link>
                <Link href="/internal-events" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
            <div className="p-5">
              {internalEvents.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Mic className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No hosted events yet</p>
                  <Link href="/internal-events/new" className="text-indigo-600 text-sm hover:underline mt-1 inline-block">
                    Host your first event
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Quick stats */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Total Hosted', value: internalEvents.length, color: 'text-slate-800' },
                      { label: 'In Planning', value: inPlanning, color: 'text-blue-600' },
                      { label: 'Live Now', value: liveNow.length, color: liveNow.length > 0 ? 'text-green-600' : 'text-slate-400' },
                    ].map((s) => (
                      <div key={s.label} className="bg-slate-50 rounded-lg p-3 text-center">
                        <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  {/* Upcoming hosted */}
                  {upcomingHosted.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-2">Upcoming Hosted Events</p>
                      <div className="space-y-2">
                        {upcomingHosted.map((e) => (
                          <Link key={e.id} href={`/internal-events/${e.id}`} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-lg transition-colors group">
                            <div className="text-center bg-indigo-50 rounded-lg px-2.5 py-1.5 min-w-12">
                              <p className="text-xs text-indigo-400 font-medium">{new Date(e.startDate).toLocaleDateString('en-IN', { month: 'short' })}</p>
                              <p className="text-base font-bold text-indigo-700">{new Date(e.startDate).getDate()}</p>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate group-hover:text-indigo-600">{e.name}</p>
                              <p className="text-xs text-slate-400">{INTERNAL_FORMAT_LABELS[e.format]}{e.city ? ` · ${e.city}` : ''}</p>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${e.mode === 'online' ? 'bg-blue-50 text-blue-600' : e.mode === 'offline' ? 'bg-slate-100 text-slate-600' : 'bg-violet-50 text-violet-600'}`}>
                              {e.mode}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Recent Events Table */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Recent Events</h2>
          <Link href="/events" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
        </div>
        {recentEvents.length === 0 ? (
          <div className="text-center py-14 text-slate-400">
            <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No events yet</p>
            <p className="text-sm mt-1 mb-4">Add your first event to start the decision engine</p>
            <Link href="/events/new" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">
              <Plus className="w-4 h-4" /> Add New Event
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Event</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Bucket</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Cost</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Score</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Decision</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentEvents.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3">
                      <Link href={`/events/${e.id}`} className="font-medium text-slate-800 hover:text-indigo-600">{e.name}</Link>
                      <p className="text-xs text-slate-400">{e.city} · {e.organizer}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {e.startDate ? new Date(e.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                    </td>
                    <td className="px-4 py-3"><BucketBadge value={e.bucket} size="sm" /></td>
                    <td className="px-4 py-3 font-medium text-slate-700">{formatINR(e.budget?.totalEstimatedCost || 0)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-lg font-bold ${(e.scoreBreakdown?.totalScore || 0) >= 80 ? 'text-green-600' : (e.scoreBreakdown?.totalScore || 0) >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                        {e.scoreBreakdown?.totalScore ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {e.recommendation && <RecommendationBadge value={e.recommendation} size="sm" />}
                    </td>
                    <td className="px-4 py-3"><StageBadge value={e.stage} size="sm" /></td>
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
