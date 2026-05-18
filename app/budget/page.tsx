import { readEvents, readSettings } from '@/lib/storage';
import { formatINR, formatINRFull } from '@/lib/classification';
import { BucketBadge, StageBadge } from '@/components/ui/Badge';
import Link from 'next/link';
import BudgetSettingsForm from '@/components/dashboard/BudgetSettingsForm';
import { AlertTriangle, TrendingUp, IndianRupee, ArrowRight } from 'lucide-react';

const BUCKETS = ['low-cost', 'micro', 'mini', 'major', 'strategic'] as const;
const BUCKET_LABELS: Record<string, string> = {
  'low-cost': 'Low-cost', micro: 'Micro', mini: 'Mini', major: 'Major', strategic: 'Strategic',
};
const BUCKET_COLORS: Record<string, string> = {
  'low-cost': 'bg-slate-100 text-slate-600',
  micro: 'bg-blue-100 text-blue-700',
  mini: 'bg-cyan-100 text-cyan-700',
  major: 'bg-orange-100 text-orange-700',
  strategic: 'bg-purple-100 text-purple-700',
};
const BUCKET_BAR_COLORS: Record<string, string> = {
  'low-cost': 'bg-slate-400',
  micro: 'bg-blue-400',
  mini: 'bg-cyan-500',
  major: 'bg-orange-400',
  strategic: 'bg-purple-500',
};

function getQuarter(dateStr: string): 'Q1' | 'Q2' | 'Q3' | 'Q4' {
  const m = new Date(dateStr).getMonth();
  return m < 3 ? 'Q1' : m < 6 ? 'Q2' : m < 9 ? 'Q3' : 'Q4';
}

export default async function BudgetPage() {
  const [events, settings] = await Promise.all([readEvents(), readSettings()]);

  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'] as const;
  const qBudgets = { Q1: settings.q1Budget, Q2: settings.q2Budget, Q3: settings.q3Budget, Q4: settings.q4Budget };

  // ── Build quarter × bucket matrix ────────────────────────────────────────
  type Cell = { count: number; planned: number; actual: number; reserved: number };
  const matrix: Record<string, Record<string, Cell>> = {};
  quarters.forEach((q) => {
    matrix[q] = {};
    BUCKETS.forEach((b) => { matrix[q][b] = { count: 0, planned: 0, actual: 0, reserved: 0 }; });
  });

  events.forEach((e) => {
    if (!e.startDate) return;
    const q = getQuarter(e.startDate);
    const b = e.bucket;
    if (!matrix[q][b]) return;
    matrix[q][b].count++;
    matrix[q][b].planned += e.budget?.totalEstimatedCost || 0;
    if (['attended', 'roi-review', 'archived'].includes(e.stage)) {
      matrix[q][b].actual += e.actualMetrics?.actualCost || e.budget?.totalEstimatedCost || 0;
    }
    if (['approved', 'planning', 'live'].includes(e.stage)) {
      matrix[q][b].reserved += e.budget?.totalEstimatedCost || 0;
    }
  });

  // ── Quarter-level rollups ─────────────────────────────────────────────────
  const qTotals = quarters.reduce((acc, q) => {
    const spent = BUCKETS.reduce((s, b) => s + matrix[q][b].actual, 0);
    const reserved = BUCKETS.reduce((s, b) => s + matrix[q][b].reserved, 0);
    const count = BUCKETS.reduce((s, b) => s + matrix[q][b].count, 0);
    acc[q] = { spent, reserved, count };
    return acc;
  }, {} as Record<string, { spent: number; reserved: number; count: number }>);

  const totalAnnual = settings.annualBudget;
  const totalSpent = quarters.reduce((s, q) => s + qTotals[q].spent, 0);
  const totalReserved = quarters.reduce((s, q) => s + qTotals[q].reserved, 0);
  const totalCommitted = totalSpent + totalReserved;

  // ── Budget forecast ───────────────────────────────────────────────────────
  // Use Q1+Q2 actual spend rate to project full year
  const pastQuarters = quarters.filter((q) => {
    const qIdx = quarters.indexOf(q);
    const cIdx = quarters.indexOf(settings.currentQuarter);
    return qIdx < cIdx;
  });
  const avgQSpend = pastQuarters.length > 0
    ? pastQuarters.reduce((s, q) => s + qTotals[q].spent + qTotals[q].reserved, 0) / pastQuarters.length
    : 0;
  const remainingQuarters = quarters.filter((q) => {
    const qIdx = quarters.indexOf(q);
    const cIdx = quarters.indexOf(settings.currentQuarter);
    return qIdx >= cIdx;
  });
  const projectedYearEnd = totalCommitted + (avgQSpend * remainingQuarters.length);
  const forecastOverrun = projectedYearEnd > totalAnnual;

  // ── All events sorted by cost ─────────────────────────────────────────────
  const allEventsSorted = [...events].sort(
    (a, b) => (b.budget?.totalEstimatedCost || 0) - (a.budget?.totalEstimatedCost || 0)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Budget Tracker</h1>
          <p className="text-slate-500 text-sm mt-0.5">{settings.currentYear} · {events.length} events tracked</p>
        </div>
        <Link href="/reports" className="flex items-center gap-1.5 text-sm text-indigo-600 hover:underline">
          View ROI Reports <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Annual Overview */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-indigo-500" />
            Annual Budget {settings.currentYear}
          </h2>
          {forecastOverrun && (
            <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5" />
              Projected overrun: {formatINR(projectedYearEnd - totalAnnual)}
            </div>
          )}
        </div>
        <div className="grid grid-cols-5 gap-3 mb-5">
          {[
            { label: 'Annual Budget', value: formatINR(totalAnnual), cls: 'bg-slate-50 text-slate-800' },
            { label: 'Total Spent', value: formatINR(totalSpent), cls: 'bg-blue-50 text-blue-700' },
            { label: 'Total Reserved', value: formatINR(totalReserved), cls: 'bg-amber-50 text-amber-700' },
            { label: 'Available', value: formatINR(Math.max(0, totalAnnual - totalCommitted)), cls: 'bg-green-50 text-green-700' },
            { label: 'Year-end Forecast', value: formatINR(projectedYearEnd), cls: forecastOverrun ? 'bg-red-50 text-red-700' : 'bg-indigo-50 text-indigo-700' },
          ].map((b) => (
            <div key={b.label} className={`p-4 rounded-lg text-center ${b.cls}`}>
              <p className="text-xs text-slate-500 mb-1">{b.label}</p>
              <p className="text-xl font-bold">{b.value}</p>
            </div>
          ))}
        </div>
        {/* Stacked bar */}
        <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex">
          <div className="h-full bg-blue-500 transition-all" style={{ width: `${Math.min(100, (totalSpent / totalAnnual) * 100)}%` }} />
          <div className="h-full bg-amber-400 transition-all" style={{ width: `${Math.min(100, (totalReserved / totalAnnual) * 100)}%` }} />
          {avgQSpend > 0 && (
            <div className="h-full bg-indigo-200 transition-all" style={{ width: `${Math.min(100 - (totalCommitted / totalAnnual) * 100, ((projectedYearEnd - totalCommitted) / totalAnnual) * 100)}%` }} />
          )}
        </div>
        <div className="flex gap-5 text-xs text-slate-400 mt-2">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />Spent {((totalSpent / totalAnnual) * 100).toFixed(1)}%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Reserved {((totalReserved / totalAnnual) * 100).toFixed(1)}%</span>
          {avgQSpend > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-200 inline-block" />Projected additional spend</span>}
        </div>
      </div>

      {/* Quarterly Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {quarters.map((q) => {
          const budget = qBudgets[q];
          const { spent, reserved, count } = qTotals[q];
          const available = Math.max(0, budget - spent - reserved);
          const utilization = budget > 0 ? ((spent + reserved) / budget) * 100 : 0;
          const isCurrent = q === settings.currentQuarter;
          return (
            <div key={q} className={`bg-white rounded-xl border p-5 ${isCurrent ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-800">{q} {settings.currentYear}</h3>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">{count} event{count !== 1 ? 's' : ''}</span>
                  {isCurrent && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Current</span>}
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800">{formatINR(budget)}</p>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex mt-3 mb-3">
                <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (spent / budget) * 100)}%` }} />
                <div className="h-full bg-amber-400" style={{ width: `${Math.min(100, (reserved / budget) * 100)}%` }} />
              </div>
              <div className="space-y-1 text-xs mb-3">
                <div className="flex justify-between"><span className="text-slate-400">Spent</span><span className="font-medium text-blue-600">{formatINR(spent)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Reserved</span><span className="font-medium text-amber-600">{formatINR(reserved)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Available</span><span className="font-medium text-green-600">{formatINR(available)}</span></div>
                <div className="flex justify-between pt-1 border-t border-slate-100">
                  <span className="text-slate-400">Utilization</span>
                  <span className={`font-bold ${utilization > 90 ? 'text-red-600' : utilization > 70 ? 'text-amber-600' : 'text-green-600'}`}>
                    {utilization.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quarter × Bucket Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-800 mb-1">Events by Quarter &amp; Bucket</h2>
        <p className="text-xs text-slate-400 mb-5">How many events of each type are planned / attended per quarter, and how much budget they consume.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2.5 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wide w-28">Quarter</th>
                {BUCKETS.map((b) => (
                  <th key={b} className="text-center py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${BUCKET_COLORS[b]}`}>{BUCKET_LABELS[b]}</span>
                  </th>
                ))}
                <th className="text-right py-2.5 pl-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {quarters.map((q) => {
                const isCurrent = q === settings.currentQuarter;
                const rowTotal = BUCKETS.reduce((s, b) => s + matrix[q][b].planned, 0);
                const rowCount = BUCKETS.reduce((s, b) => s + matrix[q][b].count, 0);
                return (
                  <tr key={q} className={isCurrent ? 'bg-indigo-50/50' : 'hover:bg-slate-50/50'}>
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">{q}</span>
                        {isCurrent && <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">Now</span>}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{formatINR(qBudgets[q])} budget</p>
                    </td>
                    {BUCKETS.map((b) => {
                      const cell = matrix[q][b];
                      const total = cell.actual + cell.reserved;
                      const pct = qBudgets[q] > 0 ? (cell.planned / qBudgets[q]) * 100 : 0;
                      return (
                        <td key={b} className="py-4 px-3 text-center align-top">
                          {cell.count === 0 ? (
                            <span className="text-xs text-slate-300">—</span>
                          ) : (
                            <div className="space-y-1">
                              <p className="font-semibold text-slate-800">{cell.count} event{cell.count !== 1 ? 's' : ''}</p>
                              <p className="text-xs text-slate-600 font-medium">{formatINR(cell.planned)}</p>
                              {cell.actual > 0 && (
                                <p className="text-xs text-blue-600">Spent: {formatINR(cell.actual)}</p>
                              )}
                              {cell.reserved > 0 && (
                                <p className="text-xs text-amber-600">Reserved: {formatINR(cell.reserved)}</p>
                              )}
                              {/* mini bar showing % of quarter budget */}
                              <div className="h-1 bg-slate-100 rounded-full overflow-hidden mx-auto w-16">
                                <div className={`h-full ${BUCKET_BAR_COLORS[b]} rounded-full`} style={{ width: `${Math.min(100, pct)}%` }} />
                              </div>
                              <p className="text-xs text-slate-400">{pct.toFixed(0)}% of Q</p>
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-4 pl-4 text-right align-top">
                      <p className="font-semibold text-slate-800">{rowCount} events</p>
                      <p className="text-xs text-slate-500 mt-0.5">{formatINR(rowTotal)}</p>
                      <p className={`text-xs font-medium mt-1 ${
                        qBudgets[q] > 0 && rowTotal / qBudgets[q] > 0.9 ? 'text-red-600' :
                        qBudgets[q] > 0 && rowTotal / qBudgets[q] > 0.7 ? 'text-amber-600' : 'text-green-600'
                      }`}>
                        {qBudgets[q] > 0 ? `${((rowTotal / qBudgets[q]) * 100).toFixed(0)}% used` : '—'}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Totals row */}
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50">
                <td className="py-3 pr-4">
                  <span className="font-semibold text-slate-700">Full Year</span>
                </td>
                {BUCKETS.map((b) => {
                  const total = quarters.reduce((s, q) => s + matrix[q][b].planned, 0);
                  const count = quarters.reduce((s, q) => s + matrix[q][b].count, 0);
                  return (
                    <td key={b} className="py-3 px-3 text-center">
                      {count > 0 ? (
                        <>
                          <p className="text-xs font-semibold text-slate-700">{count} events</p>
                          <p className="text-xs text-slate-500">{formatINR(total)}</p>
                        </>
                      ) : <span className="text-xs text-slate-300">—</span>}
                    </td>
                  );
                })}
                <td className="py-3 pl-4 text-right">
                  <p className="text-xs font-semibold text-slate-700">{events.length} events</p>
                  <p className="text-xs text-slate-500">{formatINR(events.reduce((s, e) => s + (e.budget?.totalEstimatedCost || 0), 0))}</p>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Budget Forecast */}
      {avgQSpend > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            Budget Forecast
          </h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs text-slate-500 mb-1">Avg Spend per Past Quarter</p>
              <p className="text-xl font-bold text-slate-800">{formatINR(avgQSpend)}</p>
              <p className="text-xs text-slate-400 mt-1">Based on {pastQuarters.length} past quarter{pastQuarters.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs text-slate-500 mb-1">Remaining Quarters</p>
              <p className="text-xl font-bold text-slate-800">{remainingQuarters.length}</p>
              <p className="text-xs text-slate-400 mt-1">{remainingQuarters.join(', ')}</p>
            </div>
            <div className={`rounded-lg p-4 ${forecastOverrun ? 'bg-red-50' : 'bg-green-50'}`}>
              <p className="text-xs text-slate-500 mb-1">Projected Year-end Spend</p>
              <p className={`text-xl font-bold ${forecastOverrun ? 'text-red-700' : 'text-green-700'}`}>{formatINR(projectedYearEnd)}</p>
              <p className={`text-xs mt-1 ${forecastOverrun ? 'text-red-500' : 'text-green-500'}`}>
                {forecastOverrun ? `₹${formatINR(projectedYearEnd - totalAnnual)} over budget` : `₹${formatINR(totalAnnual - projectedYearEnd)} under budget`}
              </p>
            </div>
            <div className="bg-indigo-50 rounded-lg p-4">
              <p className="text-xs text-slate-500 mb-1">Remaining Capacity</p>
              <p className="text-xl font-bold text-indigo-700">
                {formatINR(Math.max(0, totalAnnual - totalCommitted - (avgQSpend * (remainingQuarters.length - 1))))}
              </p>
              <p className="text-xs text-slate-400 mt-1">Safely committable now</p>
            </div>
          </div>
        </div>
      )}

      {/* Budget Settings */}
      <BudgetSettingsForm settings={settings} />

      {/* Full Event Budget Table */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-800">All Events — Budget Detail</h2>
            <p className="text-xs text-slate-400 mt-0.5">All {events.length} events, sorted by planned cost</p>
          </div>
        </div>
        {events.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <p className="text-sm">No events yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Event</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Quarter</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Bucket</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Stage</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Sponsorship</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Total Planned</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Actual Spent</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {allEventsSorted.map((e) => {
                  const planned = e.budget?.totalEstimatedCost || 0;
                  const actual = e.actualMetrics?.actualCost || 0;
                  const variance = actual > 0 ? actual - planned : 0;
                  const q = e.startDate ? getQuarter(e.startDate) : '—';
                  const isOverBudget = actual > 0 && variance > 0;
                  return (
                    <tr key={e.id} className={`hover:bg-slate-50 transition-colors ${isOverBudget ? 'bg-red-50/30' : ''}`}>
                      <td className="px-5 py-3">
                        <Link href={`/events/${e.id}`} className="font-medium text-slate-800 hover:text-indigo-600">{e.name}</Link>
                        <p className="text-xs text-slate-400 mt-0.5">{e.city} · {e.organizer}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">{q}</td>
                      <td className="px-4 py-3"><BucketBadge value={e.bucket} size="sm" /></td>
                      <td className="px-4 py-3"><StageBadge value={e.stage} size="sm" /></td>
                      <td className="px-4 py-3 text-right text-slate-500">{formatINR(e.budget?.sponsorshipCost || 0)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatINR(planned)}</td>
                      <td className="px-4 py-3 text-right font-medium text-blue-700">{actual > 0 ? formatINR(actual) : <span className="text-slate-300">—</span>}</td>
                      <td className={`px-4 py-3 text-right font-medium ${isOverBudget ? 'text-red-600' : actual > 0 && variance < 0 ? 'text-green-600' : 'text-slate-300'}`}>
                        {actual > 0 ? `${variance >= 0 ? '+' : ''}${formatINR(variance)}` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                  <td className="px-5 py-3 text-slate-700">Totals</td>
                  <td colSpan={3} />
                  <td className="px-4 py-3 text-right text-slate-500">{formatINR(events.reduce((s, e) => s + (e.budget?.sponsorshipCost || 0), 0))}</td>
                  <td className="px-4 py-3 text-right text-slate-800">{formatINR(events.reduce((s, e) => s + (e.budget?.totalEstimatedCost || 0), 0))}</td>
                  <td className="px-4 py-3 text-right text-blue-700">
                    {events.some(e => e.actualMetrics?.actualCost) ? formatINR(events.reduce((s, e) => s + (e.actualMetrics?.actualCost || 0), 0)) : '—'}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
