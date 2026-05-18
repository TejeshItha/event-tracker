import { notFound } from 'next/navigation';
import { readEvent } from '@/lib/storage';
import { formatINR, formatINRFull, getBucketLabel, getCostPerMetric, getPipelineRatioLabel } from '@/lib/classification';
import { RecommendationBadge, BucketBadge, StageBadge, RiskBadge, ConfidenceBadge } from '@/components/ui/Badge';
import { ScoreBar } from '@/components/ui/ScoreRing';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Clock, Target, Users, IndianRupee, BarChart3, ClipboardList } from 'lucide-react';
import EventActions from '@/components/events/EventActions';

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await readEvent(id);
  if (!event) notFound();

  const score = event.scoreBreakdown;
  const totalCost = event.budget?.totalEstimatedCost || 0;
  const pipelineRatio = event.expectedMetrics?.pipeline > 0 ? (event.expectedMetrics.pipeline / totalCost) : 0;
  const ratioInfo = getPipelineRatioLabel(pipelineRatio);

  const scoreColor = (score?.totalScore || 0) >= 80 ? 'text-green-600' : (score?.totalScore || 0) >= 60 ? 'text-amber-600' : 'text-red-600';
  const scoreBg = (score?.totalScore || 0) >= 80 ? 'bg-green-50 border-green-200' : (score?.totalScore || 0) >= 60 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';

  const recColors = {
    'go': { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-800', icon: CheckCircle2 },
    'conditional-go': { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-800', icon: AlertTriangle },
    'no-go': { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800', icon: XCircle },
    'strategic-approval-required': { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-800', icon: Clock },
  };
  const rec = recColors[event.recommendation] || recColors['conditional-go'];
  const RecIcon = rec.icon;

  const completedChecks = event.checklist?.filter((c) => c.completed).length || 0;
  const totalChecks = event.checklist?.length || 0;
  const checklistPct = totalChecks > 0 ? Math.round((completedChecks / totalChecks) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back + Header */}
      <div>
        <Link href="/events" className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-2xl font-bold text-slate-900">{event.name}</h1>
              <BucketBadge value={event.bucket} />
              <StageBadge value={event.stage} />
            </div>
            <p className="text-slate-500 text-sm">
              {event.organizer && <span>{event.organizer} · </span>}
              {event.startDate && <span>{new Date(event.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} </span>}
              {event.endDate && event.endDate !== event.startDate && <span>– {new Date(event.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} </span>}
              {event.city && <span>· {event.city}</span>}
              {event.mode && <span> · {event.mode}</span>}
            </p>
          </div>
          <EventActions event={event} />
        </div>
      </div>

      {/* Recommendation Banner */}
      <div className={`rounded-xl border-2 ${rec.bg} ${rec.border} p-5`}>
        <div className="flex items-start gap-4">
          <RecIcon className={`w-8 h-8 flex-shrink-0 mt-0.5 ${rec.text}`} />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className={`text-xl font-bold ${rec.text}`}>
                Final Recommendation: {event.recommendation === 'go' ? 'Go' : event.recommendation === 'conditional-go' ? 'Conditional Go' : event.recommendation === 'no-go' ? 'No-Go' : 'Strategic Approval Required'}
              </h2>
              <span className={`text-2xl font-black ${scoreColor}`}>{score?.totalScore ?? '—'}<span className="text-sm font-normal text-slate-400">/100</span></span>
            </div>
            {event.recommendationReasons.length > 0 && (
              <ul className={`space-y-1 text-sm ${rec.text}`}>
                {event.recommendationReasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1 flex-shrink-0">·</span> {r}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Conditional Go Requirements */}
        {event.conditionalGoRequirements.length > 0 && (
          <div className="mt-4 pt-4 border-t border-amber-200">
            <p className="text-sm font-semibold text-amber-800 mb-2">Required Actions Before Approval:</p>
            <ol className="space-y-1.5">
              {event.conditionalGoRequirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                  <span className="font-bold flex-shrink-0">{i + 1}.</span> {req.condition}
                  <span className={`ml-auto flex-shrink-0 text-xs px-2 py-0.5 rounded ${req.status === 'met' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {req.status === 'met' ? 'Done' : 'Pending'}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* Score + Cost Overview */}
      <div className="grid grid-cols-3 gap-4">
        <div className={`rounded-xl border p-5 ${scoreBg}`}>
          <p className="text-xs font-medium text-slate-500 mb-1">Decision Score</p>
          <p className={`text-4xl font-black ${scoreColor}`}>{score?.totalScore ?? '—'}</p>
          <p className="text-xs text-slate-400 mt-1">out of 100</p>
          <div className="mt-3 flex gap-2 flex-wrap">
            <RecommendationBadge value={event.recommendation} size="sm" />
            {event.risk?.riskLevel && <RiskBadge value={event.risk.riskLevel} size="sm" />}
            {event.confidence?.overallConfidence && <ConfidenceBadge value={event.confidence.overallConfidence} size="sm" />}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500 mb-1">Total Estimated Cost</p>
          <p className="text-3xl font-bold text-slate-800">{formatINR(totalCost)}</p>
          <p className="text-xs text-slate-400 mt-1">{getBucketLabel(event.bucket)}</p>
          {event.budget?.sponsorshipCost > 0 && (
            <p className="text-xs text-slate-500 mt-2">Sponsorship: {formatINR(event.budget.sponsorshipCost)}</p>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500 mb-1">Pipeline-to-Cost Ratio</p>
          <p className={`text-3xl font-bold ${ratioInfo.color}`}>{pipelineRatio.toFixed(1)}x</p>
          <p className={`text-xs font-medium mt-1 ${ratioInfo.color}`}>{ratioInfo.label}</p>
          <p className="text-xs text-slate-500 mt-2">Expected pipeline: {formatINR(event.expectedMetrics?.pipeline || 0)}</p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Score Breakdown */}
        <div className="col-span-3 bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-indigo-500" /> Score Breakdown
          </h2>
          {score ? (
            <div className="space-y-3">
              <ScoreBar score={score.icpFit} label="ICP Fit" />
              <ScoreBar score={score.businessValue} label="Business Value" />
              <ScoreBar score={score.packageQuality} label="Package Quality" />
              <ScoreBar score={score.strategicValue} label="Strategic Value" />
              <ScoreBar score={score.salesReadiness} label="Sales Readiness" />
              <ScoreBar score={score.costEfficiency} label="Cost Efficiency" />
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Risk Penalty</span>
                  <span className="text-red-600 font-medium">−{score.riskPenalty}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Confidence Adjustment</span>
                  <span className={`font-medium ${score.confidenceAdjustment >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {score.confidenceAdjustment >= 0 ? '+' : ''}{score.confidenceAdjustment}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-2">
                  <span className="text-slate-700">Final Score</span>
                  <span className={scoreColor}>{score.totalScore} / 100</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Score not calculated yet.</p>
          )}
        </div>

        {/* Quick Info */}
        <div className="col-span-2 space-y-4">
          {/* Objective */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-indigo-500" /> Objectives
            </h2>
            <div className="space-y-1.5 text-sm">
              {event.primaryObjective && <p><span className="text-slate-400">Primary:</span> <span className="font-medium text-slate-700 capitalize">{event.primaryObjective.replace(/-/g, ' ')}</span></p>}
              {event.secondaryObjective && <p><span className="text-slate-400">Secondary:</span> <span className="text-slate-700 capitalize">{event.secondaryObjective.replace(/-/g, ' ')}</span></p>}
              {event.tertiaryObjective && <p><span className="text-slate-400">Tertiary:</span> <span className="text-slate-700 capitalize">{event.tertiaryObjective.replace(/-/g, ' ')}</span></p>}
            </div>
          </div>

          {/* Audience */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-indigo-500" /> Audience Fit
            </h2>
            <div className="space-y-1.5 text-sm">
              <p><span className="text-slate-400">Attendees:</span> <span className="font-medium">{event.audience?.expectedAttendees?.toLocaleString() || '—'}</span></p>
              <p><span className="text-slate-400">ICP Match:</span> <span className="font-medium">{event.audience?.icpPercentage || 0}%</span></p>
              <p><span className="text-slate-400">Named Accounts:</span> <span className="font-medium">{event.audience?.namedTargetAccounts || 0}</span></p>
              <p><span className="text-slate-400">Seniority:</span> <span className="capitalize font-medium">{event.audience?.audienceSeniority || '—'}</span></p>
              <p><span className="text-slate-400">Fit:</span> <span className={`font-semibold capitalize ${event.audience?.audienceFit === 'strong' ? 'text-green-600' : event.audience?.audienceFit === 'moderate' ? 'text-amber-600' : 'text-red-600'}`}>{event.audience?.audienceFit || '—'}</span></p>
            </div>
          </div>

          {/* Checklist Progress */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
              <ClipboardList className="w-4 h-4 text-indigo-500" /> Checklist
            </h2>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${checklistPct}%` }} />
              </div>
              <span className="text-sm font-semibold text-slate-700">{checklistPct}%</span>
            </div>
            <p className="text-xs text-slate-400">{completedChecks} of {totalChecks} tasks completed</p>
            <Link href={`/events/${event.id}/checklist`} className="text-xs text-indigo-600 hover:underline mt-2 inline-block">
              View full checklist →
            </Link>
          </div>
        </div>
      </div>

      {/* Expected vs Actual Metrics */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-indigo-500" /> Expected Metrics
        </h2>
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'Total Leads', exp: event.expectedMetrics?.leads, act: event.actualMetrics?.leads },
            { label: 'ICP Leads', exp: event.expectedMetrics?.icpLeads, act: event.actualMetrics?.icpLeads },
            { label: 'MQLs', exp: event.expectedMetrics?.mqls, act: event.actualMetrics?.mqls },
            { label: 'SQLs', exp: event.expectedMetrics?.sqls, act: event.actualMetrics?.sqls },
            { label: 'Meetings', exp: event.expectedMetrics?.meetings, act: event.actualMetrics?.meetings },
            { label: 'Demos', exp: event.expectedMetrics?.demos, act: event.actualMetrics?.demos },
            { label: 'Opportunities', exp: event.expectedMetrics?.opportunities, act: event.actualMetrics?.opportunities },
            { label: 'Pipeline', exp: event.expectedMetrics?.pipeline, act: event.actualMetrics?.pipeline, isCurrency: true },
            { label: 'Partner Conv.', exp: event.expectedMetrics?.partnerConversations, act: event.actualMetrics?.partnerConversations },
            { label: 'Cust. Meetings', exp: event.expectedMetrics?.customerMeetings, act: event.actualMetrics?.customerMeetings },
          ].map((m) => (
            <div key={m.label} className="text-center bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">{m.label}</p>
              <p className="text-lg font-bold text-slate-800">{m.isCurrency ? formatINR(m.exp || 0) : (m.exp ?? '—')}</p>
              <p className="text-xs text-slate-400">Expected</p>
              {m.act !== undefined && m.act > 0 && (
                <>
                  <p className={`text-base font-semibold mt-1 ${(m.act || 0) >= (m.exp || 0) ? 'text-green-600' : 'text-amber-600'}`}>
                    {m.isCurrency ? formatINR(m.act) : m.act}
                  </p>
                  <p className="text-xs text-slate-400">Actual</p>
                </>
              )}
            </div>
          ))}
        </div>
        {totalCost > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-4 gap-3">
            {[
              { label: 'Cost per Lead', val: getCostPerMetric(totalCost, event.expectedMetrics?.leads || 0) },
              { label: 'Cost per ICP Lead', val: getCostPerMetric(totalCost, event.expectedMetrics?.icpLeads || 0) },
              { label: 'Cost per SQL', val: getCostPerMetric(totalCost, event.expectedMetrics?.sqls || 0) },
              { label: 'Cost per Meeting', val: getCostPerMetric(totalCost, event.expectedMetrics?.meetings || 0) },
            ].map((m) => (
              <div key={m.label} className="text-center bg-slate-50 rounded-lg p-2">
                <p className="text-xs text-slate-500">{m.label}</p>
                <p className="text-sm font-bold text-slate-800">{m.val > 0 ? formatINR(m.val) : '—'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Budget Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
          <IndianRupee className="w-4 h-4 text-indigo-500" /> Budget Breakdown
        </h2>
        <div className="grid grid-cols-4 gap-3 text-sm">
          {[
            { label: 'Sponsorship', val: event.budget?.sponsorshipCost },
            { label: 'Booth', val: event.budget?.boothCost },
            { label: 'Travel', val: event.budget?.travelCost },
            { label: 'Stay', val: event.budget?.stayCost },
            { label: 'Local Transport', val: event.budget?.localTransportCost },
            { label: 'Team Cost', val: event.budget?.teamCost },
            { label: 'Booth Materials', val: event.budget?.boothMaterialCost },
            { label: 'Merchandise', val: event.budget?.merchandiseCost },
            { label: 'Brochures', val: event.budget?.brochureCost },
            { label: 'Content', val: event.budget?.contentProductionCost },
            { label: 'Photography', val: event.budget?.photographyCost },
            { label: 'Paid Promo', val: event.budget?.paidPromotionCost },
            { label: 'Miscellaneous', val: event.budget?.miscCost },
          ].filter((b) => b.val && b.val > 0).map((b) => (
            <div key={b.label} className="flex justify-between bg-slate-50 rounded px-3 py-2">
              <span className="text-slate-500">{b.label}</span>
              <span className="font-medium text-slate-700">{formatINR(b.val || 0)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between font-semibold">
          <span className="text-slate-700">Total Estimated Cost</span>
          <span className="text-slate-900 text-lg">{formatINRFull(totalCost)}</span>
        </div>
        {event.actualMetrics?.actualCost && (
          <div className="flex justify-between font-semibold mt-1">
            <span className="text-slate-700">Actual Cost</span>
            <span className={`text-lg ${event.actualMetrics.actualCost > totalCost ? 'text-red-600' : 'text-green-600'}`}>
              {formatINRFull(event.actualMetrics.actualCost)}
            </span>
          </div>
        )}
      </div>

      {/* Package Assets */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-800 mb-4">Package Assets</h2>
        <div className="grid grid-cols-3 gap-3 text-sm">
          {([
            ['logoPlacement','Logo Placement'],['websiteListing','Website Listing'],['bannerPlacement','Banner'],
            ['socialMediaMentions','Social Mentions'],['booth','Booth / Stall'],['demoTable','Demo Table'],
            ['networkingAccess','Networking Access'],['vipLoungeAccess','VIP Lounge'],['workshop','Workshop'],
            ['roundtable','Roundtable'],['attendeeList','Attendee List'],['leadScanner','Lead Scanner'],
            ['speakingSlot','Speaking Slot'],['keynote','Keynote'],['panelParticipation','Panel'],
            ['firesideChatModerator','Fireside/Moderator'],['analystMeeting','Analyst Meeting'],
            ['mediaInterview','Media Interview'],['emailCampaignInclusion','Email Inclusion'],
            ['meetingSchedulerAccess','Meeting Scheduler'],['hostedBuyerMeetings','Hosted Buyer Meetings'],
            ['videoRights','Video Rights'],['photographyRights','Photo Rights'],['oneonOneMeetings','1-on-1 Meetings'],
          ] as [string, string][]).map(([key, label]) => {
            const included = !!(event.package as any)?.[key];
            return (
              <div key={key} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${included ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-400'}`}>
                {included ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> : <XCircle className="w-3.5 h-3.5 flex-shrink-0" />}
                <span className={`text-xs ${included ? 'font-medium' : ''}`}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      {event.notes && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-2">Notes</h2>
          <p className="text-sm text-slate-600">{event.notes}</p>
        </div>
      )}

      {/* Post-event review (if exists) */}
      {event.postEventReview && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Post-Event Review</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500 mb-1">ROI Status</p>
              <p className="font-medium capitalize">{event.postEventReview.roiStatus.replace(/-/g, ' ')}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Repeat Decision</p>
              <p className="font-medium capitalize">{event.postEventReview.repeatDecision.replace(/-/g, ' ')}</p>
            </div>
            {event.postEventReview.lessonsLearned && (
              <div className="col-span-2">
                <p className="text-slate-500 mb-1">Lessons Learned</p>
                <p>{event.postEventReview.lessonsLearned}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
