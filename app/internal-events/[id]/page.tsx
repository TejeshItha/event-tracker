import { readInternalEvent } from '@/lib/internal-storage';
import {
  INTERNAL_FORMAT_LABELS,
  INTERNAL_STAGE_LABELS,
  INTERNAL_STAGE_ORDER,
  InternalEventStage,
  Speaker,
} from '@/lib/internal-types';
import { formatINR } from '@/lib/classification';
import InternalEventActions from '@/components/internal-events/InternalEventActions';
import InternalChecklistClient from '@/components/internal-events/InternalChecklistClient';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar, MapPin, Globe, Users, Target, IndianRupee,
  CheckCircle2, Circle, Mic, ExternalLink, ArrowLeft,
} from 'lucide-react';

// ─── helpers ───────────────────────────────────────────────────────────────────

function pct(num: number, den: number) {
  return den > 0 ? Math.min(100, Math.round((num / den) * 100)) : 0;
}

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
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${map[stage]}`}>
      {INTERNAL_STAGE_LABELS[stage]}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="text-slate-400 w-32 shrink-0">{label}</span>
      <span className="text-slate-700 font-medium">{value}</span>
    </div>
  );
}

function MetricCard({ label, target, actual, isCurrency }: {
  label: string; target: number; actual?: number; isCurrency?: boolean;
}) {
  const fmt = (v: number) => isCurrency ? formatINR(v) : v.toString();
  const achieved = actual !== undefined && actual >= target && target > 0;
  const achievePct = pct(actual ?? 0, target);
  return (
    <div className="bg-slate-50 rounded-lg p-3 space-y-2">
      <p className="text-xs text-slate-500">{label}</p>
      <div className="flex items-baseline justify-between">
        <p className="text-lg font-bold text-slate-800">{target > 0 ? fmt(target) : '—'}</p>
        {actual !== undefined && actual > 0 && (
          <p className={`text-sm font-semibold ${achieved ? 'text-green-600' : 'text-amber-600'}`}>{fmt(actual)}</p>
        )}
      </div>
      {target > 0 && actual !== undefined && (
        <>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${achieved ? 'bg-green-500' : 'bg-amber-400'}`}
              style={{ width: `${achievePct}%` }}
            />
          </div>
          <p className="text-xs text-slate-400">
            {actual > 0 ? `${achievePct}% achieved` : 'No actuals yet'}
          </p>
        </>
      )}
    </div>
  );
}

// ─── Stage progress bar ────────────────────────────────────────────────────────

function StageProgress({ stage }: { stage: InternalEventStage }) {
  const idx = INTERNAL_STAGE_ORDER.indexOf(stage);
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {INTERNAL_STAGE_ORDER.map((s, i) => {
        const done = i < idx;
        const current = i === idx;
        return (
          <div key={s} className="flex items-center gap-1 shrink-0">
            <div className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${current ? 'bg-indigo-600 text-white' : done ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
              {done && <CheckCircle2 className="w-3 h-3 inline mr-0.5" />}
              {INTERNAL_STAGE_LABELS[s]}
            </div>
            {i < INTERNAL_STAGE_ORDER.length - 1 && (
              <div className={`w-4 h-0.5 rounded ${done ? 'bg-green-300' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function InternalEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await readInternalEvent(id);
  if (!event) notFound();

  const checklistDone = event.checklist?.filter((c) => c.completed).length ?? 0;
  const checklistTotal = event.checklist?.length ?? 0;
  const checklistPct = pct(checklistDone, checklistTotal);

  const hasActuals = !!event.actualMetrics;
  const showUpRate = event.actualMetrics && event.actualMetrics.registrations > 0
    ? pct(event.actualMetrics.actualAttendees, event.actualMetrics.registrations)
    : null;

  const budgetCostRows: { label: string; value: number }[] = [
    { label: 'Venue', value: event.budget.venueCost },
    { label: 'AV Equipment', value: event.budget.avEquipmentCost },
    { label: 'Catering', value: event.budget.cateringCost },
    { label: 'Speaker Fee', value: event.budget.speakerFeeCost },
    { label: 'Travel', value: event.budget.travelCost },
    { label: 'Decor', value: event.budget.decorCost },
    { label: 'Photography / Video', value: event.budget.photographyCost },
    { label: 'Marketing & Promo', value: event.budget.marketingPromoCost },
    { label: 'Gifts & Swag', value: event.budget.giftsSwagCost },
    { label: 'Platform & Tools', value: event.budget.platformToolsCost },
    { label: 'Miscellaneous', value: event.budget.miscCost },
  ].filter((r) => r.value > 0);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb */}
      <Link href="/internal-events" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> All Hosted Events
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg shrink-0">
              <Mic className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{event.name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-sm text-slate-500">{INTERNAL_FORMAT_LABELS[event.format]}</span>
                <span className="text-slate-300">·</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${event.mode === 'online' ? 'bg-blue-50 text-blue-600' : event.mode === 'offline' ? 'bg-slate-100 text-slate-600' : 'bg-violet-50 text-violet-600'}`}>
                  {event.mode.charAt(0).toUpperCase() + event.mode.slice(1)}
                </span>
                {event.isInviteOnly && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700">Invite-Only</span>}
                <StagePill stage={event.stage} />
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-slate-400 mb-1">Budget</p>
            <p className="text-2xl font-bold text-slate-800">{formatINR(event.budget.totalEstimatedCost)}</p>
            {event.budget.actualTotalCost !== undefined && (
              <p className={`text-sm font-medium ${event.budget.actualTotalCost > event.budget.totalEstimatedCost ? 'text-red-600' : 'text-green-600'}`}>
                Actual: {formatINR(event.budget.actualTotalCost)}
              </p>
            )}
          </div>
        </div>

        {/* Stage progress */}
        <div className="mb-4">
          <StageProgress stage={event.stage} />
        </div>

        {/* Actions */}
        <InternalEventActions
          eventId={event.id}
          currentStage={event.stage}
          hasActualMetrics={hasActuals}
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-3 gap-6">

        {/* Left column — details */}
        <div className="col-span-2 space-y-5">

          {/* Overview */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-800 mb-4">Event Details</h2>
            <div className="space-y-2.5">
              {event.theme && <InfoRow label="Theme / Topic" value={event.theme} />}
              {event.description && (
                <div className="text-sm">
                  <span className="text-slate-400 w-32 inline-block">Description</span>
                  <span className="text-slate-700">{event.description}</span>
                </div>
              )}
              <InfoRow
                label="Date"
                value={
                  event.startDate
                    ? new Date(event.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) +
                      (event.endDate && event.endDate !== event.startDate
                        ? ' — ' + new Date(event.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                        : '') +
                      (event.startTime ? ` · ${event.startTime}${event.endTime ? ` – ${event.endTime}` : ''}` : '')
                    : null
                }
              />
              {(event.mode === 'offline' || event.mode === 'hybrid') && (
                <InfoRow label="Venue / City" value={[event.venue, event.city].filter(Boolean).join(', ')} />
              )}
              {(event.mode === 'online' || event.mode === 'hybrid') && event.platformLink && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-slate-400 w-32 shrink-0">Platform Link</span>
                  <a href={event.platformLink} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">
                    Join Link <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {event.registrationLink && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-slate-400 w-32 shrink-0">Registration</span>
                  <a href={event.registrationLink} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">
                    Registration Page <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              <InfoRow label="Event Owner" value={event.eventOwner} />
              <InfoRow label="Marketing Owner" value={event.marketingOwner} />
              <InfoRow label="Sales Owner" value={event.salesOwner} />
              <InfoRow label="Primary Objective" value={event.primaryObjective} />
              {event.secondaryObjective && <InfoRow label="Secondary Objective" value={event.secondaryObjective} />}
              {event.targetAudience && <InfoRow label="Target Audience" value={event.targetAudience} />}
              {event.targetPersonas?.length > 0 && (
                <div className="text-sm">
                  <span className="text-slate-400 w-32 inline-block align-top">Target Personas</span>
                  <div className="inline-flex flex-wrap gap-1">
                    {event.targetPersonas.map((p) => (
                      <span key={p} className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-xs">{p}</span>
                    ))}
                  </div>
                </div>
              )}
              {event.targetIndustries?.length > 0 && (
                <div className="text-sm">
                  <span className="text-slate-400 w-32 inline-block align-top">Industries</span>
                  <div className="inline-flex flex-wrap gap-1">
                    {event.targetIndustries.map((ind) => (
                      <span key={ind} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">{ind}</span>
                    ))}
                  </div>
                </div>
              )}
              {event.notes && <InfoRow label="Notes" value={event.notes} />}
            </div>
          </div>

          {/* Speakers */}
          {event.speakers?.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Mic className="w-4 h-4 text-indigo-500" />
                Speakers ({event.speakers.length})
              </h2>
              <div className="space-y-3">
                {event.speakers.map((sp, i) => (
                  <div key={sp.id ?? i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {sp.name ? sp.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-800 text-sm">{sp.name || 'TBD'}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${sp.confirmed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {sp.confirmed ? 'Confirmed' : 'Pending'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{[sp.designation, sp.company].filter(Boolean).join(' · ')}</p>
                      {sp.topic && <p className="text-xs text-slate-600 mt-0.5 italic">"{sp.topic}"</p>}
                      {sp.notes && <p className="text-xs text-slate-400 mt-0.5">{sp.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metrics */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-500" />
              Metrics — Target vs Actual
            </h2>
            <div className="grid grid-cols-4 gap-3">
              <MetricCard label="Invites" target={event.targetMetrics.targetInvites} actual={event.actualMetrics?.invitesSent} />
              <MetricCard label="Registrations" target={event.targetMetrics.targetRegistrations} actual={event.actualMetrics?.registrations} />
              <MetricCard label="Attendees" target={event.targetMetrics.targetAttendees} actual={event.actualMetrics?.actualAttendees} />
              <MetricCard label="ICP Attendees" target={event.targetMetrics.targetIcpAttendees} actual={event.actualMetrics?.icpAttendees} />
              <MetricCard label="Meetings" target={event.targetMetrics.targetMeetings} actual={event.actualMetrics?.meetings} />
              <MetricCard label="Pipeline (₹)" target={event.targetMetrics.targetPipeline} actual={event.actualMetrics?.pipeline} isCurrency />
              <MetricCard label="Content Assets" target={event.targetMetrics.targetContentAssets} actual={event.actualMetrics?.contentAssetsCreated} />
              <MetricCard label="Social Posts" target={event.targetMetrics.targetSocialPosts} actual={event.actualMetrics?.socialMentions} />
            </div>

            {/* Actual detail breakdown */}
            {hasActuals && event.actualMetrics && (
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-sm">
                {showUpRate !== null && (
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Show-up Rate</p>
                    <p className={`text-xl font-bold ${showUpRate >= 60 ? 'text-green-600' : showUpRate >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                      {showUpRate}%
                    </p>
                    <p className="text-xs text-slate-400">{event.actualMetrics.actualAttendees} of {event.actualMetrics.registrations} registered</p>
                  </div>
                )}
                {event.actualMetrics.customerAttendees > 0 && (
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Audience Mix</p>
                    <div className="space-y-0.5 text-xs text-slate-600">
                      <p>Customers: {event.actualMetrics.customerAttendees}</p>
                      <p>Prospects: {event.actualMetrics.prospectAttendees}</p>
                      <p>Partners: {event.actualMetrics.partnerAttendees}</p>
                    </div>
                  </div>
                )}
                {event.actualMetrics.npsScore > 0 && (
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">NPS / Satisfaction Score</p>
                    <p className={`text-xl font-bold ${event.actualMetrics.npsScore >= 8 ? 'text-green-600' : event.actualMetrics.npsScore >= 6 ? 'text-amber-600' : 'text-red-500'}`}>
                      {event.actualMetrics.npsScore}/10
                    </p>
                  </div>
                )}
                {event.actualMetrics.followUpRequests > 0 && (
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Follow-up Requests</p>
                    <p className="text-xl font-bold text-slate-800">{event.actualMetrics.followUpRequests}</p>
                  </div>
                )}
                {event.actualMetrics.notes && (
                  <div className="col-span-2 bg-amber-50 rounded-lg p-3">
                    <p className="text-xs text-amber-700 font-medium mb-1">Post-Event Notes</p>
                    <p className="text-sm text-amber-800">{event.actualMetrics.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Post-event review */}
          {event.postEventReview && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-800 mb-4">Post-Event Review</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className={`rounded-lg p-3 text-center ${event.postEventReview.roiStatus === 'strong' ? 'bg-green-50' : event.postEventReview.roiStatus === 'moderate' ? 'bg-amber-50' : 'bg-red-50'}`}>
                  <p className="text-xs text-slate-500 mb-1">ROI Status</p>
                  <p className={`text-lg font-bold capitalize ${event.postEventReview.roiStatus === 'strong' ? 'text-green-700' : event.postEventReview.roiStatus === 'moderate' ? 'text-amber-700' : 'text-red-600'}`}>
                    {event.postEventReview.roiStatus}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-500 mb-1">Repeat Decision</p>
                  <p className="text-sm font-bold text-slate-700 capitalize">{event.postEventReview.repeatDecision.replace(/-/g, ' ')}</p>
                </div>
              </div>
              {event.postEventReview.whatWorkedWell && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-green-700 mb-1">✓ What worked well</p>
                  <p className="text-sm text-slate-700">{event.postEventReview.whatWorkedWell}</p>
                </div>
              )}
              {event.postEventReview.whatToImprove && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-amber-700 mb-1">⚠ What to improve</p>
                  <p className="text-sm text-slate-700">{event.postEventReview.whatToImprove}</p>
                </div>
              )}
              {event.postEventReview.lessonsLearned && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">Lessons learned</p>
                  <p className="text-sm text-slate-700">{event.postEventReview.lessonsLearned}</p>
                </div>
              )}
              <p className="text-xs text-slate-400 mt-3">
                Reviewed by {event.postEventReview.reviewedBy} on {event.postEventReview.reviewDate}
              </p>
            </div>
          )}
        </div>

        {/* Right column — checklist + budget */}
        <div className="space-y-5">

          {/* Checklist progress summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-800 text-sm">Planning Checklist</h2>
              <span className="text-xs text-slate-400">{checklistPct}%</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full rounded-full transition-all ${checklistPct === 100 ? 'bg-green-500' : checklistPct >= 50 ? 'bg-amber-400' : 'bg-blue-400'}`}
                style={{ width: `${checklistPct}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mb-4">{checklistDone} of {checklistTotal} tasks done</p>
            <InternalChecklistClient eventId={event.id} checklist={event.checklist ?? []} />
          </div>

          {/* Budget breakdown */}
          {budgetCostRows.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-800 text-sm mb-3 flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-indigo-500" />
                Budget Breakdown
              </h2>
              <div className="space-y-2">
                {budgetCostRows.map((row) => {
                  const w = Math.round((row.value / event.budget.totalEstimatedCost) * 100);
                  return (
                    <div key={row.label}>
                      <div className="flex justify-between text-xs text-slate-600 mb-0.5">
                        <span>{row.label}</span>
                        <span className="font-medium">{formatINR(row.value)}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${w}%` }} />
                      </div>
                    </div>
                  );
                })}
                <div className="pt-2 mt-2 border-t border-slate-100 flex justify-between text-sm">
                  <span className="font-semibold text-slate-700">Total</span>
                  <span className="font-bold text-indigo-600">{formatINR(event.budget.totalEstimatedCost)}</span>
                </div>
                {event.budget.budgetOwner && (
                  <p className="text-xs text-slate-400">Budget owner: {event.budget.budgetOwner}</p>
                )}
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-400 mb-1">Created</p>
            <p className="text-xs text-slate-600">{new Date(event.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            <p className="text-xs text-slate-400 mt-2 mb-1">Last updated</p>
            <p className="text-xs text-slate-600">{new Date(event.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
