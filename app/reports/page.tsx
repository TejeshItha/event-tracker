import { readEvents, readSettings } from '@/lib/storage';
import { formatINR, getCostPerMetric, getPipelineRatioLabel } from '@/lib/classification';
import { RecommendationBadge, BucketBadge, ROIBadge } from '@/components/ui/Badge';
import { BUCKET_RANGES, FORMAT_LABELS } from '@/lib/types';
import Link from 'next/link';

// ─── helpers ──────────────────────────────────────────────────────────────────

function avg(arr: number[]) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function pct(num: number, den: number) {
  return den > 0 ? Math.round((num / den) * 100) : 0;
}

function scoreColor(s: number) {
  return s >= 80 ? 'text-green-600' : s >= 60 ? 'text-amber-600' : 'text-red-500';
}

function scoreBg(s: number) {
  return s >= 80 ? 'bg-green-500' : s >= 60 ? 'bg-amber-400' : 'bg-red-400';
}

const QUARTER_MONTHS: Record<string, number[]> = {
  Q1: [0, 1, 2],
  Q2: [3, 4, 5],
  Q3: [6, 7, 8],
  Q4: [9, 10, 11],
};
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const BUCKETS = ['low-cost', 'micro', 'mini', 'major', 'strategic'] as const;
const BUCKET_COLORS: Record<string, string> = {
  'low-cost': 'bg-slate-400',
  micro: 'bg-blue-400',
  mini: 'bg-violet-500',
  major: 'bg-amber-500',
  strategic: 'bg-rose-500',
};
const BUCKET_TEXT: Record<string, string> = {
  'low-cost': 'text-slate-600',
  micro: 'text-blue-600',
  mini: 'text-violet-600',
  major: 'text-amber-600',
  strategic: 'text-rose-600',
};

// ─── subcomponents ─────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent ?? 'text-slate-800'}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function MiniBar({ value, max, color = 'bg-indigo-500', height = 'h-2' }: { value: number; max: number; color?: string; height?: string }) {
  const w = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className={`w-full ${height} bg-slate-100 rounded-full overflow-hidden`}>
      <div className={`${height} ${color} rounded-full`} style={{ width: `${w}%` }} />
    </div>
  );
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="px-6 py-4 border-b border-slate-100">
      <h2 className="font-semibold text-slate-800">{title}</h2>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── page ──────────────────────────────────────────────────────────────────────

export default async function ReportsPage() {
  const [events, settings] = await Promise.all([readEvents(), readSettings()]);
  const { currentYear } = settings;

  // ── Attended subset ────────────────────────────────────────────────────────
  const attended = events.filter((e) => ['attended', 'roi-review', 'archived'].includes(e.stage));

  const totals = attended.reduce(
    (acc, e) => {
      acc.cost += e.actualMetrics?.actualCost || e.budget?.totalEstimatedCost || 0;
      acc.leads += e.actualMetrics?.leads || 0;
      acc.icpLeads += e.actualMetrics?.icpLeads || 0;
      acc.sqls += e.actualMetrics?.sqls || 0;
      acc.pipeline += e.actualMetrics?.pipeline || 0;
      acc.meetings += e.actualMetrics?.meetings || 0;
      acc.expPipeline += e.expectedMetrics?.pipeline || 0;
      return acc;
    },
    { cost: 0, leads: 0, icpLeads: 0, sqls: 0, pipeline: 0, meetings: 0, expPipeline: 0 },
  );

  const overallRatio = totals.cost > 0 ? totals.pipeline / totals.cost : 0;
  const ratioInfo = getPipelineRatioLabel(overallRatio);

  // ── Event Velocity: events by month ────────────────────────────────────────
  const monthCounts: number[] = Array(12).fill(0);
  const monthCostArr: number[] = Array(12).fill(0);
  events.forEach((e) => {
    const d = e.startDate ? new Date(e.startDate) : null;
    if (d && d.getFullYear() === currentYear) {
      const m = d.getMonth();
      monthCounts[m]++;
      monthCostArr[m] += e.budget?.totalEstimatedCost || 0;
    }
  });
  const maxMonthCount = Math.max(...monthCounts, 1);

  // Peak months
  const peakMonthIdx = monthCounts.indexOf(Math.max(...monthCounts));
  const totalYearEvents = monthCounts.reduce((a, b) => a + b, 0);

  // ── ROI Trend: expected vs actual pipeline by quarter ──────────────────────
  type QData = { expPipeline: number; actPipeline: number; cost: number; count: number; attended: number };
  const quarterData: Record<string, QData> = { Q1: { expPipeline: 0, actPipeline: 0, cost: 0, count: 0, attended: 0 }, Q2: { expPipeline: 0, actPipeline: 0, cost: 0, count: 0, attended: 0 }, Q3: { expPipeline: 0, actPipeline: 0, cost: 0, count: 0, attended: 0 }, Q4: { expPipeline: 0, actPipeline: 0, cost: 0, count: 0, attended: 0 } };
  events.forEach((e) => {
    const d = e.startDate ? new Date(e.startDate) : null;
    if (!d || d.getFullYear() !== currentYear) return;
    const m = d.getMonth();
    const q = m < 3 ? 'Q1' : m < 6 ? 'Q2' : m < 9 ? 'Q3' : 'Q4';
    quarterData[q].count++;
    quarterData[q].cost += e.budget?.totalEstimatedCost || 0;
    quarterData[q].expPipeline += e.expectedMetrics?.pipeline || 0;
    if (['attended', 'roi-review', 'archived'].includes(e.stage)) {
      quarterData[q].actPipeline += e.actualMetrics?.pipeline || 0;
      quarterData[q].attended++;
    }
  });
  const maxQPipeline = Math.max(...Object.values(quarterData).map((q) => Math.max(q.expPipeline, q.actPipeline)), 1);

  // ── Performance by Bucket ──────────────────────────────────────────────────
  type BucketStat = { count: number; scores: number[]; costs: number[]; icpLeads: number[]; pipelines: number[]; expPipelines: number[]; roi: ('strong' | 'moderate' | 'weak' | 'strategic' | 'failed' | 'pending')[]; };
  const byBucket: Record<string, BucketStat> = {};
  BUCKETS.forEach((b) => { byBucket[b] = { count: 0, scores: [], costs: [], icpLeads: [], pipelines: [], expPipelines: [], roi: [] }; });

  events.forEach((e) => {
    const b = byBucket[e.bucket];
    if (!b) return;
    b.count++;
    if (e.scoreBreakdown?.totalScore) b.scores.push(e.scoreBreakdown.totalScore);
    b.costs.push(e.budget?.totalEstimatedCost || 0);
    b.expPipelines.push(e.expectedMetrics?.pipeline || 0);
    if (e.actualMetrics) {
      b.icpLeads.push(e.actualMetrics.icpLeads || 0);
      b.pipelines.push(e.actualMetrics.pipeline || 0);
    }
    if (e.postEventReview?.roiStatus) b.roi.push(e.postEventReview.roiStatus);
  });

  const bucketStats = BUCKETS.map((b) => {
    const s = byBucket[b];
    const avgCost = avg(s.costs);
    const avgPipeline = avg(s.pipelines);
    const ratio = avgCost > 0 ? avgPipeline / avgCost : 0;
    return {
      bucket: b,
      label: BUCKET_RANGES[b].label,
      count: s.count,
      avgScore: Math.round(avg(s.scores)),
      avgCost,
      avgExpPipeline: avg(s.expPipelines),
      avgActPipeline: avgPipeline,
      avgIcpLeads: Math.round(avg(s.icpLeads) * 10) / 10,
      pipelineRatio: ratio,
      strongROI: s.roi.filter((r) => r === 'strong').length,
      totalROI: s.roi.length,
    };
  }).filter((b) => b.count > 0);

  const maxBucketCost = Math.max(...bucketStats.map((b) => b.avgCost), 1);
  const maxBucketPipeline = Math.max(...bucketStats.map((b) => b.avgExpPipeline), 1);

  // ── Performance by Format ──────────────────────────────────────────────────
  type FmtStat = { count: number; scores: number[]; costs: number[]; icpLeads: number[]; pipelines: number[]; sqls: number[]; meetings: number[] };
  const byFormat: Record<string, FmtStat> = {};

  events.forEach((e) => {
    const f = e.format || 'other';
    if (!byFormat[f]) byFormat[f] = { count: 0, scores: [], costs: [], icpLeads: [], pipelines: [], sqls: [], meetings: [] };
    const s = byFormat[f];
    s.count++;
    if (e.scoreBreakdown?.totalScore) s.scores.push(e.scoreBreakdown.totalScore);
    s.costs.push(e.budget?.totalEstimatedCost || 0);
    if (e.actualMetrics) {
      s.icpLeads.push(e.actualMetrics.icpLeads || 0);
      s.pipelines.push(e.actualMetrics.pipeline || 0);
      s.sqls.push(e.actualMetrics.sqls || 0);
      s.meetings.push(e.actualMetrics.meetings || 0);
    }
  });

  const formatStats = Object.entries(byFormat)
    .map(([fmt, s]) => {
      const avgCost = avg(s.costs);
      const avgPipeline = avg(s.pipelines);
      return {
        format: fmt,
        label: FORMAT_LABELS[fmt as keyof typeof FORMAT_LABELS] ?? fmt,
        count: s.count,
        avgScore: Math.round(avg(s.scores)),
        avgCost,
        avgPipeline,
        avgIcpLeads: Math.round(avg(s.icpLeads) * 10) / 10,
        avgSqls: Math.round(avg(s.sqls) * 10) / 10,
        ratio: avgCost > 0 ? avgPipeline / avgCost : 0,
      };
    })
    .sort((a, b) => b.count - a.count);

  const maxFmtPipeline = Math.max(...formatStats.map((f) => f.avgPipeline), 1);

  // ── ICP Quality by Bucket ──────────────────────────────────────────────────
  // ICP quality = icpLeads / leads (conversion to ICP)
  type IcpStat = { totalLeads: number; totalIcp: number; count: number };
  const icpByBucket: Record<string, IcpStat> = {};
  BUCKETS.forEach((b) => { icpByBucket[b] = { totalLeads: 0, totalIcp: 0, count: 0 }; });
  attended.forEach((e) => {
    const s = icpByBucket[e.bucket];
    if (!s) return;
    s.totalLeads += e.actualMetrics?.leads || 0;
    s.totalIcp += e.actualMetrics?.icpLeads || 0;
    s.count++;
  });

  // ── City/Geo analysis ──────────────────────────────────────────────────────
  const cityCount: Record<string, number> = {};
  events.forEach((e) => { if (e.city) cityCount[e.city] = (cityCount[e.city] || 0) + 1; });
  const topCities = Object.entries(cityCount).sort((a, b) => b[1] - a[1]).slice(0, 8);

  // ── Decision Summary ───────────────────────────────────────────────────────
  const decisionCounts = {
    go: events.filter((e) => e.recommendation === 'go').length,
    'conditional-go': events.filter((e) => e.recommendation === 'conditional-go').length,
    'no-go': events.filter((e) => e.recommendation === 'no-go').length,
    strategic: events.filter((e) => e.recommendation === 'strategic-approval-required').length,
  };
  const totalDecided = Object.values(decisionCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics & ROI Reports</h1>
        <p className="text-slate-500 text-sm mt-0.5">Performance overview for {currentYear} · {events.length} total events tracked</p>
      </div>

      {/* ── Overall Performance ─────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200">
        <SectionHeader title="Overall Performance — Attended Events" sub={`${attended.length} events completed`} />
        {attended.length === 0 ? (
          <p className="text-sm text-slate-400 p-6">No attended events yet. ROI data will appear here after events are completed.</p>
        ) : (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { label: 'Events Attended', value: attended.length },
                { label: 'Total Spend', value: formatINR(totals.cost) },
                { label: 'Total Leads', value: totals.leads },
                { label: 'ICP Leads', value: totals.icpLeads },
                { label: 'SQLs', value: totals.sqls },
                { label: 'Pipeline Generated', value: formatINR(totals.pipeline) },
              ].map((m) => (
                <div key={m.label} className="text-center bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">{m.label}</p>
                  <p className="text-xl font-bold text-slate-800">{m.value}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Cost per Lead', val: getCostPerMetric(totals.cost, totals.leads) },
                { label: 'Cost per ICP Lead', val: getCostPerMetric(totals.cost, totals.icpLeads) },
                { label: 'Cost per SQL', val: getCostPerMetric(totals.cost, totals.sqls) },
                { label: 'Cost per Meeting', val: getCostPerMetric(totals.cost, totals.meetings) },
              ].map((m) => (
                <div key={m.label} className="text-center bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">{m.label}</p>
                  <p className="text-lg font-bold text-slate-700">{m.val > 0 ? formatINR(m.val) : '—'}</p>
                </div>
              ))}
            </div>
            {/* Pipeline vs expected */}
            <div className="bg-slate-50 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <p className="text-xs text-slate-500 mb-2">Pipeline Achievement vs Target</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Actual {formatINR(totals.pipeline)}</span>
                      <span>Target {formatINR(totals.expPipeline)}</span>
                    </div>
                    <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-3 rounded-full ${totals.pipeline >= totals.expPipeline ? 'bg-green-500' : 'bg-amber-400'}`}
                        style={{ width: `${Math.min(100, pct(totals.pipeline, totals.expPipeline))}%` }}
                      />
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${totals.pipeline >= totals.expPipeline ? 'text-green-600' : 'text-amber-600'}`}>
                    {pct(totals.pipeline, totals.expPipeline)}%
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 border border-slate-200">
                <div className={`w-2.5 h-2.5 rounded-full ${ratioInfo.color === 'green' ? 'bg-green-500' : ratioInfo.color === 'amber' ? 'bg-amber-400' : ratioInfo.color === 'blue' ? 'bg-blue-500' : 'bg-slate-300'}`} />
                <div>
                  <p className="text-xs text-slate-500">Pipeline-to-Cost</p>
                  <p className="text-sm font-bold text-slate-700">{overallRatio.toFixed(1)}x · {ratioInfo.label}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Decision Distribution ───────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200">
        <SectionHeader title="Decision Distribution" sub="How events scored across the Go / No-Go framework" />
        <div className="p-6">
          {totalDecided === 0 ? (
            <p className="text-sm text-slate-400">No scored events yet.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-1 h-8 rounded-lg overflow-hidden">
                {decisionCounts.go > 0 && (
                  <div className="bg-green-500 h-full flex items-center justify-center text-white text-xs font-medium" style={{ width: `${pct(decisionCounts.go, totalDecided)}%` }}>
                    {decisionCounts.go}
                  </div>
                )}
                {decisionCounts['conditional-go'] > 0 && (
                  <div className="bg-amber-400 h-full flex items-center justify-center text-white text-xs font-medium" style={{ width: `${pct(decisionCounts['conditional-go'], totalDecided)}%` }}>
                    {decisionCounts['conditional-go']}
                  </div>
                )}
                {decisionCounts.strategic > 0 && (
                  <div className="bg-indigo-500 h-full flex items-center justify-center text-white text-xs font-medium" style={{ width: `${pct(decisionCounts.strategic, totalDecided)}%` }}>
                    {decisionCounts.strategic}
                  </div>
                )}
                {decisionCounts['no-go'] > 0 && (
                  <div className="bg-red-400 h-full flex items-center justify-center text-white text-xs font-medium" style={{ width: `${pct(decisionCounts['no-go'], totalDecided)}%` }}>
                    {decisionCounts['no-go']}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Go', count: decisionCounts.go, color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Conditional Go', count: decisionCounts['conditional-go'], color: 'text-amber-600', bg: 'bg-amber-50' },
                  { label: 'Strategic', count: decisionCounts.strategic, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { label: 'No-Go', count: decisionCounts['no-go'], color: 'text-red-600', bg: 'bg-red-50' },
                ].map((d) => (
                  <div key={d.label} className={`${d.bg} rounded-lg p-3 text-center`}>
                    <p className={`text-2xl font-bold ${d.color}`}>{d.count}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{d.label}</p>
                    <p className="text-xs text-slate-400">{pct(d.count, totalDecided)}% of total</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Event Velocity ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200">
        <SectionHeader title={`Event Velocity — ${currentYear}`} sub="Number of events by month · size = event count" />
        <div className="p-6">
          {totalYearEvents === 0 ? (
            <p className="text-sm text-slate-400">No events with start dates in {currentYear}.</p>
          ) : (
            <div className="space-y-4">
              {/* Bar chart */}
              <div className="flex items-end gap-1.5 h-32">
                {MONTH_NAMES.map((name, i) => {
                  const count = monthCounts[i];
                  const h = maxMonthCount > 0 ? Math.max(4, Math.round((count / maxMonthCount) * 100)) : 4;
                  const isQ1 = i < 3, isQ2 = i >= 3 && i < 6, isQ3 = i >= 6 && i < 9;
                  const barColor = isQ1 ? 'bg-blue-400' : isQ2 ? 'bg-violet-500' : isQ3 ? 'bg-amber-400' : 'bg-rose-400';
                  const isPeak = i === peakMonthIdx && count > 0;
                  return (
                    <div key={name} className="flex-1 flex flex-col items-center gap-1">
                      {count > 0 && <span className="text-xs font-medium text-slate-600">{count}</span>}
                      <div className="w-full flex items-end" style={{ height: '96px' }}>
                        <div
                          className={`w-full rounded-t ${barColor} ${isPeak ? 'ring-2 ring-offset-1 ring-slate-400' : ''} transition-all`}
                          style={{ height: count > 0 ? `${h}%` : '2px', opacity: count === 0 ? 0.2 : 1 }}
                        />
                      </div>
                      <span className="text-xs text-slate-400">{name}</span>
                    </div>
                  );
                })}
              </div>
              {/* Quarter labels */}
              <div className="grid grid-cols-4 gap-1.5 text-center">
                {['Q1', 'Q2', 'Q3', 'Q4'].map((q, qi) => {
                  const qCount = QUARTER_MONTHS[q].reduce((s, m) => s + monthCounts[m], 0);
                  const colors = ['text-blue-600', 'text-violet-600', 'text-amber-600', 'text-rose-600'];
                  return (
                    <div key={q} className="bg-slate-50 rounded-lg py-1.5 px-2">
                      <p className={`text-xs font-semibold ${colors[qi]}`}>{q}</p>
                      <p className="text-sm font-bold text-slate-700">{qCount} events</p>
                      <p className="text-xs text-slate-400">{formatINR(QUARTER_MONTHS[q].reduce((s, m) => s + monthCostArr[m], 0))}</p>
                    </div>
                  );
                })}
              </div>
              {peakMonthIdx >= 0 && monthCounts[peakMonthIdx] > 0 && (
                <p className="text-xs text-slate-500 text-center">
                  Peak month: <span className="font-medium text-slate-700">{MONTH_NAMES[peakMonthIdx]}</span> with {monthCounts[peakMonthIdx]} event{monthCounts[peakMonthIdx] !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── ROI Trend by Quarter ────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200">
        <SectionHeader title="ROI Trend by Quarter" sub="Expected vs actual pipeline — current year" />
        <div className="p-6">
          <div className="grid grid-cols-4 gap-4">
            {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((q, qi) => {
              const d = quarterData[q];
              const achieved = d.actPipeline >= d.expPipeline && d.expPipeline > 0;
              const pctAchieved = pct(d.actPipeline, d.expPipeline);
              const qBudget = [settings.q1Budget, settings.q2Budget, settings.q3Budget, settings.q4Budget][qi];
              const colors = ['bg-blue-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500'];
              const textColors = ['text-blue-600', 'text-violet-600', 'text-amber-600', 'text-rose-600'];
              return (
                <div key={q} className="bg-slate-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold ${textColors[qi]}`}>{q}</span>
                    <span className="text-xs text-slate-500">{d.count} events</span>
                  </div>
                  {/* Expected pipeline bar */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Expected</span>
                      <span>{d.expPipeline > 0 ? formatINR(d.expPipeline) : '—'}</span>
                    </div>
                    <MiniBar value={d.expPipeline} max={maxQPipeline} color="bg-slate-300" height="h-2" />
                  </div>
                  {/* Actual pipeline bar */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Actual ({d.attended} attended)</span>
                      <span>{d.actPipeline > 0 ? formatINR(d.actPipeline) : '—'}</span>
                    </div>
                    <MiniBar value={d.actPipeline} max={maxQPipeline} color={achieved ? 'bg-green-500' : colors[qi]} height="h-2" />
                  </div>
                  {d.expPipeline > 0 && d.actPipeline > 0 && (
                    <div className={`text-center text-xs font-semibold rounded-md py-1 ${achieved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {pctAchieved}% achieved
                    </div>
                  )}
                  <div className="pt-1 border-t border-slate-200">
                    <p className="text-xs text-slate-400">Budget</p>
                    <p className="text-xs font-medium text-slate-600">{formatINR(qBudget)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Spend {d.cost > 0 ? formatINR(d.cost) : '—'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Performance by Bucket ───────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200">
        <SectionHeader title="Performance by Budget Bucket" sub="Average metrics per event by cost tier" />
        {bucketStats.length === 0 ? (
          <p className="text-sm text-slate-400 p-6">No events yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Bucket</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Events</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Avg Score</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Avg Cost</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Avg Exp. Pipeline</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Avg ICP Leads</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Pipeline Ratio</th>
                  <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Cost vs Pipeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bucketStats.map((b) => {
                  const rInfo = getPipelineRatioLabel(b.pipelineRatio);
                  return (
                    <tr key={b.bucket} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${BUCKET_TEXT[b.bucket]} bg-slate-100`}>{b.label}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center font-medium text-slate-700">{b.count}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`font-bold text-base ${scoreColor(b.avgScore)}`}>{b.avgScore || '—'}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-slate-700">{b.avgCost > 0 ? formatINR(b.avgCost) : '—'}</td>
                      <td className="px-4 py-3.5 text-right text-slate-600">{b.avgExpPipeline > 0 ? formatINR(b.avgExpPipeline) : '—'}</td>
                      <td className="px-4 py-3.5 text-right text-slate-600">{b.avgIcpLeads > 0 ? b.avgIcpLeads : '—'}</td>
                      <td className="px-4 py-3.5 text-right">
                        {b.pipelineRatio > 0 ? (
                          <span className={`text-xs font-semibold ${rInfo.color === 'green' ? 'text-green-600' : rInfo.color === 'amber' ? 'text-amber-600' : rInfo.color === 'blue' ? 'text-blue-600' : 'text-slate-500'}`}>
                            {b.pipelineRatio.toFixed(1)}x
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-5 py-3.5 w-36">
                        <div className="space-y-1">
                          <MiniBar value={b.avgCost} max={maxBucketCost} color={BUCKET_COLORS[b.bucket]} height="h-1.5" />
                          <MiniBar value={b.avgExpPipeline} max={maxBucketPipeline} color="bg-green-400" height="h-1.5" />
                        </div>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs text-slate-400 flex items-center gap-0.5"><span className={`inline-block w-2 h-1.5 rounded-sm ${BUCKET_COLORS[b.bucket]}`} /> Cost</span>
                          <span className="text-xs text-slate-400 flex items-center gap-0.5"><span className="inline-block w-2 h-1.5 rounded-sm bg-green-400" /> Pipeline</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Performance by Format ───────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200">
        <SectionHeader title="Performance by Event Format" sub="Which event types generate the best outcomes" />
        {formatStats.length === 0 ? (
          <p className="text-sm text-slate-400 p-6">No events yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Format</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Events</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Avg Score</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Avg Cost</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Avg Pipeline</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Avg ICP Leads</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Avg SQLs</th>
                  <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Pipeline vs Peers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {formatStats.map((f, i) => {
                  const isTop = i === 0 && f.avgPipeline > 0;
                  return (
                    <tr key={f.format} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5">
                        <span className="font-medium text-slate-700">{f.label}</span>
                        {isTop && <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">Top</span>}
                      </td>
                      <td className="px-4 py-3.5 text-center font-medium text-slate-700">{f.count}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`font-bold ${scoreColor(f.avgScore)}`}>{f.avgScore || '—'}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right text-slate-600">{f.avgCost > 0 ? formatINR(f.avgCost) : '—'}</td>
                      <td className="px-4 py-3.5 text-right font-medium text-slate-700">{f.avgPipeline > 0 ? formatINR(f.avgPipeline) : '—'}</td>
                      <td className="px-4 py-3.5 text-right text-slate-600">{f.avgIcpLeads > 0 ? f.avgIcpLeads : '—'}</td>
                      <td className="px-4 py-3.5 text-right text-slate-600">{f.avgSqls > 0 ? f.avgSqls : '—'}</td>
                      <td className="px-5 py-3.5 w-28">
                        <MiniBar value={f.avgPipeline} max={maxFmtPipeline} color="bg-indigo-500" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── ICP Quality by Bucket ───────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200">
        <SectionHeader title="ICP Lead Quality by Bucket" sub="Of the leads captured at attended events, how many were ICP-fit?" />
        <div className="p-6">
          {attended.length === 0 ? (
            <p className="text-sm text-slate-400">Attend events to see ICP quality data.</p>
          ) : (
            <div className="space-y-3">
              {BUCKETS.filter((b) => icpByBucket[b].count > 0).map((b) => {
                const s = icpByBucket[b];
                const icpPct = pct(s.totalIcp, s.totalLeads);
                const barColor = icpPct >= 60 ? 'bg-green-500' : icpPct >= 35 ? 'bg-amber-400' : 'bg-red-400';
                const textClr = icpPct >= 60 ? 'text-green-600' : icpPct >= 35 ? 'text-amber-600' : 'text-red-500';
                return (
                  <div key={b} className="flex items-center gap-3">
                    <div className="w-32 shrink-0">
                      <span className={`text-xs font-semibold ${BUCKET_TEXT[b]}`}>{BUCKET_RANGES[b].label.replace(' / Experimental', '').replace(' Event', '')}</span>
                      <p className="text-xs text-slate-400">{s.count} event{s.count !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex-1">
                      <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-4 ${barColor} rounded-full transition-all`} style={{ width: `${icpPct}%` }} />
                      </div>
                    </div>
                    <div className="w-36 shrink-0 text-right">
                      <span className={`text-sm font-bold ${textClr}`}>{icpPct}% ICP</span>
                      <p className="text-xs text-slate-400">{s.totalIcp} / {s.totalLeads} leads</p>
                    </div>
                  </div>
                );
              })}
              <p className="text-xs text-slate-400 pt-1">
                <span className="inline-flex items-center gap-1 mr-3"><span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" /> ≥60% excellent</span>
                <span className="inline-flex items-center gap-1 mr-3"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> 35–59% acceptable</span>
                <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" /> &lt;35% poor</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Geographic Distribution ─────────────────────────────────────── */}
      {topCities.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200">
          <SectionHeader title="Geographic Distribution" sub="Cities with the most events" />
          <div className="p-6">
            <div className="space-y-2">
              {topCities.map(([city, count], i) => (
                <div key={city} className="flex items-center gap-3">
                  <span className="w-5 text-xs text-slate-400 text-right">{i + 1}</span>
                  <span className="w-28 text-sm font-medium text-slate-700 truncate">{city}</span>
                  <div className="flex-1">
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-2.5 bg-indigo-400 rounded-full" style={{ width: `${pct(count, topCities[0][1])}%` }} />
                    </div>
                  </div>
                  <span className="w-20 text-right text-xs font-semibold text-slate-600">{count} event{count !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── All Events Performance Table ────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200">
        <SectionHeader title="All Events — Performance Summary" sub="Complete list with expected vs actual results" />
        {events.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <p className="text-sm">No events yet. Add events to see performance data.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Event</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Bucket</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Decision</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Cost</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Exp. Pipeline</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Actual Pipeline</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Score</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {events
                  .sort((a, b) => {
                    const da = a.startDate ? new Date(a.startDate).getTime() : 0;
                    const db = b.startDate ? new Date(b.startDate).getTime() : 0;
                    return db - da;
                  })
                  .map((e) => {
                    const cost = e.actualMetrics?.actualCost || e.budget?.totalEstimatedCost || 0;
                    const expPipeline = e.expectedMetrics?.pipeline || 0;
                    const actPipeline = e.actualMetrics?.pipeline || 0;
                    return (
                      <tr key={e.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3">
                          <Link href={`/events/${e.id}`} className="font-medium text-slate-800 hover:text-indigo-600">{e.name}</Link>
                          <p className="text-xs text-slate-400">
                            {e.startDate ? new Date(e.startDate).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }) : '—'}
                            {e.city ? ` · ${e.city}` : ''}
                            {e.format ? ` · ${FORMAT_LABELS[e.format] ?? e.format}` : ''}
                          </p>
                        </td>
                        <td className="px-4 py-3"><BucketBadge value={e.bucket} size="sm" /></td>
                        <td className="px-4 py-3"><RecommendationBadge value={e.recommendation} size="sm" /></td>
                        <td className="px-4 py-3 text-right font-medium text-slate-700">{formatINR(cost)}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{expPipeline > 0 ? formatINR(expPipeline) : '—'}</td>
                        <td className="px-4 py-3 text-right">
                          {actPipeline > 0 ? (
                            <span className={`font-medium ${actPipeline >= expPipeline ? 'text-green-600' : 'text-amber-600'}`}>{formatINR(actPipeline)}</span>
                          ) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-bold ${scoreColor(e.scoreBreakdown?.totalScore || 0)}`}>
                            {e.scoreBreakdown?.totalScore ?? '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {e.postEventReview?.roiStatus
                            ? <ROIBadge value={e.postEventReview.roiStatus} size="sm" />
                            : <span className="text-xs text-slate-300">Pending</span>}
                        </td>
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
